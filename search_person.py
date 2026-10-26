import sqlite3
import os
import sys

terms = ["DHARSHANI", "SHINY", "ANGEL", "DURGA"]
db_path = "backend/data/hrms.sqlite"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    for term in terms:
        c.execute("SELECT id, full_name, personal_email, contact_number, status, created_at FROM employees WHERE UPPER(full_name) LIKE ?", (f"%{term}%",))
        rows = c.fetchall()
        print(f"--- Term '{term}' in employees ---")
        for r in rows:
            print(r)
            
        c.execute("SELECT id, token, shared_name, type, status, created_at FROM invitations WHERE UPPER(shared_name) LIKE ?", (f"%{term}%",))
        invs = c.fetchall()
        print(f"--- Term '{term}' in invitations ---")
        for inv in invs:
            print(inv)
    conn.close()
