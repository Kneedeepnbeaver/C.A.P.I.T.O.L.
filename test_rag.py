#!/usr/bin/env python3
"""
Test script for Legislative Analysis RAG System

Verifies that all RAG components are working correctly.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_imports():
    """Test that all RAG components can be imported."""
    print("Testing imports...")
    try:
        from rag import (
            LegislativeChunker,
            DocumentIndexer,
            HybridRetriever,
            LegislativeRAGAgent
        )
        print("✓ All RAG components imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def test_chunker():
    """Test the text chunker."""
    print("\nTesting chunker...")
    try:
        from rag import LegislativeChunker
        
        chunker = LegislativeChunker(chunk_size=500, overlap=100)
        
        # Test text
        test_text = """
        Assembly Bill 123 - Housing Affordability Act
        
        From: California Housing Coalition
        Position: Support
        
        We strongly support AB 123 as it addresses the critical housing shortage
        in California. This bill will provide funding for affordable housing
        development and streamline the approval process for new construction.
        
        The current housing crisis affects millions of Californians. Our research
        shows that median home prices have increased by 150% over the past decade,
        while wages have only grown by 30%. This disparity has created a severe
        affordability gap.
        
        AB 123 proposes several key solutions:
        1. Increased funding for affordable housing development
        2. Streamlined approval processes
        3. Incentives for developers to include affordable units
        4. Protection for existing tenants
        
        We urge the committee to support this important legislation.
        """
        
        chunks = chunker.chunk_document(test_text, "test_document.txt")
        
        print(f"✓ Created {len(chunks)} chunks")
        print(f"  - First chunk: {len(chunks[0]['text'])} chars")
        print(f"  - Metadata extracted: bill={chunks[0]['bill_number']}, position={chunks[0]['position']}")
        
        return True
    except Exception as e:
        print(f"✗ Chunker error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_indexer():
    """Test the document indexer."""
    print("\nTesting indexer...")
    try:
        from rag import LegislativeChunker, DocumentIndexer
        
        # Create test chunks
        chunker = LegislativeChunker(chunk_size=500, overlap=100)
        test_text = "AB 123 addresses housing affordability in California. " * 20
        chunks = chunker.chunk_document(test_text, "test.txt")
        
        # Test indexer
        indexer = DocumentIndexer(index_path=Path("test_index.jsonl"))
        added = indexer.add_chunks(chunks)
        
        print(f"✓ Added {added} chunks to index")
        
        # Test search
        results = indexer.search("housing affordability", top_k=3)
        print(f"✓ Search returned {len(results)} results")
        
        # Test stats
        stats = indexer.stats()
        print(f"✓ Index stats: {stats['total_chunks']} chunks, {stats['unique_files']} files")
        
        # Cleanup
        if Path("test_index.jsonl").exists():
            Path("test_index.jsonl").unlink()
        
        return True
    except Exception as e:
        print(f"✗ Indexer error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_retriever():
    """Test the hybrid retriever."""
    print("\nTesting retriever...")
    try:
        from rag import LegislativeChunker, DocumentIndexer, HybridRetriever
        
        # Create test index
        chunker = LegislativeChunker(chunk_size=500, overlap=100)
        test_text = """
        AB 123 focuses on housing affordability and tenant protection.
        SB 456 addresses climate change and environmental protection.
        HR 789 deals with healthcare reform and insurance coverage.
        """ * 10
        
        chunks = chunker.chunk_document(test_text, "test.txt")
        indexer = DocumentIndexer(index_path=Path("test_index.jsonl"))
        indexer.add_chunks(chunks)
        
        # Test retriever
        retriever = HybridRetriever(indexer, use_semantic=False)  # Keyword only for testing
        results = retriever.retrieve("housing affordability", top_k=3)
        
        print(f"✓ Retrieved {len(results)} results")
        if results:
            print(f"  - Top result relevance: {results[0].relevance_score:.1f}%")
        
        # Cleanup
        if Path("test_index.jsonl").exists():
            Path("test_index.jsonl").unlink()
        
        return True
    except Exception as e:
        print(f"✗ Retriever error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_rag_agent():
    """Test the RAG agent."""
    print("\nTesting RAG agent...")
    try:
        from rag import LegislativeChunker, DocumentIndexer, HybridRetriever, LegislativeRAGAgent
        
        # Create test index
        chunker = LegislativeChunker(chunk_size=500, overlap=100)
        test_text = """
        AB 123 - Housing Affordability Act
        
        This bill addresses the critical housing shortage by providing funding
        for affordable housing development and streamlining approval processes.
        
        Key provisions:
        - $500M in funding for affordable housing
        - Streamlined approval for projects with 20% affordable units
        - Tenant protection measures
        - Incentives for developers
        
        Supporters argue this will help address California's housing crisis.
        """ * 3
        
        chunks = chunker.chunk_document(test_text, "test.txt")
        indexer = DocumentIndexer(index_path=Path("test_index.jsonl"))
        indexer.add_chunks(chunks)
        
        # Test agent (without actually calling Ollama)
        retriever = HybridRetriever(indexer, use_semantic=False)
        agent = LegislativeRAGAgent(indexer, retriever)
        
        # Test search
        search_results = agent.search_documents("housing affordability", top_k=3)
        print(f"✓ Agent search returned {len(search_results)} results")
        
        # Note: We skip testing generate_with_rag as it requires Ollama
        print("  (Skipping generation test - requires Ollama)")
        
        # Cleanup
        if Path("test_index.jsonl").exists():
            Path("test_index.jsonl").unlink()
        
        return True
    except Exception as e:
        print(f"✗ RAG agent error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("=" * 60)
    print("Legislative Analysis RAG System - Test Suite")
    print("=" * 60)
    
    tests = [
        ("Imports", test_imports),
        ("Chunker", test_chunker),
        ("Indexer", test_indexer),
        ("Retriever", test_retriever),
        ("RAG Agent", test_rag_agent),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} test failed with exception: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! RAG system is ready to use.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
