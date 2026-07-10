import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from winpty import PtyProcess

class TerminalService:
    @staticmethod
    async def handle_terminal_session(websocket: WebSocket, workspace_id: int):
        await websocket.accept()
        
        try:
            pty = PtyProcess.spawn("powershell.exe")
        except Exception as e:
            await websocket.send_text(f"Failed to spawn PTY: {e}")
            await websocket.close()
            return

        async def read_from_pty():
            loop = asyncio.get_running_loop()
            try:
                while True:
                    data = await loop.run_in_executor(None, pty.read, 1024)
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
        
        await asyncio.gather(task1, task2)
