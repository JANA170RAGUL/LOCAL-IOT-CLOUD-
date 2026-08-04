import subprocess
import sys
import time
import os

def main():
    print("Starting uvicorn on port 8001...")
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8001"],
        cwd=os.path.join(os.path.dirname(__file__), ".."),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    time.sleep(5)  # Wait for server to start
    
    if server_process.poll() is not None:
        print("Server failed to start!")
        out, err = server_process.communicate()
        print(out.decode())
        print(err.decode())
        sys.exit(1)
        
    print("Server started successfully.")
    
    try:
        script_path = os.path.join(os.path.dirname(__file__), "validate_sprint_17.py")
        subprocess.run([sys.executable, script_path], check=True)
    finally:
        print("Stopping server...")
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    main()
