import asyncio
import json
from aiocoap import Context, Message, POST

async def main():
    protocol = await Context.create_client_context()
    payload = json.dumps({
        "device": "test-device",
        "sensor": "TEMP",
        "value": 25.6
    }).encode("utf-8")
    
    request = Message(code=POST, payload=payload, uri="coap://coap:5683/telemetry")
    
    try:
        response = await protocol.request(request).response
        print("=== RESPONSE RECEIVED ===")
        print("Code:", response.code)
        print("Payload:", response.payload.decode("utf-8"))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
