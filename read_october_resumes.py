#!/usr/bin/env python3
import os
import sys
import glob
import subprocess
import zlib
import re

uploads_dir = "/home/deploy/hrm/hrm/backend/uploads"

pdf_files = [
    # Batch 1 (Oct 2)
    os.path.join(uploads_dir, "1790928005264.pdf"),
    os.path.join(uploads_dir, "1790928005256.pdf"),
    # Batch 2 (Oct 6)
    os.path.join(uploads_dir, "1791289606712.pdf"),
    os.path.join(uploads_dir, "1791289606705.pdf"),
    os.path.join(uploads_dir, "1791289606695.pdf"),
    os.path.join(uploads_dir, "1791289606688.pdf"),
    os.path.join(uploads_dir, "1791289606682.pdf"),
    # Batch 3 (Oct 9)
    os.path.join(uploads_dir, "1791555795996.pdf")
]

def extract_with_pdftotext(pdf_path):
    try:
        res = subprocess.run(["pdftotext", pdf_path, "-"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except Exception:
        pass
    return None

def extract_with_zlib(pdf_path):
    try:
        with open(pdf_path, "rb") as f:
            data = f.read()
    except Exception as e:
        return f"Error reading file: {e}"

    streams = re.findall(b'stream[\r\n]+(.*?)[\r\n]+endstream', data, re.DOTALL)
    extracted = []
    for s in streams:
        for offset in [0, 1, 2]:
            try:
                dec = zlib.decompress(s[offset:])
                # Look for strings in parentheses (Tj / TJ)
                chunks = re.findall(rb'\((.*?)\)', dec)
                for ch in chunks:
                    try:
                        text = ch.decode('latin1', errors='ignore').strip()
                        if len(text) > 1 and not re.match(r'^[\x00-\x1f]+$', text):
                            extracted.append(text)
                    except Exception:
                        pass
                # Look for readable words
                words = re.findall(rb'[A-Za-z0-9@.,_ \-+/()]{4,}', dec)
                for w in words:
                    try:
                        w_str = w.decode('latin1', errors='ignore').strip()
                        if len(w_str) > 4 and w_str not in extracted:
                            extracted.append(w_str)
                    except Exception:
                        pass
                break
            except Exception:
                continue

    # Also extract uncompressed strings from file
    uncompressed = re.findall(rb'[A-Za-z0-9@.,_ \-+/()]{4,}', data)
    for u in uncompressed:
        try:
            u_str = u.decode('latin1', errors='ignore').strip()
            lower = u_str.lower()
            if any(k in lower for k in ['@', 'dharshan', 'shiny', 'angel', 'phone', 'mail', 'qualification', 'college', 'school', 'university', 'address', 'kumar', 'mary']):
                if u_str not in extracted:
                    extracted.append(u_str)
        except Exception:
            pass

    return "\n".join(extracted)

def main():
    print("\n==================================================================")
    print("      EXTRACTING OCTOBER ONBOARDING RESUMES & DETAILS             ")
    print("==================================================================\n")

    # Check if pdftotext is available, if not suggest installing it
    try:
        subprocess.run(["pdftotext", "-v"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except FileNotFoundError:
        print("Note: 'pdftotext' is not installed. Using built-in zlib stream parser.")
        print("(For 100% formatted text, you can also run: sudo apt-get install -y poppler-utils)\n")

    for f in pdf_files:
        if not os.path.exists(f):
            continue
        fname = os.path.basename(f)
        size = os.path.getsize(f)
        print("=" * 80)
        print(f"FILE: {fname} ({size} bytes)")
        print("=" * 80)

        # 1. Try pdftotext
        text = extract_with_pdftotext(f)
        if text:
            print("[Extracted via pdftotext]:\n")
            print(text[:3000])
            if len(text) > 3000:
                print(f"\n... [Truncated, total {len(text)} characters]")
        else:
            # 2. Try zlib
            text = extract_with_zlib(f)
            if text:
                print("[Extracted via zlib decompressor]:\n")
                lines = [l.strip() for l in text.splitlines() if l.strip()]
                # Deduplicate consecutive lines
                dedup = []
                for l in lines:
                    if not dedup or dedup[-1] != l:
                        dedup.append(l)
                print("\n".join(dedup[:80]))
                if len(dedup) > 80:
                    print(f"\n... [Truncated, {len(dedup) - 80} more lines]")
            else:
                print("Could not extract text.")
        print("\n")

if __name__ == "__main__":
    main()
