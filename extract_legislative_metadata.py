#!/usr/bin/env python3
import os
import json
import csv
import re
import requests
import sys
from pathlib import Path
from html.parser import HTMLParser
import pdfplumber

# --- CONFIGURATION ---
BASE_DIR = Path(__file__).parent
INPUT_DIR = BASE_DIR / "legislative_documents"
OUTPUT_CSV = BASE_DIR / "legislative_metadata.csv"
OUTPUT_JSON = BASE_DIR / "legislative_metadata.json"
MODEL = "phi3:latest" # Faster for metadata extraction

# --- UTILITIES ---
class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.text = []
    def handle_data(self, data):
        self.text.append(data)
    def get_text(self):
        return ''.join(self.text)

def strip_html(html_text):
    if not html_text: return ""
    stripper = HTMLStripper()
    stripper.feed(html_text)
    return stripper.get_text()

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"  ⚠️ Error reading PDF {pdf_path.name}: {e}")
    return text

def call_ollama(prompt):
    """Call Ollama via HTTP API for better reliability"""
    try:
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': MODEL,
                'prompt': prompt,
                'stream': False
            },
            timeout=180
        )
        if response.status_code == 200:
            return response.json().get('response', '')
        return None
    except Exception as e:
        print(f"  ⚠️ Ollama API Error: {e}")
        return None

def parse_document(file_path):
    metadata = {'filename': file_path.name}
    suffix = file_path.suffix.lower()
    
    try:
        if suffix == '.pdf':
            content = extract_text_from_pdf(file_path)
            metadata['doc_title'] = file_path.stem.replace("_", " ")
            metadata['body'] = content
        else:
            # TXT, MD, VTT
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            # Extract title from content if it exists
            title_match = re.search(r'^Title:\s*(.+)$', content, re.MULTILINE)
            if title_match:
                metadata['doc_title'] = title_match.group(1).strip()
            else:
                metadata['doc_title'] = file_path.stem.replace("_", " ")
            metadata['body'] = strip_html(content)
    except Exception as e:
        print(f"  ⚠️ Error parsing {file_path.name}: {e}")
        return None
        
    return metadata

def analyze_document(doc_data):
    title = doc_data['doc_title']
    body = doc_data['body']
    if not body.strip(): return None

    # Take a generous sample
    sample_body = body[:10000]
    
    prompt = f"""Analyze the following legislative document.
    
Document Title: {title}
Content Snippet:
{sample_body}

Extract the following metadata into a JSON object:
- sender_organization: (string, organization/person name)
- bill_number: (string, bill number if found e.g. "SB 1047", otherwise "N/A")
- document_date: (string, the date of the document if found, e.g. "2024-05-12", otherwise "Unknown")
- position: (string, Support/Oppose/Neutral/Informational)
- key_arguments: (list of 3 bullet points)
- stakeholders: (list of affected groups)
- summary: (string, 1-2 sentence overview)
- keywords: (list of 5 keywords/topics)

Respond ONLY with the JSON object."""

    print(f"  🤖 Analyzing: {title[:60]}...")
    response = call_ollama(prompt)
    if not response: return None
    
    try:
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    return None

def main():
    input_path = Path(INPUT_DIR)
    allowed = {'.txt', '.pdf', '.md', '.vtt'}
    disk_files = [f for f in input_path.glob("*") if f.suffix.lower() in allowed]
    
    print(f"Scanning {len(disk_files)} files in {INPUT_DIR}...")
    
    # Load existing
    all_metadata = []
    if Path(OUTPUT_JSON).exists():
        with open(OUTPUT_JSON, 'r', encoding='utf-8') as f:
            all_metadata = json.load(f)
    
    # REMOVE stale entries (files no longer on disk)
    disk_filenames = {f.name for f in disk_files}
    original_count = len(all_metadata)
    all_metadata = [m for m in all_metadata if m['Filename'] in disk_filenames]
    if len(all_metadata) < original_count:
        print(f"  🗑️ Removed {original_count - len(all_metadata)} stale entries from library.")

    processed_names = {m['Filename'] for m in all_metadata}
    
    new_files = [f for f in disk_files if f.name not in processed_names]
    print(f"Found {len(new_files)} new documents to analyze.")

    for i, file_p in enumerate(new_files):
        print(f"[{i+1}/{len(new_files)}] Processing {file_p.name}...")
        doc_data = parse_document(file_p)
        if not doc_data: continue
        
        analysis = analyze_document(doc_data)
        if analysis:
            word_count = len(doc_data['body'].split())
            result = {
                "Filename": doc_data['filename'],
                "Document Title": doc_data['doc_title'],
                "Document Date": analysis.get('document_date', 'Unknown'),
                "Sender/Organization": analysis.get('sender_organization', 'Unknown'),
                "Bill Number": analysis.get('bill_number', 'N/A'),
                "Position": analysis.get('position', 'Neutral'),
                "Key Arguments": " | ".join(analysis.get('key_arguments', [])),
                "Stakeholders": " | ".join(analysis.get('stakeholders', [])),
                "Summary": analysis.get('summary', ''),
                "Keywords": " | ".join(analysis.get('keywords', [])),
                "Word Count": word_count,
                "Reading Time": max(1, round(word_count / 225))
            }
            all_metadata.append(result)
            # Save after each successful analysis
            save_results(all_metadata)
            print(f"  ✅ Added to library.")
        else:
            print(f"  ❌ Analysis failed.")

    print("\nSync complete.")

FIELDNAMES = ["Filename", "Document Title", "Document Date", "Sender/Organization", "Bill Number", "Position", "Key Arguments", "Stakeholders", "Summary", "Keywords", "Word Count", "Reading Time"]

def save_results(data):
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for row in data:
            writer.writerow({k: row.get(k, "") for k in FIELDNAMES})

if __name__ == "__main__":
    main()
