#!/usr/bin/env python3
import os
import sys
import sqlite3
import subprocess
import glob
import re

db_path = "/home/deploy/hrm/hrm/backend/data/hrms.sqlite"

def main():
    print("=" * 80)
    print("INVESTIGATING 'SHINY ANGEL': DEEP SERVER-WIDE CHECK")
    print("=" * 80)

    # 1. Check all employees in hrms.sqlite for similar names or partial matches
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        print("\n1. Searching hrms.sqlite for any name matching 'shin%', '%angel%', '%ang%', '%shir%':")
        c.execute("""
            SELECT id, file_no, full_name, personal_email, contact_number, designation, status, date_of_joining, created_at 
            FROM employees 
            WHERE UPPER(full_name) LIKE '%SHIN%' 
               OR UPPER(full_name) LIKE '%ANGEL%' 
               OR UPPER(full_name) LIKE '%EVANG%'
               OR UPPER(full_name) LIKE '%SHIR%'
               OR UPPER(personal_email) LIKE '%SHIN%'
               OR UPPER(personal_email) LIKE '%ANGEL%'
            ORDER BY id DESC
        """)
        rows = c.fetchall()
        if rows:
            for r in rows:
                print(f"   [ID #{r[0]}] {r[1]} - {r[2]} | Email: {r[3]} | Phone: {r[4]} | Desig: {r[5]} | Status: {r[6]} | DOJ: {r[7]} | Created: {r[8]}")
        else:
            print("   No partial name matches found in active employees table.")
            
        print("\n2. Checking the latest 10 employees in the database:")
        c.execute("SELECT id, file_no, full_name, personal_email, status, created_at FROM employees ORDER BY id DESC LIMIT 10")
        for r in c.fetchall():
            print(f"   #{r[0]} ({r[1]}): {r[2]} | {r[3]} | Status: {r[4]} | {r[5]}")
            
        conn.close()

    # 3. Check all Docker container logs on the host
    print("\n3. Grepping all Docker container logs for 'shiny' or 'angel':")
    try:
        res = subprocess.run(
            "grep -i -E 'shiny|angel' /var/lib/docker/containers/*/*.log 2>/dev/null | head -n 40",
            shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        if res.stdout.strip():
            for line in res.stdout.strip().splitlines()[:20]:
                print(f"   > {line[:120]}")
        else:
            print("   No matches in Docker container logs.")
    except Exception as e:
        print(f"   Error: {e}")

    # 4. Search all files under /home/deploy for 'shiny' or 'angel' (case-insensitive)
    print("\n4. Searching /home/deploy filenames for 'shiny' or 'angel' (excluding node_modules):")
    try:
        res = subprocess.run(
            "find /home/deploy -not -path '*/.*' -not -path '*/node_modules/*' -iname '*shiny*' -o -not -path '*/.*' -not -path '*/node_modules/*' -iname '*angel*' 2>/dev/null",
            shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        if res.stdout.strip():
            for line in res.stdout.strip().splitlines():
                print(f"   Found file: {line}")
        else:
            print("   No filenames matching 'shiny' or 'angel' under /home/deploy.")
    except Exception as e:
        print(f"   Error: {e}")

    # 5. Search git log for 'shiny' or 'angel'
    print("\n5. Checking git commit history for 'shiny' or 'angel':")
    try:
        res = subprocess.run(
            "git -C /home/deploy/hrm/hrm log --all --grep='shiny' --grep='angel' -i --oneline",
            shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        if res.stdout.strip():
            print(res.stdout)
        else:
            print("   No git commits mentioning shiny or angel.")
    except Exception as e:
        print(f"   Error: {e}")

    # 6. Check syslog / auth.log / mail logs for any mentions
    print("\n6. Checking /var/log/mail* or system logs for 'shiny' or 'angel':")
    try:
        res = subprocess.run(
            "grep -i -E 'shiny|angel' /var/log/mail* /var/log/syslog* 2>/dev/null | head -n 10",
            shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        if res.stdout.strip():
            print(res.stdout)
        else:
            print("   No matches in system mail/syslog.")
    except Exception as e:
        print(f"   Error: {e}")

    print("\n" + "=" * 80)
    print("CHECK COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
