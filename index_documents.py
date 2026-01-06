#!/usr/bin/env python3
"""
Quick script to index all legislative documents
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from rag import LegislativeChunker, DocumentIndexer

def main():
    print("=" * 60)
    print("Indexing Legislative Documents")
    print("=" * 60)
    
    # Initialize
    chunker = LegislativeChunker(chunk_size=1000, overlap=200)
    indexer = DocumentIndexer()
    
    # Find all documents
    doc_dir = Path("legislative_documents")
    if not doc_dir.exists():
        print(f"Error: {doc_dir} not found")
        return 1
    
    # Get all text and PDF files
    files = list(doc_dir.glob("*.txt")) + list(doc_dir.glob("*.pdf"))
    
    # Filter out log files
    files = [f for f in files if "log" not in f.name.lower()]
    
    print(f"\nFound {len(files)} documents to index:")
    for f in files:
        print(f"  - {f.name}")
    
    # Process each file
    total_chunks = 0
    for i, file_path in enumerate(files, 1):
        print(f"\n[{i}/{len(files)}] Processing: {file_path.name}")
        try:
            chunks = chunker.chunk_file(file_path)
            indexer.add_chunks(chunks)
            total_chunks += len(chunks)
            print(f"  ✓ Created {len(chunks)} chunks")
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    # Save index
    print(f"\n{'=' * 60}")
    print("Saving index...")
    indexer.save()
    
    # Show stats
    stats = indexer.stats()
    print(f"\n{'=' * 60}")
    print("Index Statistics")
    print(f"{'=' * 60}")
    print(f"Total chunks: {stats['total_chunks']}")
    print(f"Unique files: {stats['unique_files']}")
    print(f"Unique bills: {stats['unique_bills']}")
    print(f"Positions: {stats['positions']}")
    print(f"Index size: {stats['index_size_mb']:.2f} MB")
    print(f"Index path: {stats['index_path']}")
    
    print(f"\n✅ Indexing complete! Indexed {total_chunks} chunks from {len(files)} documents.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
