"""
tunnel_manager.py
Persistent tunnel manager - auto-restarts localtunnel if it drops.
Run this once; it keeps both tunnels alive forever.
"""

import subprocess
import threading
import time
import sys
import os
import signal
import io

# Force UTF-8 output on Windows to avoid cp1252 encoding errors
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

TUNNELS = [
    {
        "name": "Frontend (port 3000)",
        "port": 3000,
        "subdomain": "smart-attendance-ai",
        "url": "https://smart-attendance-ai.loca.lt",
    },
    {
        "name": "Backend API (port 8000)",
        "port": 8000,
        "subdomain": "smart-attendance-ai-api",
        "url": "https://smart-attendance-ai-api.loca.lt",
    },
]

# Find lt.cmd path
LT_CMD = os.path.join(os.environ.get("APPDATA", ""), "npm", "lt.cmd")
if not os.path.exists(LT_CMD):
    LT_CMD = "lt"

RESTART_DELAY = 3  # seconds between restart attempts
running = True
processes = {}


def run_tunnel(tunnel):
    global running
    name = tunnel["name"]
    port = tunnel["port"]
    subdomain = tunnel["subdomain"]
    cmd = [LT_CMD, "--port", str(port), "--subdomain", subdomain]

    while running:
        print(f"[TUNNEL] Starting {name} -> {tunnel['url']}", flush=True)
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=True,
            )
            processes[name] = proc

            for line in proc.stdout:
                line = line.strip()
                if line:
                    print(f"  [{name}] {line}", flush=True)

            proc.wait()
            if running:
                print(f"[TUNNEL] !! {name} disconnected. Restarting in {RESTART_DELAY}s...", flush=True)
                time.sleep(RESTART_DELAY)
        except Exception as e:
            print(f"[TUNNEL] ERROR in {name}: {e}. Retrying in {RESTART_DELAY}s...", flush=True)
            time.sleep(RESTART_DELAY)


def shutdown(signum, frame):
    global running
    print("\n[TUNNEL] Shutting down all tunnels...", flush=True)
    running = False
    for proc in processes.values():
        try:
            proc.terminate()
        except Exception:
            pass
    sys.exit(0)


signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)


if __name__ == "__main__":
    print("=" * 60)
    print("  Smart Attendance AI -- Persistent Tunnel Manager")
    print("=" * 60)
    print()
    print("  PUBLIC LINKS (work on ANY device, ANY browser):")
    for t in TUNNELS:
        print(f"    {t['name']:<28} -> {t['url']}")
    print()
    print("  Keep this window open to stay connected.")
    print("  Press Ctrl+C to stop.")
    print("=" * 60)
    print()

    threads = []
    for tunnel in TUNNELS:
        t = threading.Thread(target=run_tunnel, args=(tunnel,), daemon=True)
        t.start()
        threads.append(t)
        time.sleep(1)  # stagger starts to avoid subdomain conflicts

    try:
        while running:
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown(None, None)
