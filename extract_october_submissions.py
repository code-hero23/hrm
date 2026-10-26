#!/usr/bin/env python3
import os
import sys
import subprocess
import glob
import re

uploads_dir = "/home/deploy/hrm/hrm/backend/uploads"

october_batches = [
    {
        "date": "2026-10-02",
        "prefix": "1790928005",
        "files": glob.glob(os.path.join(uploads_dir, "1790928005*"))
    },
    {
        "date": "2026-10-06",
        "prefix": "1791289606",
        "files": glob.glob(os.path.join(uploads_dir, "1791289606*"))
    },
    {
        "date": "2026-10-09",
        "prefix": "1791555795",
        "files": glob.glob(os.path.join(uploads_dir, "1791555795*"))
    }
]

def extract_strings_from_pdf(pdf_path):
    text_content = ""
    # Try pdftotext first if available
    try:
        res = subprocess.run(["pdftotext", pdf_path, "-"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout
    except Exception:
        pass
        
    # Fallback to python string extraction
    try:
        with open(pdf_path, "rb") as f:
            content = f.read().decode("latin-1", errors="ignore")
            # Extract readable ascii strings >= 4 chars
            matches = re.findall(r'[A-Za-z0-9 .,@:_\-/()]{4,}', content)
            text_content = "\n".join(matches)
    except Exception as e:
        text_content = f"Error reading: {e}"
        
    return text_content

def main():
    print("\n==================================================================")
    print("      RECOVERING OCTOBER 2, 6, AND 9 ONBOARDING SUBMISSIONS       ")
    print("==================================================================\n")
    
    for idx, batch in enumerate(october_batches, 1):
        print(f"\n------------------------------------------------------------------")
        print(f"BATCH #{idx}: Submitted on {batch['date']} ({len(batch['files'])} files)")
        print(f"------------------------------------------------------------------")
        for f in sorted(batch['files']):
            size = os.path.getsize(f)
            fname = os.path.basename(f)
            print(f"File: {fname} ({size} bytes)")
            if f.endswith(".pdf"):
                raw_text = extract_strings_from_pdf(f)
                lines = [l.strip() for l in raw_text.splitlines() if l.strip() and len(l.strip()) > 3]
                print(f"   [PDF Preview for {fname}]:")
                for line in lines[:25]:
                    print(f"     > {line}")
                if len(lines) > 25:
                    print(f"     ... ({len(lines) - 25} more text lines)")
                    
    # Also search Docker container logs for Dharshani and Shiny
    print("\n------------------------------------------------------------------")
    print("Searching Docker container logs for Dharshani and Shiny...")
    print("------------------------------------------------------------------")
    try:
        log_search = subprocess.run(
            "grep -i -E 'dharshan|shiny|angel' /var/lib/docker/containers/*/*.log 2>/dev/null | head -n 30",
            shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        if log_search.stdout.strip():
            print(log_search.stdout)
        else:
            print("No raw log lines found.")
    except Exception as e:
        print(f"Log search error: {e}")

if __name__ == "__main__":
    main()
