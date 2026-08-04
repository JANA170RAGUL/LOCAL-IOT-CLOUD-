import subprocess
import time
import httpx
import sys
import os

def main():
    print("Starting uvicorn on port 8001...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8001"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    started = False
    for i in range(30):
        try:
            resp = httpx.get("http://localhost:8001/docs", timeout=1.0)
            if resp.status_code == 200:
                started = True
                print("Server started successfully.")
                break
        except httpx.RequestError:
            pass
        time.sleep(1)

    if not started:
        print("Failed to start server. Output:")
        proc.terminate()
        stdout, stderr = proc.communicate()
        print(stdout.decode())
        print(stderr.decode())
        sys.exit(1)

    try:
        script_path = os.path.join(os.path.dirname(__file__), "validate_sprint_16.py")
        subprocess.run([sys.executable, script_path], check=True)
    finally:
        print("Stopping server...")
        proc.terminate()

if __name__ == "__main__":
    main()
