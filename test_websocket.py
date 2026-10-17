import sys
import ssl
import websocket

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ticket = input("Enter WebSocket ticket: ").strip()

url = (
    "wss://localhost/ws/telemetry/"
    "7c2d5a92-2ed4-4d15-ab33-80870486ede4"
    "?ticket=" + ticket
)

print("Connecting...")
print(url.split("?")[0] + "?ticket=<hidden>")

try:
    ws = websocket.create_connection(
        url,
        timeout=5,
        sslopt={"cert_reqs": ssl.CERT_NONE}
    )

    print("[SUCCESS] WebSocket connection established!")

    while True:
        message = ws.recv()
        print("[DATA] Received:", message)

except KeyboardInterrupt:
    print("\nClosing...")

except Exception as e:
    print("[ERROR] WebSocket error:", e)

finally:
    try:
        ws.close()
    except:
        pass

