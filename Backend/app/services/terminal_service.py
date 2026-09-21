import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
import concurrent.futures
from app.services.workspace_sync_service import WorkspaceSyncService
from app.services.file_watcher_service import FileWatcherService
import docker
import os

_active_terminal_sockets = {}
_main_loop = None

try:
    docker_client = docker.from_env()
except Exception as e:
    print(f"Warning: Docker not available. Terminal won't work. {e}")
    docker_client = None

class TerminalService:
    @staticmethod
    async def handle_terminal_session(websocket: WebSocket, workspace_id: int, terminal_id: str, db: Session):
        global _main_loop
        if _main_loop is None:
            _main_loop = asyncio.get_running_loop()
            
        await websocket.accept()
        
        if workspace_id not in _active_terminal_sockets:
            _active_terminal_sockets[workspace_id] = {}
        _active_terminal_sockets[workspace_id][terminal_id] = websocket
        
        if not docker_client:
            await websocket.send_text("Terminal requires Docker to be running on the host server.")
            await websocket.close()
            return

        # Phase 1: Forward Sync - DB to Physical Disk
        try:
            cwd_path = WorkspaceSyncService.sync_workspace_to_disk(workspace_id, db)
            if not cwd_path:
                cwd_path = os.getcwd()
        except Exception as e:
            print(f"Failed to sync workspace: {e}")
            cwd_path = os.getcwd()
            
        # Phase 2: Reverse Sync - Disk to DB Watcher
        FileWatcherService.start_watcher(workspace_id)
        
        container_name = f"cn_workspace_{workspace_id}"
        container = None
        
        # 1. Get or Create Container
        try:
            container = docker_client.containers.get(container_name)
            if container.status != "running":
                container.start()
        except docker.errors.NotFound:
            try:
                # Convert Windows path to a Linux-friendly format for Docker Desktop if necessary,
                # but Docker Desktop usually handles standard absolute paths fine (e.g. D:\path).
                container = docker_client.containers.run(
                    "node:20",
                    name=container_name,
                    detach=True,
                    tty=True,
                    stdin_open=True,
                    volumes={cwd_path: {'bind': '/workspace', 'mode': 'rw'}},
                    working_dir='/workspace',
                    mem_limit='512m',
                    network_mode='bridge'
                )
            except Exception as e:
                await websocket.send_text(f"Failed to spawn workspace container: {e}\r\n")
                await websocket.close()
                return
                
        # 2. Attach a new PTY shell session inside the container
        try:
            exec_id = docker_client.api.exec_create(
                container.id, 
                cmd='/bin/bash', 
                stdin=True, 
                stdout=True, 
                stderr=True, 
                tty=True
            )
            sock = docker_client.api.exec_start(exec_id['Id'], socket=True, tty=True)
            # Docker python SDK socket may be a raw socket object
            if hasattr(sock, '_sock'):
                sock = sock._sock
            sock.setblocking(False)
        except Exception as e:
            await websocket.send_text(f"Failed to attach terminal: {e}\r\n")
            await websocket.close()
            return

        async def read_from_pty():
            loop = asyncio.get_running_loop()
            try:
                while True:
                    # Raw socket reading
                    data = await loop.sock_recv(sock, 1024)
                    if data:
                        await websocket.send_text(data.decode('utf-8', errors='replace'))
                    else:
                        break # EOF
            except Exception as e:
                print(f"PTY read error: {e}")
            finally:
                try:
                    sock.close()
                except:
                    pass
                try:
                    await websocket.close()
                except:
                    pass

        async def read_from_ws():
            import json
            try:
                while True:
                    data = await websocket.receive_text()
                    try:
                        msg = json.loads(data)
                        if isinstance(msg, dict) and msg.get("type") == "resize":
                            cols = msg.get("cols")
                            rows = msg.get("rows")
                            if cols and rows:
                                try:
                                    docker_client.api.exec_resize(exec_id['Id'], height=int(rows), width=int(cols))
                                except:
                                    pass
                            continue
                    except ValueError:
                        pass
                    
                    loop = asyncio.get_running_loop()
                    await loop.sock_sendall(sock, data.encode('utf-8'))
            except WebSocketDisconnect:
                pass
            except Exception as e:
                print(f"WS read error: {e}")
            finally:
                try:
                    sock.close()
                except:
                    pass

        task1 = asyncio.create_task(read_from_pty())
        task2 = asyncio.create_task(read_from_ws())
        
        try:
            await asyncio.gather(task1, task2)
        finally:
            if workspace_id in _active_terminal_sockets and terminal_id in _active_terminal_sockets[workspace_id]:
                del _active_terminal_sockets[workspace_id][terminal_id]
            
            # If this was the last terminal for the workspace, stop the container and watcher
            if not _active_terminal_sockets.get(workspace_id):
                FileWatcherService.stop_watcher(workspace_id)
                try:
                    # Run cleanup in a background thread to not block the event loop
                    def cleanup_container():
                        try:
                            c = docker_client.containers.get(container_name)
                            c.stop(timeout=2)
                            c.remove()
                        except:
                            pass
                    
                    loop = asyncio.get_running_loop()
                    loop.run_in_executor(None, cleanup_container)
                except:
                    pass

    @staticmethod
    def broadcast_sync_event(workspace_id: int):
        terminals = _active_terminal_sockets.get(workspace_id, {})
        for term_id, ws in terminals.items():
            try:
                # We need to run the async send_text from the main event loop
                global _main_loop
                if _main_loop and _main_loop.is_running():
                    asyncio.run_coroutine_threadsafe(ws.send_text("[SYS_SYNC]"), _main_loop)
            except Exception as e:
                print(f"Broadcast error: {e}")
