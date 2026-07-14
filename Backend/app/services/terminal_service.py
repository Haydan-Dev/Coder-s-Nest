import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from winpty import PtyProcess
import concurrent.futures
from app.services.workspace_sync_service import WorkspaceSyncService
from app.services.file_watcher_service import FileWatcherService

_active_terminal_sockets = {}
_terminal_executor = concurrent.futures.ThreadPoolExecutor(max_workers=50)
_main_loop = None

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
            
            import base64
            escaped_base = cwd_path.replace("'", "''")
            escaped_proj = project_name.replace("'", "''")
            
            prompt_script = f"""
function prompt {{
    $base = '{escaped_base}'
    $proj = '{escaped_proj}'
    $curr = (Get-Location).Path
    if ($curr.StartsWith($base, [System.StringComparison]::InvariantCultureIgnoreCase)) {{
        $rel = $curr.Substring($base.Length)
        if ($rel -match '^\\\\|^/') {{ $rel = $rel.Substring(1) }}
        $disp = if ($rel) {{ "$proj\\$rel" }} else {{ $proj }}
        return "PS $disp> "
    }} else {{
        return "PS $curr> "
    }}
}}
Clear-Host
"""
            encoded_cmd = base64.b64encode(prompt_script.encode('utf-16le')).decode('utf-8')
            pty = PtyProcess.spawn(f"powershell.exe -NoLogo -NoExit -EncodedCommand {encoded_cmd}", cwd=cwd_path)
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
                                pty.setwinsize(int(rows), int(cols))
                            continue
                    except ValueError:
                        pass
                    
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
            if workspace_id in _active_terminal_sockets and terminal_id in _active_terminal_sockets[workspace_id]:
                del _active_terminal_sockets[workspace_id][terminal_id]
            if not _active_terminal_sockets.get(workspace_id):
                FileWatcherService.stop_watcher(workspace_id)

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
