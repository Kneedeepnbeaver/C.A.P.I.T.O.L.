#!/usr/bin/env python3
"""
RAG System Demo - Interactive Test

This script demonstrates the RAG system capabilities with your indexed documents.
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from rag import DocumentIndexer, HybridRetriever, LegislativeRAGAgent

def print_header(title):
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print(f"{'=' * 70}\n")

def demo_search():
    """Demonstrate search capabilities."""
    print_header("DEMO 1: Search for Relevant Chunks")
    
    # Load index
    indexer = DocumentIndexer()
    retriever = HybridRetriever(indexer, use_semantic=False)  # Keyword only for speed
    
    # Show stats
    stats = indexer.stats()
    print(f"📊 Index loaded:")
    print(f"   - Total chunks: {stats['total_chunks']}")
    print(f"   - Unique files: {stats['unique_files']}")
    print(f"   - Unique bills: {stats['unique_bills']}")
    print(f"   - Positions: {stats['positions']}")
    
    # Test queries
    queries = [
        "artificial intelligence safety",
        "SB 1047",
        "frontier models"
    ]
    
    for query in queries:
        print(f"\n🔍 Query: \"{query}\"")
        print("-" * 70)
        
        results = retriever.retrieve(query, top_k=3)
        
        if not results:
            print("   No results found")
            continue
        
        for i, chunk in enumerate(results, 1):
            print(f"\n   [{i}] {chunk.source_file}")
            print(f"       Relevance: {chunk.relevance_score:.1f}%")
            print(f"       Bill: {chunk.bill_number or 'N/A'}")
            print(f"       Position: {chunk.position or 'N/A'}")
            print(f"       Preview: {chunk.text[:150]}...")

def demo_filter_search():
    """Demonstrate filtered search."""
    print_header("DEMO 2: Filtered Search by Bill")
    
    indexer = DocumentIndexer()
    retriever = HybridRetriever(indexer, use_semantic=False)
    
    # Search only within SB 1047
    print("🔍 Searching for 'safety' in SB 1047 documents only")
    print("-" * 70)
    
    results = retriever.retrieve(
        "safety",
        top_k=5,
        filters={"bill_number": "SB 1047"}
    )
    
    print(f"\nFound {len(results)} results:")
    for i, chunk in enumerate(results, 1):
        print(f"\n   [{i}] Chunk {chunk.chunk_index + 1}/{chunk.total_chunks}")
        print(f"       File: {chunk.source_file}")
        print(f"       Relevance: {chunk.relevance_score:.1f}%")
        print(f"       Text: {chunk.text[:200]}...")

def demo_rag_agent():
    """Demonstrate RAG agent search."""
    print_header("DEMO 3: RAG Agent Document Search")
    
    indexer = DocumentIndexer()
    retriever = HybridRetriever(indexer, use_semantic=False)
    agent = LegislativeRAGAgent(indexer, retriever)
    
    query = "What are the main concerns about AI safety?"
    print(f"🤖 Agent Query: \"{query}\"")
    print("-" * 70)
    
    results = agent.search_documents(query, top_k=5)
    
    print(f"\nAgent found {len(results)} relevant chunks:")
    for i, result in enumerate(results, 1):
        print(f"\n   [{i}] {result['file']}")
        print(f"       Bill: {result['bill']}")
        print(f"       Position: {result['position']}")
        print(f"       Relevance: {result['relevance']}%")
        print(f"       Chunk: {result['chunk_index'] + 1}/{result['total_chunks']}")
        print(f"       Preview: {result['text'][:150]}...")

def demo_bill_analysis():
    """Show all chunks from a specific bill."""
    print_header("DEMO 4: Analyze Specific Bill")
    
    indexer = DocumentIndexer()
    
    # Get all SB 1047 chunks
    sb1047_chunks = indexer.get_by_bill("SB 1047")
    
    print(f"📄 SB 1047 Analysis")
    print(f"   Total chunks: {len(sb1047_chunks)}")
    
    if sb1047_chunks:
        # Show positions
        positions = {}
        for chunk in sb1047_chunks:
            pos = chunk.position or "Unknown"
            positions[pos] = positions.get(pos, 0) + 1
        
        print(f"\n   Positions breakdown:")
        for pos, count in positions.items():
            print(f"      - {pos}: {count} chunks")
        
        # Show sample chunks
        print(f"\n   Sample chunks:")
        for i, chunk in enumerate(sb1047_chunks[:3], 1):
            print(f"\n   [{i}] {chunk.source_file}")
            print(f"       Position: {chunk.position}")
            print(f"       Text: {chunk.text[:200]}...")

def main():
    """Run all demos."""
    print("\n" + "=" * 70)
    print("  🚀 Legislative Analysis RAG System - Interactive Demo")
    print("=" * 70)
    
    try:
        # Run demos
        demo_search()
        input("\n\nPress Enter to continue to next demo...")
        
        demo_filter_search()
        input("\n\nPress Enter to continue to next demo...")
        
        demo_rag_agent()
        input("\n\nPress Enter to continue to next demo...")
        
        demo_bill_analysis()
        
        print_header("Demo Complete!")
        print("✅ All RAG features demonstrated successfully!")
        print("\nYou can now:")
        print("  1. Use the RAG-enhanced API server (already running on port 5001)")
        print("  2. Integrate RAG search into your Electron frontend")
        print("  3. Try RAG-enhanced generation with Ollama")
        print("\nFor more examples, see RAG_QUICK_START.md")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
