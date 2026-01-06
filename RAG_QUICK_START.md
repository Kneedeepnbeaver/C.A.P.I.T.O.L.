# Legislative Analysis Tool - RAG Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (2 minutes)

```bash
# Navigate to the Legislative Analysis directory
cd "/Volumes/The Secret Archive/01_BUSINESS/Arts_by_Dylan/Blog Posts/Legislative_Analysis"

# Install core RAG dependencies
pip install tiktoken pandas flask flask-cors pdfplumber python-docx markdown requests

# Optional but recommended: Install semantic search
pip install sentence-transformers numpy
```

### Step 2: Test the System (1 minute)

```bash
# Run the test suite
python test_rag.py
```

You should see:
```
✓ PASS: Imports
✓ PASS: Chunker
✓ PASS: Indexer
✓ PASS: Retriever
✓ PASS: RAG Agent

🎉 All tests passed! RAG system is ready to use.
```

### Step 3: Start the Enhanced Server (30 seconds)

```bash
# Start the RAG-enhanced API server
python electron-app/api/server_rag.py
```

Server will start on `http://127.0.0.1:5001`

### Step 4: Index Your Documents (1 minute)

Open a new terminal and run:

```bash
# Index all existing documents
curl -X POST http://127.0.0.1:5001/rag/reindex
```

Or use Python:

```python
import requests
response = requests.post('http://127.0.0.1:5001/rag/reindex')
print(response.json())
```

### Step 5: Try It Out! (30 seconds)

#### Search with RAG

```bash
curl -X POST http://127.0.0.1:5001/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "housing affordability", "top_k": 5}'
```

#### Generate with RAG

```bash
curl -X POST http://127.0.0.1:5001/rag/generate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "housing affordability",
    "artifact_type": "Executive Summary",
    "tone": "Professional",
    "top_k": 5
  }'
```

## 📚 Common Tasks

### Task 1: Chunk a New Document

```python
from Legislative_Analysis.rag import LegislativeChunker, DocumentIndexer

# Read your document
with open("legislative_documents/new_document.txt") as f:
    text = f.read()

# Chunk it
chunker = LegislativeChunker(chunk_size=1000, overlap=200)
chunks = chunker.chunk_document(text, "new_document.txt")

# Add to index
indexer = DocumentIndexer()
indexer.add_chunks(chunks)
indexer.save()

print(f"✓ Added {len(chunks)} chunks to index")
```

### Task 2: Search for Relevant Chunks

```python
from Legislative_Analysis.rag import DocumentIndexer, HybridRetriever

# Load index
indexer = DocumentIndexer()
retriever = HybridRetriever(indexer)

# Search
results = retriever.retrieve("climate change policy", top_k=5)

# Display results
for i, chunk in enumerate(results, 1):
    print(f"\n{i}. {chunk.source_file} (Relevance: {chunk.relevance_score:.1f}%)")
    print(f"   Bill: {chunk.bill_number}")
    print(f"   Position: {chunk.position}")
    print(f"   Preview: {chunk.text[:150]}...")
```

### Task 3: Generate an Artifact with RAG

```python
from Legislative_Analysis.rag import LegislativeRAGAgent, DocumentIndexer, HybridRetriever

# Initialize
indexer = DocumentIndexer()
retriever = HybridRetriever(indexer)
agent = LegislativeRAGAgent(indexer, retriever)

# Generate
result = agent.generate_with_rag(
    query="housing affordability in California",
    artifact_type="Executive Summary",
    tone="Professional",
    top_k=5
)

# Display
print(result['content'])
print(f"\n{'='*60}")
print(f"Sources used: {result['chunks_used']}")
for source in result['sources']:
    print(f"  • {source['file']}")
    print(f"    Bill: {source['bill']}, Position: {source['position']}")
    print(f"    Relevance: {source['relevance']}%")
```

### Task 4: Filter by Bill Number

```python
from Legislative_Analysis.rag import DocumentIndexer, HybridRetriever

indexer = DocumentIndexer()
retriever = HybridRetriever(indexer)

# Search only within AB 123 documents
results = retriever.retrieve(
    query="housing",
    top_k=5,
    filters={"bill_number": "AB 123"}
)

for chunk in results:
    print(f"{chunk.source_file}: {chunk.text[:100]}...")
```

### Task 5: Get Index Statistics

```python
from Legislative_Analysis.rag import DocumentIndexer

indexer = DocumentIndexer()
stats = indexer.stats()

print(f"Total chunks: {stats['total_chunks']}")
print(f"Unique files: {stats['unique_files']}")
print(f"Unique bills: {stats['unique_bills']}")
print(f"Positions: {stats['positions']}")
print(f"Index size: {stats['index_size_mb']:.2f} MB")
```

## 🔧 Configuration

### Adjust Chunk Size

```python
# Smaller chunks = more precise retrieval, more chunks
chunker = LegislativeChunker(chunk_size=500, overlap=100)

# Larger chunks = more context per chunk, fewer chunks
chunker = LegislativeChunker(chunk_size=1500, overlap=300)
```

