import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from winpty import PtyProcess
import concurrent.futures
from app.services.workspace_sync_service import WorkspaceSyncService
from app.services.file_watcher_service import FileWatcherService

_active_terminal_sockets = {}
_terminal_executor = concurrent.futures.ThreadPoolExecutor(max_workers=50)

class TerminalService:
    @staticmethod
    async def handle_terminal_session(websocket: WebSocket, workspace_id: int, db: Session):
        await websocket.accept()
        
        if workspace_id not in _active_terminal_sockets:
            _active_terminal_sockets[workspace_id] = []
        _active_terminal_sockets[workspace_id].append(websocket)
        
        # Phase 1: Forward Sync - DB to Physical Disk
        import os
        try:
            cwd_path = WorkspaceSyncService.sync_workspace_to_disk(workspace_id, db)
            if not cwd_path:
                cwd_path = os.getcwd()
        except Exception as e:
            print(f"Failed to sync workspace: {e}")
            cwd_path = os.getcwd()
            
        # Phase 2: Reverse Sync - Disk to DB Watcher
        FileWatcherService.start_watcher(workspace_id)
        
        try:
            from app.models.workspace import Workspace
            workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
            project_name = workspace.workspace_name if workspace else f"workspace_{workspace_id}"
            
            pty = PtyProcess.spawn("powershell.exe -NoLogo", cwd=cwd_path)
            
            # Inject prompt customization via stdin
            prompt_cmd = f"function prompt {{ 'PS {project_name}> ' }}\r\n"
            pty.write(prompt_cmd)
            pty.write("clear\r\n")
        except Exception as e:
            await websocket.send_text(f"Failed to spawn PTY: {e}")
            await websocket.close()
            return

        async def read_from_pty():
            loop = asyncio.get_running_loop()
            try:
                while True:
                    data = await loop.run_in_executor(_terminal_executor, pty.read, 1024)
                    if data:
                        await websocket.send_text(data)
            except EOFError:
                pass
            except Exception as e:
                print(f"PTY read error: {e}")
            finally:
                pty.terminate(force=True)
                try:
                    await websocket.close()
                except:
                    pass

        async def read_from_ws():
            try:
                while True:
                    data = await websocket.receive_text()
                    pty.write(data)
            except WebSocketDisconnect:
                pass
            except Exception as e:
                print(f"WS read error: {e}")
            finally:
                pty.terminate(force=True)

        task1 = asyncio.create_task(read_from_pty())
        task2 = asyncio.create_task(read_from_ws())
        
        try:
            await asyncio.gather(task1, task2)
        finally:
            if websocket in _active_terminal_sockets.get(workspace_id, []):
                _active_terminal_sockets[workspace_id].remove(websocket)
            if not _active_terminal_sockets.get(workspace_id):
                FileWatcherService.stop_watcher(workspace_id)

    @staticmethod
    def broadcast_sync_event(workspace_id: int):
        sockets = _active_terminal_sockets.get(workspace_id, [])
        for ws in sockets:
            try:
                # We need to run the async send_text from the sync context
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.run_coroutine_threadsafe(ws.send_text("[SYS_SYNC]"), loop)
            except Exception:
                pass
