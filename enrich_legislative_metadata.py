#!/usr/bin/env python3
import os
import json
import csv
import re
import subprocess
from pathlib import Path
from html.parser import HTMLParser

# --- CONFIGURATION ---
INPUT_DIR = "/Volumes/The Secret Archive/01_BUSINESS/Arts_by_Dylan/Blog Posts/shopify_articles_text"
OUTPUT_CSV = "/Volumes/The Secret Archive/01_BUSINESS/Arts_by_Dylan/Blog Posts/Legislative_Analysis/legislative_metadata.csv"
OUTPUT_JSON = "/Volumes/The Secret Archive/01_BUSINESS/Arts_by_Dylan/Blog Posts/Legislative_Analysis/legislative_metadata.json"
MODEL = "phi3:latest"

FIELDNAMES = [
    "Filename", "Document Title", "Sender/Organization", 
    "Bill Number", "Position", "Key Arguments", 
    "Stakeholders", "Contact Info", 
    "Summary", "Keywords", "Word Count", "Reading Time"
]

# --- UTILITIES ---
class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
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

def call_ollama(prompt):
    try:
        result = subprocess.run(
            ["ollama", "run", MODEL, prompt],
            capture_output=True,
            text=True,
            timeout=180
        )
        if result.returncode != 0:
            return None
        return result.stdout.strip()
    except Exception:
        return None

def parse_document(file_path):
    """Parses text document for analysis"""
    content = file_path.read_text(encoding='utf-8')
    metadata = {}
    metadata['filename'] = file_path.name
    
    if "--- BODY ---" in content:
        body = content.split("--- BODY ---")[1].strip()
        metadata['doc_title'] = content.split("Title: ")[1].split("\n")[0] if "Title: " in content else file_path.stem.replace("_", " ")
    else:
        body = content
        metadata['doc_title'] = file_path.stem.replace("_", " ")
    
    metadata['body'] = strip_html(body)
    return metadata

def enrich_document(doc_data):
    """Analyze a single document using Ollama to fill missing fields"""
    title = doc_data['doc_title']
    body = doc_data['body']
    if not body.strip(): return None
    sample_body = body[:8000]
    
    prompt = f"""Analyze the following legislative document and extract missing metadata.
    
Document Title: {title}
Content Snippet:
{sample_body}

Extract the following into a JSON object with EXACTLY these fields:
- sender_organization: (string)
- bill_number: (string)
- position: (string, "Support", "Oppose", "Neutral", etc.)
- key_arguments: (list of 3-5 concise bullet points)
- stakeholders: (list of groups affected)
- contact_info: (string)
- summary: (string, 2 sentences)
- keywords: (list of 5-8 policy topics)

Respond ONLY with the JSON object."""

    print(f"  🤖 Enriching: {title[:50]}...")
    
    for attempt in range(2):
        response = call_ollama(prompt)
        if not response: continue
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return {k.lower(): v for k, v in data.items()}
        except Exception as e:
            print(f"    ⚠️ JSON Parse Error: {str(e)}")
    return None

def save_results(data):
    normalized_data = []
    for row in data:
        normalized_row = {field: "" for field in FIELDNAMES}
        normalized_row.update(row)
        normalized_data.append(normalized_row)
        
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        dict_writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        dict_writer.writeheader()
        dict_writer.writerows(normalized_data)
        
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(normalized_data, f, indent=2)

def main():
    if not Path(OUTPUT_JSON).exists():
        print("No legislative metadata found to enrich.")
        return

    with open(OUTPUT_JSON, 'r', encoding='utf-8') as f:
        all_metadata = json.load(f)

    to_enrich = []
    for idx, record in enumerate(all_metadata):
        # Check if critical fields are missing
        if not record.get("Position") or not record.get("Bill Number") or record.get("Position") == "Unknown":
            to_enrich.append(idx)

    print(f"Found {len(to_enrich)} records needing enrichment.")

    for i, idx in enumerate(to_enrich):
        record = all_metadata[idx]
        file_path = Path(INPUT_DIR) / record['Filename']
        
        if not file_path.exists():
            print(f"  ⚠️ File not found: {record['Filename']}")
            continue

        print(f"[{i+1}/{len(to_enrich)}] Enriching {record['Filename']}...")
        
        try:
            doc_data = parse_document(file_path)
            analysis = enrich_document(doc_data)
            
            if analysis:
                word_count = len(doc_data['body'].split())
                reading_time = max(1, round(word_count / 225))
                
                all_metadata[idx].update({
                    "Sender/Organization": analysis.get('sender_organization', record.get('Sender/Organization', 'Unknown')),
                    "Bill Number": analysis.get('bill_number', record.get('Bill Number', 'N/A')),
                    "Position": analysis.get('position', record.get('Position', 'Neutral')),
                    "Key Arguments": " | ".join(analysis.get('key_arguments', []) if isinstance(analysis.get('key_arguments'), list) else []),
                    "Stakeholders": " | ".join(analysis.get('stakeholders', []) if isinstance(analysis.get('stakeholders'), list) else []),
                    "Contact Info": analysis.get('contact_info', record.get('Contact Info', '')),
                    "Summary": analysis.get('summary', record.get('Summary', '')),
                    "Keywords": " | ".join(analysis.get('keywords', []) if isinstance(analysis.get('keywords'), list) else []),
                    "Word Count": word_count,
                    "Reading Time": reading_time
                })
                print(f"  ✅ Enriched")
                
                if (i + 1) % 5 == 0 or (i + 1) == len(to_enrich):
                    save_results(all_metadata)
                    print(f"  💾 Progress Saved")
            else:
                print(f"  ❌ Enrichment failed")
        except Exception as e:
            print(f"  ❌ Error: {e}")

    print("\nEnrichment complete!")

if __name__ == "__main__":
    main()
