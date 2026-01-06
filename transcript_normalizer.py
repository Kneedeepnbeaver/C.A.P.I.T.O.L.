#!/usr/bin/env python3
"""
Legislative Transcript Normalizer

Normalizes California Legislature hearing transcripts (VTT format):
- Removes WEBVTT headers
- Converts ALL CAPS to sentence case
- Preserves legislative acronyms (SB, AB, etc.)
- Removes PII (emails, phone numbers, SSNs)
- Optimizes for RAG chunking and indexing
"""

import re
from typing import Optional

# Legislative and common acronyms to preserve
LEGISLATIVE_ACRONYMS = {
    # Bills and Legislation
    'SB', 'AB', 'HR', 'SR', 'ACA', 'SCA', 'ACR', 'SCR', 'AJR', 'SJR',
    
    # California Departments and Agencies
    'DHS', 'DHCS', 'DMV', 'DOJ', 'DOT', 'CalEPA', 'CDPH', 'CDCR', 'EDD',
    'CalOES', 'CalFire', 'CHP', 'FTB', 'BOE', 'CPUC', 'CARB',
    
    # Programs
    'MEDI-CAL', 'CAL', 'AIM', 'TANF', 'SNAP', 'WIC',
    
    # Technology
    'IT', 'AI', 'ML', 'API', 'JSON', 'CSV', 'VTT', 'WEBVTT',
    
    # Federal Agencies
    'FDA', 'CDC', 'NIH', 'NASA', 'FBI', 'CIA', 'EPA', 'OSHA', 'FEMA',
    
    # Organizations
    'USA', 'US', 'UK', 'EU', 'UN', 'WHO', 'WTO', 'NATO', 'ACLU',
    
    # Common
    'Q&A', 'FAQ', 'CEO', 'CFO', 'CTO', 'VP', 'HR', 'PR', 'R&D',
    'GDP', 'GDPR', 'HIPAA', 'ADA', 'FOIA'
}

# PII Patterns
PII_PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'ssn': r'\b\d{3}-?\d{2}-?\d{4}\b',
    'credit_card': r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
}

# Phone number patterns
PHONE_PATTERNS = [
    r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # US: 123-456-7890
    r'\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b',  # US: (123) 456-7890
    r'\b\+?1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # US with country code
]


def remove_pii(text: str) -> str:
    """Remove personally identifiable information."""
    result = text
    
    # Remove emails
    result = re.sub(PII_PATTERNS['email'], '[EMAIL_REDACTED]', result)
    
    # Remove SSNs
    result = re.sub(PII_PATTERNS['ssn'], '[SSN_REDACTED]', result)
    
    # Remove credit cards
    result = re.sub(PII_PATTERNS['credit_card'], '[CARD_REDACTED]', result)
    
    # Remove phone numbers
    for pattern in PHONE_PATTERNS:
        result = re.sub(pattern, '[PHONE_REDACTED]', result)
    
    return result


def remove_vtt_headers(text: str) -> str:
    """Remove WEBVTT headers and timestamp markers."""
    # Remove BOM if present
    text = text.lstrip('\ufeff')
    
    # Remove WEBVTT header
    text = re.sub(r'^WEBVTT\s*\n?', '', text, flags=re.IGNORECASE)
    
    # Remove timestamp lines (00:00:00.000 --> 00:00:05.000)
    text = re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\s*\n?', '', text)
    
    # Remove standalone timestamps
    text = re.sub(r'^\d{2}:\d{2}:\d{2}\.\d{3}\s*$', '', text, flags=re.MULTILINE)
    
    # Remove VTT cue identifiers (numbers at start of lines)
    text = re.sub(r'^\d+\s*\n', '', text, flags=re.MULTILINE)
    
    return text


