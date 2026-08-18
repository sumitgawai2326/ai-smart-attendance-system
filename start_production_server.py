import os
import sys
import time
import subprocess
import urllib.request

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

NODE_DIR = r"C:\Program Files\nodejs"
ENV_PATH = os.environ.get("PATH", "")
if NODE_DIR not in ENV_PATH:
    os.environ["PATH"] = NODE_DIR + os.pathsep + ENV_PATH

def is_url_alive(url):
    try:
        req = urllib.request.urlopen(url, timeout=2)
        return req.getcode() == 200
    except Exception:
        return False

def start_backend():
    print("[SERVER MANAGER] Starting FastAPI Backend on http://localhost:8000 ...")
    cmd = [sys.executable, "main.py"]
    return subprocess.Popen(cmd, cwd=BACKEND_DIR)

def start_frontend():
    print("[SERVER MANAGER] Starting React Vite Frontend on http://localhost:3000 ...")
    npm_cmd = os.path.join(NODE_DIR, "npm.cmd") if os.path.exists(r"C:\Program Files\nodejs\npm.cmd") else "npm"
    cmd = [npm_cmd, "run", "dev"]
    return subprocess.Popen(cmd, cwd=FRONTEND_DIR)

def main():
    print("=" * 60)
    print("      SMART ATTENDANCE AI SYSTEM - PERSISTENT SERVER MANAGER      ")
    print("=" * 60)

    backend_proc = start_backend()
    frontend_proc = start_frontend()

    print("\n[SERVER MANAGER] Both servers launched successfully!")
    print(" -> Frontend URL: http://localhost:3000")
    print(" -> Backend URL:  http://localhost:8000/health\n")
    print("[SERVER MANAGER] Monitoring process health in auto-healing loop...")

    try:
        while True:
            time.sleep(5)
            # Check Backend Health
            if backend_proc.poll() is not None or not is_url_alive("http://localhost:8000/health"):
                print("[SERVER MANAGER] Backend down! Auto-restarting FastAPI server...")
                try:
                    backend_proc.terminate()
                except Exception:
                    pass
                backend_proc = start_backend()

            # Check Frontend Health
            if frontend_proc.poll() is not None or not is_url_alive("http://localhost:3000"):
                print("[SERVER MANAGER] Frontend down! Auto-restarting Vite server...")
                try:
                    frontend_proc.terminate()
                except Exception:
                    pass
                frontend_proc = start_frontend()

    except KeyboardInterrupt:
        print("\n[SERVER MANAGER] Shutting down servers gracefully...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("[SERVER MANAGER] Shutdown complete.")

if __name__ == "__main__":
    main()
