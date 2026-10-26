#!/usr/bin/env python3
import os
import sys
import sqlite3
import subprocess
from datetime import datetime

def inspect_file(file_path):
    try:
        if os.path.getsize(file_path) < 4096:
            return None
        conn = sqlite3.connect("file:" + file_path + "?mode=ro", uri=True)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'")
        if not cursor.fetchone():
            conn.close()
            return None
            
        cursor.execute("SELECT COUNT(*), MAX(id), MAX(created_at) FROM employees")
        count, max_id, latest = cursor.fetchone()
        
        cursor.execute("SELECT id, full_name, created_at FROM employees ORDER BY id DESC LIMIT 2")
        recent = cursor.fetchall()
        conn.close()
        
        if count and count > 0:
            return {
                "count": count,
                "max_id": max_id or 0,
                "latest": str(latest or "N/A"),
                "sample": ", ".join([f"#{r[0]} {r[1]}" for r in recent]) if recent else "",
                "path": file_path
            }
    except Exception:
        pass
    return None

def main():
    print("Searching Docker overlay layers and host filesystem for all databases...")
    
    cmd = "find /var/lib/docker/overlay2 /home/deploy -name '*.sqlite*' 2>/dev/null"
    try:
        raw_output = subprocess.check_output(cmd, shell=True, text=True)
        paths = raw_output.splitlines()
    except Exception as e:
        print(f"Error running find: {e}")
        paths = []
        
    print(f"Checking {len(paths)} found candidate paths...")
    
    found = []
    seen = set()
    
    for p in paths:
        if p.endswith(("-wal", "-shm", ".js", ".wasm", ".txt", ".mjs")):
            continue
        if p in seen or not os.path.exists(p):
            continue
        seen.add(p)
        
        info = inspect_file(p)
        if info:
            found.append(info)
            
    found.sort(key=lambda x: (x["count"], x["max_id"], x["latest"]), reverse=True)
    
    print("\n" + "=" * 130)
    header_fmt = "%-6s | %-7s | %-20s | %-35s | %s"
    print(header_fmt % ("Count", "MaxID", "Latest Record Date", "Sample Recent Employees", "Path"))
    print("=" * 130)
    
    for r in found:
        sample = (r["sample"][:32] + "...") if len(r["sample"]) > 35 else r["sample"]
        line = header_fmt % (r["count"], r["max_id"], r["latest"], sample, r["path"])
        if r["count"] > 153:
            print(f"\033[92m{line}  <=== NEWER / MORE DATA FOUND!\033[0m")
        else:
            print(line)
            
    print("=" * 130)

if __name__ == "__main__":
    main()
