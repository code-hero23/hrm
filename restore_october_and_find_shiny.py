#!/usr/bin/env python3
import os
import sys
import sqlite3
import subprocess
import glob
import json
from datetime import datetime

db_path = "/home/deploy/hrm/hrm/backend/data/hrms.sqlite"
uploads_dir = "/home/deploy/hrm/hrm/backend/uploads"
backups_dir = "/home/deploy/hrm/hrm/backend/backups"

def search_all_uploads_and_backups_for_shiny():
    print("\n" + "=" * 80)
    print("SEARCHING FOR 'SHINY' / 'ANGEL' ACROSS ALL DOCUMENTS, BACKUPS & DATABASES...")
    print("=" * 80)
    
    # 1. Search in all PDF documents in uploads
    pdf_list = glob.glob(os.path.join(uploads_dir, "*.pdf"))
    print(f"1. Scanning {len(pdf_list)} uploaded PDF files...")
    pdf_matches = []
    
    for pdf in pdf_list:
        try:
            res = subprocess.run(["pdftotext", pdf, "-"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0 and res.stdout:
                content = res.stdout.lower()
                if "shiny" in content or "angel" in content:
                    lines = [l.strip() for l in res.stdout.splitlines() if "shiny" in l.lower() or "angel" in l.lower()]
                    pdf_matches.append({
                        "file": os.path.basename(pdf),
                        "path": pdf,
                        "lines": lines[:5]
                    })
        except Exception:
            pass
            
    if pdf_matches:
        print(f"\033[92m>>> FOUND {len(pdf_matches)} MATCHING PDF FILES!\033[0m")
        for m in pdf_matches:
            print(f"File: {m['file']}")
            for l in m['lines']:
                print(f"  > {l}")
            print("-" * 50)
    else:
        print("   No matching PDFs found in uploads.")

    # 2. Search in all JSON backups
    json_list = glob.glob(os.path.join(backups_dir, "**", "*.json"), recursive=True)
    print(f"\n2. Scanning {len(json_list)} backup JSON files...")
    json_matches = []
    for jf in json_list:
        try:
            with open(jf, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                if "shiny" in content.lower() or "angel" in content.lower():
                    json_matches.append(jf)
        except Exception:
            pass
            
    if json_matches:
        print(f"\033[92m>>> FOUND {len(json_matches)} MATCHING JSON BACKUPS!\033[0m")
        for jf in json_matches:
            print(f"  > {jf}")
    else:
        print("   No matching JSON backups found.")

    # 3. Search in all SQLite databases for invitations or employees
    print("\n3. Scanning all SQLite databases for 'SHINY' or 'ANGEL' in any field...")
    db_list = glob.glob(os.path.join(backups_dir, "**", "*.sqlite"), recursive=True)
    if os.path.exists(db_path):
        db_list.append(db_path)
        
    db_matches = []
    for dbf in set(db_list):
        try:
            conn = sqlite3.connect(f"file:{dbf}?mode=ro", uri=True)
            c = conn.cursor()
            
            # Check employees table
            c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'")
            if c.fetchone():
                c.execute("SELECT id, full_name, personal_email, contact_number, designation, status, created_at FROM employees WHERE UPPER(full_name) LIKE '%SHINY%' OR UPPER(full_name) LIKE '%ANGEL%' OR UPPER(personal_email) LIKE '%SHINY%' OR UPPER(personal_email) LIKE '%ANGEL%'")
                for r in c.fetchall():
                    db_matches.append({"db": dbf, "type": "employees", "row": r})
                    
            # Check invitations table
            c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='invitations'")
            if c.fetchone():
                c.execute("SELECT id, token, shared_name, type, status, employee_id, created_at FROM invitations WHERE UPPER(shared_name) LIKE '%SHINY%' OR UPPER(shared_name) LIKE '%ANGEL%'")
                for r in c.fetchall():
                    db_matches.append({"db": dbf, "type": "invitations", "row": r})
            conn.close()
        except Exception:
            pass
            
    if db_matches:
        print(f"\033[92m>>> FOUND {len(db_matches)} DATABASE MATCHES!\033[0m")
        for dm in db_matches:
            print(f"[{dm['type']}] in {dm['db']}: {dm['row']}")
    else:
        print("   No matching SQLite records found for Shiny / Angel.")

    # 4. Check PostgreSQL if running
    try:
        psql_res = subprocess.run(
            ["sudo", "-u", "postgres", "psql", "-d", "peopledesk", "-t", "-c", 
             "SELECT id, full_name, email, phone_number, designation FROM employees WHERE full_name ILIKE '%shiny%' OR full_name ILIKE '%angel%' OR email ILIKE '%shiny%' OR email ILIKE '%angel%';"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        if psql_res.returncode == 0 and psql_res.stdout.strip():
            print(f"\n\033[92m>>> FOUND MATCH IN PEOPLEDESK POSTGRESQL:\033[0m")
            print(psql_res.stdout.strip())
    except Exception:
        pass


def restore_october_employees():
    print("\n" + "=" * 80)
    print("INSERTING / RESTORING OCTOBER SUBMISSIONS (154, 155, 156)...")
    print("=" * 80)
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if they are already in the DB to avoid duplicate insertion
    cursor.execute("SELECT id, full_name FROM employees WHERE UPPER(full_name) LIKE '%DHARSHANI%' OR UPPER(full_name) LIKE '%AKSHAIYA%' OR UPPER(full_name) LIKE '%NASIM%'")
    existing = cursor.fetchall()
    existing_names = [e[1].upper() for e in existing]
    
    october_records = [
        {
            "full_name": "AKSHAIYA BOBBY",
            "file_no": "HRM/26/154",
            "status": "Onboard",
            "personal_email": "akshaiyabobby123@gmail.com",
            "contact_number": "9025269539",
            "alternate_number": "9940055406",
            "present_address": "No.7/11, Sathyam Flats, A13, Perumal Koil Street, Aminjikarai, Chennai – 600029",
            "permanent_address": "No.7/11, Sathyam Flats, A13, Perumal Koil Street, Aminjikarai, Chennai – 600029",
            "designation": "Customer Relation Manager",
            "department": "CRM",
            "education_qualification": "BCom",
            "institute": "Shasun Jain College for Women",
            "year_of_passing": "2012",
            "date_of_joining": "2026-10-02",
            "official_joining_date": "2026-10-02",
            "photo_path": "/uploads/1790928005180.jpg",
            "bank_passbook_path": "/uploads/1790928005183.jpg",
            "bank_passbook_back_path": "/uploads/1790928005193.jpg",
            "pan_card_path": "/uploads/1790928005202.jpg",
            "pan_card_back_path": "/uploads/1790928005223.jpg",
            "aadhaar_card_path": "/uploads/1790928005234.jpg",
            "aadhaar_card_back_path": "/uploads/1790928005246.jpg",
            "educational_certificate_path": "/uploads/1790928005256.pdf",
            "resume_path": "/uploads/1790928005264.pdf",
            "created_at": "2026-10-02 08:00:05"
        },
        {
            "full_name": "F MOHAMED NASIM",
            "file_no": "HRM/26/155",
            "status": "Onboard",
            "personal_email": "mohamednasim8072@gmail.com",
            "contact_number": "8072920316",
            "dob": "2000-08-30",
            "father_mother_name": "F SARFUNISHA / K FAZLUR RAHMAN",
            "father_name": "K FAZLUR RAHMAN",
            "mother_name": "F SARFUNISHA",
            "present_address": "No 47b, Muslim street, melpattambakkam, Cuddalore 607104, Tamil Nadu, India",
            "permanent_address": "No 47b, Muslim street, melpattambakkam, Cuddalore 607104, Tamil Nadu, India",
            "designation": "Junior Interior designer",
            "department": "Design",
            "date_of_joining": "2026-10-06",
            "official_joining_date": "2026-10-06",
            "photo_path": "/uploads/1791289606670.png",
            "bank_passbook_path": "/uploads/1791289606682.pdf",
            "pan_card_path": "/uploads/1791289606688.pdf",
            "aadhaar_card_path": "/uploads/1791289606693.pdf",
            "educational_certificate_path": "/uploads/1791289606695.pdf",
            "educational_certificate_back_path": "/uploads/1791289606705.pdf",
            "resume_path": "/uploads/1791289606712.pdf",
            "created_at": "2026-10-06 12:26:46"
        },
        {
            "full_name": "DHARSHANI G S",
            "file_no": "HRM/26/156",
            "status": "Onboard",
            "father_mother_name": "N.G.Saraboji",
            "father_name": "N.G.Saraboji",
            "personal_email": "sarabojidharshu27@gmail.com",
            "contact_number": "9842026197",
            "alternate_number": "6382794819",
            "present_address": "96 Shivan kovil Street, Koohur, Kumbakonam",
            "permanent_address": "96 Shivan kovil Street, Koohur, Kumbakonam",
            "education_qualification": "B.Sc (IT)",
            "institute": "Idhaya College Of Women, Kumbakonam",
            "year_of_passing": "2024",
            "designation": "Executive",
            "department": "IT",
            "date_of_joining": "2026-10-09",
            "official_joining_date": "2026-10-09",
            "photo_path": "/uploads/1791555795974.jpg",
            "bank_passbook_path": "/uploads/1791555795975.jpg",
            "pan_card_path": "/uploads/1791555795985.jpg",
            "aadhaar_card_path": "/uploads/1791555795990.jpg",
            "resume_path": "/uploads/1791555795996.pdf",
            "created_at": "2026-10-09 14:23:15"
        }
    ]
    
    # Determine next available auto-increment ID
    cursor.execute("SELECT MAX(id) FROM employees")
    max_id_row = cursor.fetchone()
    next_id = (max_id_row[0] or 317) + 1
    
    inserted = 0
    for rec in october_records:
        if any(rec['full_name'].upper() in name for name in existing_names):
            print(f"Skipping {rec['full_name']} (already present in database)")
            continue
            
        columns = list(rec.keys())
        placeholders = ", ".join(["?"] * len(columns))
        col_names = ", ".join(columns)
        values = [rec[c] for c in columns]
        
        sql = f"INSERT INTO employees (id, {col_names}) VALUES (?, {placeholders})"
        cursor.execute(sql, [next_id] + values)
        print(f"\033[92m[RESTORED]\033[0m Employee #{next_id}: {rec['full_name']} (File No: {rec['file_no']}, Email: {rec['personal_email']})")
        next_id += 1
        inserted += 1
        
    conn.commit()
    
    # Clean WAL checkpoint
    cursor.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    
    cursor.execute("SELECT COUNT(*), MAX(id) FROM employees")
    total, highest_id = cursor.fetchone()
    
    # Also update sqlite_sequence so future additions increment properly
    cursor.execute("UPDATE sqlite_sequence SET seq = ? WHERE name = 'employees'", (highest_id,))
    conn.commit()
    
    conn.close()
    
    print("\n" + "=" * 80)
    print(f"Restoration Complete! Inserted {inserted} October employees.")
    print(f"TOTAL EMPLOYEES IN DATABASE: \033[92m{total}\033[0m (Highest ID: #{highest_id})")
    print("=" * 80)

def main():
    search_all_uploads_and_backups_for_shiny()
    restore_october_employees()

if __name__ == "__main__":
    main()

