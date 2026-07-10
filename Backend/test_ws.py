import asyncio
import websockets

async def test():
    async with websockets.connect('ws://127.0.0.1:8000/ws/3') as ws:
        print(await ws.recv())
        print(await ws.recv())
        await ws.send("dir\r")
        print(await ws.recv())
        print(await ws.recv())
        print(await ws.recv())
        print(await ws.recv())

asyncio.run(test())
