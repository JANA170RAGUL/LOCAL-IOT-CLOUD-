import subprocess
import time
import httpx
import sys

from validate_auth import run_tests

def main():
    print("Starting uvicorn on port 8001...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8001"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # Wait for server to start
    started = False
    for i in range(30):
        try:
            resp = httpx.get("http://localhost:8001/docs")
            if resp.status_code == 200:
                started = True
                print("Server started successfully.")
                break
        except httpx.ConnectError:
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
        run_tests()
    finally:
        print("Stopping server...")
        proc.terminate()

if __name__ == "__main__":
    main()
