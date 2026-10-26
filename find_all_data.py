#!/usr/bin/env python3
import os
import sys
import sqlite3
import json
from datetime import datetime

def inspect_sqlite(file_path):
    try:
        if os.path.getsize(file_path) < 4096:
            return None
        conn = sqlite3.connect(f"file:{file_path}?mode=ro", uri=True)
        cursor = conn.cursor()
        
        # Check if employees table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'")
        if not cursor.fetchone():
            conn.close()
            return None
            
        cursor.execute("SELECT COUNT(*), MAX(id), MAX(created_at) FROM employees")
        count, max_id, latest_created = cursor.fetchone()
        
        cursor.execute("SELECT id, full_name, created_at FROM employees ORDER BY id DESC LIMIT 3")
        recent = cursor.fetchall()
        
        recent_str = ", ".join([f"#{r[0]} {r[1]}" for r in recent]) if recent else ""
        
        conn.close()
        stat = os.stat(file_path)
        return {
            "type": "SQLITE",
            "path": file_path,
            "size": stat.st_size,
            "mtime": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
            "count": count or 0,
            "max_id": max_id or 0,
            "latest_created": str(latest_created or "N/A"),
            "sample": recent_str
        }
    except Exception as e:
        return None

def inspect_json(file_path):
    try:
        if os.path.getsize(file_path) < 100:
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict) and "employees" in data and isinstance(data["employees"], list):
            emps = data["employees"]
            count = len(emps)
            max_id = max([e.get("id", 0) for e in emps if isinstance(e.get("id"), int)], default=0)
            latest_created = max([e.get("created_at", "") for e in emps], default="N/A")
            sorted_emps = sorted(emps, key=lambda x: x.get("id", 0), reverse=True)[:3]
            sample = ", ".join([f"#{e.get('id')} {e.get('full_name')}" for e in sorted_emps])
            stat = os.stat(file_path)
            return {
                "type": "JSON",
                "path": file_path,
                "size": stat.st_size,
                "mtime": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                "count": count,
                "max_id": max_id,
                "latest_created": str(latest_created),
                "sample": sample
            }
    except Exception:
        pass
    return None

def scan_directories(search_roots):
    results = []
    seen = set()
    
    skip_dirs = {
        "proc", "sys", "dev", "node_modules", ".git", "tmp", "run", 
        ".npm", ".cache", ".local", "dist", ".vscode", "AppData", "Windows", "Program Files"
    }
    
    for root_dir in search_roots:
        if not os.path.exists(root_dir):
            continue
        print(f"Scanning: {root_dir}...")
        for root, dirs, files in os.walk(root_dir, topdown=True):
            # Prune skipped dirs
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            for file in files:
                name_lower = file.lower()
                if (
                    name_lower.endswith(".sqlite") 
                    or name_lower.endswith(".db")
                    or ".sqlite.bak" in name_lower 
                    or "hrms" in name_lower
                    or "database" in name_lower
                    or (name_lower.endswith(".json") and "backup" in name_lower)
                ) and not name_lower.endswith("-wal") and not name_lower.endswith("-shm"):
                    full_path = os.path.abspath(os.path.join(root, file))
                    if full_path in seen:
                        continue
                    seen.add(full_path)
                    
                    if name_lower.endswith(".json"):
                        info = inspect_json(full_path)
                    else:
                        info = inspect_sqlite(full_path)
                    
                    if info and info["count"] > 0:
                        results.append(info)
    return results