def normalize_case(text: str) -> str:
    """
    Convert ALL CAPS text to sentence case while preserving acronyms.
    
    Specifically designed for California Legislature transcripts which are
    typically in ALL CAPS without proper punctuation.
    """
    if not text:
        return text
    
    # Check if text is mostly ALL CAPS
    alpha_chars = [c for c in text if c.isalpha()]
    if not alpha_chars:
        return text
    
    upper_ratio = sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
    is_all_caps = upper_ratio > 0.5
    
    if not is_all_caps:
        # Text is already mixed case, just return it
        return text
    
    # Store original for acronym detection
    original = text
    
    # Convert to lowercase
    result = text.lower()
    
    # Preserve known legislative acronyms
    for acronym in LEGISLATIVE_ACRONYMS:
        # Match whole words only
        pattern = r'\b' + re.escape(acronym.lower()) + r'\b'
        result = re.sub(pattern, acronym, result, flags=re.IGNORECASE)
    
    # Preserve bill numbers (SB 1047, AB 412, etc.)
    result = re.sub(
        r'\b(sb|ab|hr|sr|aca|sca|acr|scr|ajr|sjr)\s+(\d+)\b',
        lambda m: m.group(1).upper() + ' ' + m.group(2),
        result,
        flags=re.IGNORECASE
    )
    
    # Capitalize first letter of sentences
    # After . ! ? followed by space or newline
    result = re.sub(
        r'(^|[.!?]+["\')]*\s+)([a-z])',
        lambda m: m.group(1) + m.group(2).upper(),
        result,
        flags=re.MULTILINE
    )
    
    # Capitalize after paragraph breaks
    result = re.sub(
        r'(\n\n+)([a-z])',
        lambda m: m.group(1) + m.group(2).upper(),
        result
    )
    
    # Capitalize first character of text
    if result:
        for i, char in enumerate(result):
            if char.isalpha():
                result = result[:i] + char.upper() + result[i+1:]
                break
    
    # Capitalize after newlines
    result = re.sub(
        r'(\n+)([a-z])',
        lambda m: m.group(1) + m.group(2).upper(),
        result
    )
    
    return result


def add_punctuation(text: str) -> str:
    """
    Add basic punctuation to transcript text.
    
    California Legislature transcripts often lack proper punctuation.
    This adds periods at logical sentence boundaries.
    """
    # Add period before new speaker (SPEAKER NAME:)
    text = re.sub(
        r'([a-z])\s*\n\s*([A-Z][A-Z\s]+:)',
        r'\1.\n\n\2',
        text
    )
    
    # Add period at end of paragraphs if missing
    text = re.sub(
        r'([a-z])\s*\n\n',
        r'\1.\n\n',
        text
    )
    
    # Add period before "Thank you"
    text = re.sub(
        r'([a-z])\s+(Thank you)',
        r'\1. \2',
        text,
        flags=re.IGNORECASE
    )
    
    return text


def clean_whitespace(text: str) -> str:
    """Clean up excessive whitespace."""
    # Replace multiple spaces with single space
    text = re.sub(r' +', ' ', text)
    
    # Replace multiple newlines with double newline
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Remove trailing whitespace from lines
    text = re.sub(r' +\n', '\n', text)
    
    # Remove leading whitespace from lines
    text = re.sub(r'\n +', '\n', text)
    
    return text.strip()


def normalize_transcript(text: str, remove_pii_data: bool = True) -> str:
    """
    Normalize a California Legislature hearing transcript.
    
    Args:
        text: Raw transcript text (VTT format or plain text)
        remove_pii_data: Whether to remove PII (default: True)
    
    Returns:
        Normalized, sentence-cased text ready for chunking
    """
    if not text:
        return text
    
    # Step 1: Remove VTT headers and timestamps
    text = remove_vtt_headers(text)
    
    # Step 2: Remove PII if requested
    if remove_pii_data:
        text = remove_pii(text)
    
    # Step 3: Normalize case (ALL CAPS to sentence case)
    text = normalize_case(text)
    
    # Step 4: Add basic punctuation
    text = add_punctuation(text)
    
    # Step 5: Clean whitespace
    text = clean_whitespace(text)
    
    return text


def normalize_file(input_path: str, output_path: Optional[str] = None) -> str:
    """
    Normalize a transcript file.
    
    Args:
        input_path: Path to input VTT or text file
        output_path: Path to output file (default: overwrite input)
    
    Returns:
        Normalized text
    """
    # Read file
    with open(input_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Normalize
    normalized = normalize_transcript(text)
    
    # Write output
    if output_path is None:
        output_path = input_path
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(normalized)
    
    return normalized


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python transcript_normalizer.py <input_file> [output_file]")
        print("\nNormalizes California Legislature hearing transcripts:")
        print("  - Removes WEBVTT headers")
        print("  - Converts ALL CAPS to sentence case")
        print("  - Preserves legislative acronyms")
        print("  - Removes PII")
        print("  - Adds basic punctuation")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    print(f"Normalizing: {input_file}")
    normalized = normalize_file(input_file, output_file)
    print(f"✓ Normalized to: {output_file or input_file}")
    print(f"  Length: {len(normalized)} characters")
