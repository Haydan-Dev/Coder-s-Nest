import asyncio
import websockets
import json

CF_URL = 'wss://personality-validation-ids-suburban.trycloudflare.com'

async def test_notifications():
    print(f"Testing {CF_URL}/notifications/ws/18")
    try:
        async with websockets.connect(
            f'{CF_URL}/notifications/ws/18',
            additional_headers={"Origin": "https://personality-validation-ids-suburban.trycloudflare.com"}
        ) as ws:
            print("Connected to notifications via Cloudflare!")
            await asyncio.sleep(1)
    except Exception as e:
        print("Notifications error:", e)

async def test_chat():
    print(f"Testing {CF_URL}/chat/ws/universal")
    try:
        async with websockets.connect(
            f'{CF_URL}/chat/ws/universal',
            additional_headers={"Origin": "https://personality-validation-ids-suburban.trycloudflare.com"}
        ) as ws:
            print("Connected to chat via Cloudflare!")
            await ws.send(json.dumps({"sender_id": 18, "type": "AUTH"}))
            print("Sent AUTH")
            await asyncio.sleep(1)
    except Exception as e:
        print("Chat error:", e)

async def main():
    await test_notifications()
    await test_chat()

asyncio.run(main())