def main():
    print("\n==================================================================")
    print("      DEEP DATABASE & BACKUP SCANNER FOR PEOPLEDESK HRM           ")
    print("==================================================================\n")
    
    # Candidate search paths: current dir, parent dirs, /home/deploy, docker volumes
    current_dir = os.path.abspath(os.getcwd())
    parent_1 = os.path.abspath(os.path.join(current_dir, ".."))
    
    if os.name == "nt":
        search_paths = [current_dir]
    else:
        home_dir = os.path.expanduser("~")
        search_paths = [
            current_dir,
            parent_1,
            home_dir,
            "/home/deploy",
            "/var/lib/docker/volumes"
        ]
    
    # Add any extra command-line search paths
    for arg in sys.argv[1:]:
        if not arg.startswith("--") and os.path.exists(arg):
            search_paths.append(os.path.abspath(arg))
            
    # Deduplicate paths
    unique_paths = []
    for p in search_paths:
        if p not in unique_paths and os.path.exists(p):
            unique_paths.append(p)
            
    results = scan_directories(unique_paths)
    
    if not results:
        print("\nNo employee database files or backups found in the scanned paths.")
        return
        
    # Sort by count DESC, max_id DESC, latest_created DESC
    results.sort(key=lambda x: (x["count"], x["max_id"], x["latest_created"]), reverse=True)
    
    print(f"\nFound {len(results)} valid database/backup files with employee records:\n")
    
    # Print formatted table
    col_idx = 4
    col_type = 6
    col_cnt = 6
    col_max = 7
    col_date = 19
    col_mtime = 19
    col_sample = 32
    
    header = (
        f"{'#':<{col_idx}} | "
        f"{'Type':<{col_type}} | "
        f"{'Emps':<{col_cnt}} | "
        f"{'MaxID':<{col_max}} | "
        f"{'Latest Record Date':<{col_date}} | "
        f"{'File Modified':<{col_mtime}} | "
        f"{'Sample Recent Names':<{col_sample}} | "
        f"File Path"
    )
    print(header)
    print("-" * 140)
    
    for i, r in enumerate(results, 1):
        sample = (r['sample'][:col_sample - 3] + "...") if len(r['sample']) > col_sample else r['sample']
        row = (
            f"{i:<{col_idx}} | "
            f"{r['type']:<{col_type}} | "
            f"{r['count']:<{col_cnt}} | "
            f"{r['max_id']:<{col_max}} | "
            f"{r['latest_created']:<{col_date}} | "
            f"{r['mtime']:<{col_mtime}} | "
            f"{sample:<{col_sample}} | "
            f"{r['path']}"
        )
        # Highlight top records
        if r['count'] > 150:
            print(f"\033[92m{row}\033[0m")
        else:
            print(row)
            
    top = results[0]
    print("\n" + "=" * 140)
    print(f"TOP CANDIDATE (#1): {top['path']}")
    print(f"Total Employees: {top['count']} | Max Employee ID: {top['max_id']} | Latest Created: {top['latest_created']}")
    print(f"Recent: {top['sample']}")
    print("=" * 140)
    
    if "--restore" in sys.argv:
        target = top['path']
        for arg in sys.argv[1:]:
            if not arg.startswith("--") and os.path.exists(arg):
                target = os.path.abspath(arg)
                break
                
        print(f"\nRestoring active database from: {target}...")
        dest = os.path.join(current_dir, "backend", "data", "hrms.sqlite")
        if not os.path.exists(os.path.dirname(dest)):
            dest = os.path.join(current_dir, "data", "hrms.sqlite")
            
        print(f"Destination: {dest}")
        
        # Backup existing dest
        if os.path.exists(dest):
            bak = dest + f".safety_{int(datetime.now().timestamp())}"
            print(f"Creating safety copy of current DB: {bak}")
            import shutil
            shutil.copy2(dest, bak)
            
        import shutil
        shutil.copy2(target, dest)
        if os.path.exists(target + "-wal"):
            shutil.copy2(target + "-wal", dest + "-wal")
        if os.path.exists(target + "-shm"):
            shutil.copy2(target + "-shm", dest + "-shm")
            
        print(f"\033[92m[SUCCESS] Successfully restored {dest} from {target}!\033[0m")
        print("Now restart backend: sudo docker compose restart backend")

if __name__ == "__main__":
    main()