### Enable/Disable Semantic Search

```python
# With semantic search (requires sentence-transformers)
retriever = HybridRetriever(indexer, use_semantic=True)

# Keyword only (faster, no extra dependencies)
retriever = HybridRetriever(indexer, use_semantic=False)
```

### Adjust Retrieval Weights

```python
# More weight on keywords (30% keyword, 70% semantic)
results = retriever.retrieve(
    query="housing",
    keyword_weight=0.3,
    semantic_weight=0.7
)

# Equal weight (50% keyword, 50% semantic)
results = retriever.retrieve(
    query="housing",
    keyword_weight=0.5,
    semantic_weight=0.5
)
```

### Change LLM Model

```python
# Use a different Ollama model
agent = LegislativeRAGAgent(
    indexer,
    retriever,
    model="phi3:mini"  # Faster, smaller model
)

# Or specify per-generation
result = agent.generate_with_rag(
    query="housing",
    artifact_type="Executive Summary",
    # ... other params
)
```

## 🐛 Troubleshooting

### "RAG system not available"

**Problem**: RAG components failed to import

**Solution**:
```bash
cd Legislative_Analysis/rag
pip install -r requirements.txt
```

### "tiktoken not available"

**Problem**: Token counting library missing

**Solution**:
```bash
pip install tiktoken
```

### "sentence-transformers not available"

**Problem**: Semantic search library missing (optional)

**Solution**: Either install it or use keyword-only mode
```bash
# Option 1: Install it
pip install sentence-transformers

# Option 2: Use keyword-only
retriever = HybridRetriever(indexer, use_semantic=False)
```

### "Could not connect to Ollama"

**Problem**: Ollama not running

**Solution**:
```bash
# Start Ollama
ollama serve

# Or check if it's running
curl http://localhost:11434/api/tags
```

### Empty search results

**Problem**: Index is empty or documents not chunked

**Solution**:
```bash
# Rebuild index
curl -X POST http://127.0.0.1:5001/rag/reindex

# Or manually chunk documents
python -c "
from Legislative_Analysis.rag import LegislativeChunker, DocumentIndexer
from pathlib import Path

chunker = LegislativeChunker()
indexer = DocumentIndexer()

for file in Path('Legislative_Analysis/legislative_documents').glob('*.txt'):
    chunks = chunker.chunk_file(file)
    indexer.add_chunks(chunks)

indexer.save()
print(f'Indexed {len(indexer.chunks)} chunks')
"
```

## 📖 Next Steps

### Learn More
- Read `rag/README.md` for detailed documentation
- Check `RAG_ARCHITECTURE.md` for system design
- Review `IMPROVEMENT_PLAN.md` for roadmap

### Integrate with Frontend
1. Update Electron app to use RAG endpoints
2. Add search mode toggle (keyword/semantic/hybrid)
3. Display chunk previews in search results
4. Show source citations in generated artifacts

### Optimize Performance
1. Adjust chunk size based on your documents
2. Enable semantic search for better results
3. Use filters to narrow search scope
4. Cache frequently accessed chunks

## 💡 Tips & Best Practices

### Chunking
- **Use overlap** for better context continuity
- **Adjust chunk size** based on document length
- **Re-chunk** if you change chunk size significantly

### Searching
- **Use filters** to narrow results (bill number, position, etc.)
- **Try different queries** if results aren't relevant
- **Combine keyword + semantic** for best results

### Generation
- **Start with fewer chunks** (top_k=3-5) for focused output
- **Use more chunks** (top_k=10-15) for comprehensive analysis
- **Apply filters** to ensure relevant context
- **Review sources** to verify quality

### Performance
- **Rebuild embeddings** after adding many documents
- **Use keyword-only** for faster searches
- **Batch index updates** instead of one-by-one
- **Monitor index size** and clean up if needed

## 🎯 Quick Reference

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/rag/chunk` | POST | Chunk and index a document |
| `/rag/reindex` | POST | Rebuild entire index |
| `/rag/search` | POST | Search with hybrid retrieval |
| `/rag/generate` | POST | Generate with RAG |
| `/rag/stats` | GET | Get index statistics |

### Python Classes

| Class | Purpose |
|-------|---------|
| `LegislativeChunker` | Chunk documents |
| `DocumentIndexer` | Index and search chunks |
| `HybridRetriever` | Hybrid keyword + semantic search |
| `LegislativeRAGAgent` | RAG-enhanced generation |

### Default Values

| Parameter | Default | Range |
|-----------|---------|-------|
| `chunk_size` | 1000 | 500-2000 |
| `overlap` | 200 | 0-500 |
| `top_k` | 5 | 1-20 |
| `keyword_weight` | 0.3 | 0.0-1.0 |
| `semantic_weight` | 0.7 | 0.0-1.0 |

---

**Need Help?** Check the full documentation in `rag/README.md` or `RAG_INTEGRATION_SUMMARY.md`

**Ready to go!** 🚀
