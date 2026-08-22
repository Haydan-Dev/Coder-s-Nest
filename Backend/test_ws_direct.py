import asyncio
import websockets
import json

async def test_notifications():
    print("Testing /notifications/ws/18")
    try:
        async with websockets.connect('ws://127.0.0.1:8000/notifications/ws/18') as ws:
            print("Connected to notifications!")
            await asyncio.sleep(1)
    except Exception as e:
        print("Notifications error:", e)

async def test_chat():
    print("Testing /chat/ws/universal")
    try:
        async with websockets.connect('ws://127.0.0.1:8000/chat/ws/universal') as ws:
            print("Connected to chat!")
            await ws.send(json.dumps({"sender_id": 18, "type": "AUTH"}))
            print("Sent AUTH")
            await asyncio.sleep(1)
    except Exception as e:
        print("Chat error:", e)

async def main():
    await test_notifications()
    await test_chat()

asyncio.run(main())
