#!/usr/bin/env python3
import os
import sys
import sqlite3
import subprocess
import json

SEARCH_TERMS = ["DHARSHAN", "SHINY", "ANGEL"]

def search_sqlite_file(file_path):
    matches = []
    try:
        if os.path.getsize(file_path) < 4096:
            return matches
        conn = sqlite3.connect("file:" + file_path + "?mode=ro", uri=True)
        cursor = conn.cursor()
        
        # Check employees
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'")
        if cursor.fetchone():
            for term in SEARCH_TERMS:
                query = """
                    SELECT id, full_name, personal_email, contact_number, designation, status, created_at 
                    FROM employees 
                    WHERE UPPER(full_name) LIKE ? OR UPPER(personal_email) LIKE ?
                """
                cursor.execute(query, (f"%{term}%", f"%{term}%"))
                rows = cursor.fetchall()
                for r in rows:
                    matches.append({
                        "source": "employees table",
                        "file": file_path,
                        "data": {
                            "id": r[0],
                            "full_name": r[1],
                            "email": r[2],
                            "phone": r[3],
                            "designation": r[4],
                            "status": r[5],
                            "created_at": r[6]
                        }
                    })
                    
        # Check invitations
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='invitations'")
        if cursor.fetchone():
            for term in SEARCH_TERMS:
                query = """
                    SELECT id, token, shared_name, type, status, employee_id, created_at 
                    FROM invitations 
                    WHERE UPPER(shared_name) LIKE ?
                """
                cursor.execute(query, (f"%{term}%",))
                rows = cursor.fetchall()
                for r in rows:
                    matches.append({
                        "source": "invitations table",
                        "file": file_path,
                        "data": {
                            "invitation_id": r[0],
                            "token": r[1],
                            "shared_name": r[2],
                            "type": r[3],
                            "status": r[4],
                            "employee_id": r[5],
                            "created_at": r[6]
                        }
                    })
        conn.close()
    except Exception:
        pass
    return matches

def search_uploads(search_paths):
    file_matches = []
    for sp in search_paths:
        if not os.path.exists(sp):
            continue
        for root, dirs, files in os.walk(sp):
            for f in files:
                f_upper = f.upper()
                for term in SEARCH_TERMS:
                    if term in f_upper:
                        file_matches.append(os.path.join(root, f))
                        break
    return file_matches

def main():
    print("\n==================================================================")
    print("   DEEP SEARCH FOR: DHARSHANI G S  &  SHINY ANGEL                ")
    print("==================================================================\n")
    
    # 1. Search in SQLite files across the entire server
    print("1. Searching across all SQLite databases on host and Docker overlay layers...")
    cmd = "find /var/lib/docker/overlay2 /home/deploy -name '*.sqlite*' 2>/dev/null"
    try:
        raw_output = subprocess.check_output(cmd, shell=True, text=True)
        paths = raw_output.splitlines()
    except Exception:
        paths = []
        
    db_matches = []
    seen = set()
    for p in paths:
        if p.endswith(("-wal", "-shm", ".js", ".wasm", ".txt", ".mjs")):
            continue
        if p in seen or not os.path.exists(p):
            continue
        seen.add(p)
        results = search_sqlite_file(p)
        if results:
            db_matches.extend(results)
            
    if db_matches:
        print(f"\n\033[92m>>> FOUND {len(db_matches)} DATABASE MATCHES!\033[0m\n")
        for m in db_matches:
            print(f"[{m['source']}] in: {m['file']}")
            for k, v in m['data'].items():
                print(f"   {k}: {v}")
            print("-" * 80)
    else:
        print("\nNo direct text match found in the scanned SQLite databases.")
        
    # 2. Search Uploaded Documents (photos, resumes, passbooks, aadhar cards)
    print("\n2. Searching uploaded documents in /home/deploy and Docker uploads...")
    upload_paths = [
        "/home/deploy/hrm/hrm/backend/uploads",
        "/home/deploy/hrm/hrm/backend/backups",
        "/home/deploy/PeopleDesk-app",
        "/var/lib/docker/overlay2"
    ]
    doc_matches = search_uploads(upload_paths)
    if doc_matches:
        print(f"\n\033[92m>>> FOUND {len(doc_matches)} MATCHING UPLOADED DOCUMENTS:\033[0m")
        for dm in doc_matches[:20]:
            print(f" - {dm}")
        if len(doc_matches) > 20:
            print(f" ... and {len(doc_matches) - 20} more files.")
    else:
        print("No uploaded documents matched the search terms directly.")
        
    # 3. Check recent employee names in the active DB to see exact spelling
    print("\n3. Checking the 15 most recent employees in active database:")
    active_db = "/home/deploy/hrm/hrm/backend/data/hrms.sqlite"
    if os.path.exists(active_db):
        try:
            conn = sqlite3.connect(active_db)
            c = conn.cursor()
            c.execute("SELECT id, full_name, personal_email, status, created_at FROM employees ORDER BY id DESC LIMIT 15")
            rows = c.fetchall()
            for r in rows:
                print(f"   ID #{r[0]}: {r[1]} ({r[2]}) | Status: {r[3]} | Created: {r[4]}")
            conn.close()
        except Exception as e:
            print(f"Error querying active DB: {e}")

if __name__ == "__main__":
    main()
