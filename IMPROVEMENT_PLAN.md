# Legislative Analysis Tool - RAG System Improvement Plan

## Executive Summary
This document outlines improvements to the Legislative Analysis Tool by integrating advanced RAG (Retrieval-Augmented Generation) capabilities from the ML_Models project.

## Current State Analysis

### Strengths
- ✅ Clean Electron + React architecture
- ✅ Flask API backend with CORS support
- ✅ Basic metadata extraction and search
- ✅ Multiple artifact generation types
- ✅ Export functionality (MD, HTML, DOCX, TXT)
- ✅ Ollama integration for LLM generation

### Limitations
1. **Simple keyword search** - No semantic understanding
2. **No text chunking** - Entire documents loaded into context
3. **No hybrid retrieval** - Missing semantic + keyword combination
4. **Limited context management** - No smart chunk selection
5. **No document indexing** - Inefficient full-text search
6. **Missing RAG pipeline** - No structured retrieval workflow

## Proposed Improvements

### Phase 1: Core RAG Infrastructure
**Goal:** Add robust text chunking and indexing capabilities

#### 1.1 Text Chunking Module
- **Source:** Adapt `text_chunker.py` from ML_Models
- **Features:**
  - Smart chunking at sentence/paragraph boundaries
  - Configurable chunk size and overlap
  - Token counting with tiktoken
  - Metadata preservation
  - VTT support (already in source)

#### 1.2 Document Indexing
- **Source:** Adapt `DocumentIndex` from `rag_agent_base.py`
- **Enhancement:** Add persistent storage (SQLite or JSON)
- **Features:**
  - Fast chunk-level search
  - Metadata filtering
  - Relevance scoring

### Phase 2: Advanced Retrieval
**Goal:** Implement hybrid retrieval for better context selection

#### 2.1 Hybrid Retriever
- **Source:** `rag/retrieval/hybrid_retriever.py`
- **Features:**
  - Semantic search (embeddings)
  - Keyword search (BM25)
  - Combined scoring
  - Top-k selection

#### 2.2 Semantic Search
- **Source:** `rag/retrieval/semantic_retriever.py`
- **Requirements:**
  - sentence-transformers library
  - Local embedding model (all-MiniLM-L6-v2)
  - Vector similarity search

### Phase 3: Enhanced Generation
**Goal:** Improve artifact quality with better context

#### 3.1 RAG Agent Integration
- **Source:** `BaseRAGAgent` from `rag_agent_base.py`
- **Customization:** Create `LegislativeRAGAgent` subclass
- **Features:**
  - Structured prompts
  - Context windowing
  - Citation tracking
  - Response parsing

#### 3.2 Government Communication Agent
- **Source:** `government_communication_agent.py`
- **Adaptation:** Integrate legislative-specific templates
- **Features:**
  - Professional tone presets
  - Stakeholder analysis
  - Policy recommendation formatting

### Phase 4: API Enhancements
**Goal:** Expose new RAG capabilities via API

#### 4.1 New Endpoints
```
POST /library/chunk - Chunk documents on upload
POST /library/reindex - Rebuild search index
POST /search/semantic - Semantic document search
POST /search/hybrid - Combined semantic + keyword
POST /generate/rag - RAG-enhanced generation
GET /chunks/:filename - Get chunks for a document
```

#### 4.2 Background Processing
- Async chunking on document import
- Incremental index updates
- Progress tracking

### Phase 5: UI Improvements
**Goal:** Expose RAG features in the interface

#### 5.1 Search Enhancements
- Search mode toggle (keyword/semantic/hybrid)
- Relevance score display
- Chunk-level preview
- Source citation in results

#### 5.2 Generation Settings
- Context size control
- Chunk selection preview
- Citation inclusion toggle
- Model temperature/parameters

## Implementation Priority

### High Priority (Week 1)
1. ✅ Text chunking module
2. ✅ Document indexing
3. ✅ Chunk storage (JSONL format)
4. ✅ API endpoints for chunking

### Medium Priority (Week 2)
1. ⏳ Hybrid retrieval system
2. ⏳ Semantic search integration
3. ⏳ RAG-enhanced generation
4. ⏳ UI for search modes

### Low Priority (Week 3+)
1. ⏳ Advanced analytics
2. ⏳ Batch processing
3. ⏳ Performance optimization
4. ⏳ Caching layer

## Technical Architecture

### New File Structure
```
Legislative_Analysis/
├── rag/
│   ├── __init__.py
│   ├── chunker.py           # Adapted from text_chunker.py
│   ├── indexer.py           # Document indexing
│   ├── retriever.py         # Hybrid retrieval
│   └── agent.py             # LegislativeRAGAgent
├── legislative_chunks/      # Chunked documents (JSONL)
├── legislative_index.db     # SQLite index (optional)
└── legislative_embeddings/  # Cached embeddings
```

### Dependencies to Add
```python
# requirements.txt additions
sentence-transformers>=2.2.0
faiss-cpu>=1.7.4  # or faiss-gpu
tiktoken>=0.5.0
rank-bm25>=0.2.2
```

## Success Metrics

### Performance
- Search latency < 500ms
- Generation time < 30s for 5 documents
- Index build time < 1min for 100 documents

### Quality
- Semantic search precision > 80%
- Hybrid retrieval beats keyword-only by 20%
- Generated artifacts cite specific chunks

### User Experience
- Search results in < 1 second
- Clear source attribution
- Configurable context size

## Migration Strategy

### Backward Compatibility
- Keep existing keyword search as fallback
- Gradual rollout of RAG features
- Optional chunking (on-demand)

### Data Migration
1. Chunk existing documents in background
2. Build initial index
3. Generate embeddings for semantic search
4. Validate against existing metadata

## Next Steps

1. **Review and approve** this plan
2. **Set up development branch** for RAG integration
3. **Install dependencies** in virtual environment
4. **Implement Phase 1** (chunking + indexing)
5. **Test with sample documents**
6. **Iterate based on feedback**

---

**Created:** 2026-01-04
**Author:** AI Assistant
**Status:** Proposed
