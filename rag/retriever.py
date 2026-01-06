"""
Hybrid Retriever for Legislative Documents

Combines keyword search with optional semantic search for better retrieval.
"""

import logging
from typing import List, Dict, Optional
from .indexer import DocumentIndexer, ChunkRecord

logger = logging.getLogger(__name__)

# Try to import sentence transformers for semantic search
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    SEMANTIC_SEARCH_AVAILABLE = True
except ImportError:
    SEMANTIC_SEARCH_AVAILABLE = False
    logger.info("sentence-transformers not available - semantic search disabled")


class HybridRetriever:
    """
    Hybrid retrieval combining keyword and semantic search.
    
    Falls back to keyword-only search if semantic search is unavailable.
    """
    
    def __init__(
        self,
        indexer: DocumentIndexer,
        use_semantic: bool = True,
        semantic_model: str = "all-MiniLM-L6-v2",
        cache_path: Optional[Path] = None
    ):
        """
        Initialize the retriever.
        
        Args:
            indexer: Document indexer instance
            use_semantic: Whether to use semantic search (requires sentence-transformers)
            semantic_model: Name of sentence-transformers model
            cache_path: Path to embedding cache file
        """
        self.indexer = indexer
        self.use_semantic = use_semantic and SEMANTIC_SEARCH_AVAILABLE
        self.semantic_model = semantic_model
        
        if cache_path is None:
            self.cache_path = self.indexer.index_path.parent / "index_embeddings.npy"
        else:
            self.cache_path = Path(cache_path)
        
        # Initialize semantic search if available
        self.model = None
        self.embeddings = None
        self.is_ready = not self.use_semantic # If no semantic, we are ready
        
        # We will lazy-load the model and embeddings in server_rag.py or on first use
        if not self.use_semantic:
            logger.info("Using keyword-only search")

    def initialize(self):
        """Perform actual loading of model and embeddings (lazy load)."""
        if not self.use_semantic or self.is_ready:
            return

        try:
            import time
            start_time = time.time()
            
            logger.info(f"Loading semantic model: {self.semantic_model}")
            self.model = SentenceTransformer(self.semantic_model)
            
            # Try to load from cache
            if self.cache_path.exists():
                logger.info(f"Loading embeddings from cache: {self.cache_path}")
                self.embeddings = np.load(self.cache_path)
                
                # Check if cache matches current index size
                if len(self.embeddings) != len(self.indexer.chunks):
                    logger.info("Cache size mismatch, rebuilding embeddings...")
                    self._build_embeddings()
                    self.save_cache()
            else:
                logger.info("No cache found, building embeddings...")
                self._build_embeddings()
                self.save_cache()
                
            self.is_ready = True
            logger.info(f"Semantic search enabled (init took {time.time() - start_time:.2f}s)")
        except Exception as e:
            logger.warning(f"Failed to initialize semantic model: {e}")
            self.use_semantic = False
            self.is_ready = True

    def save_cache(self):
        """Save current embeddings to disk."""
        if self.embeddings is not None:
            try:
                np.save(self.cache_path, self.embeddings)
                logger.info(f"Saved embeddings to {self.cache_path}")
            except Exception as e:
                logger.error(f"Error saving embedding cache: {e}")
    
    def _build_embeddings(self):
        """Build embeddings for all chunks in the index."""
        if not self.model or not self.indexer.chunks:
            return
        
        try:
            texts = [chunk.text for chunk in self.indexer.chunks]
            logger.info(f"Building embeddings for {len(texts)} chunks...")
            self.embeddings = self.model.encode(texts, show_progress_bar=False)
            logger.info("Embeddings built successfully")
        except Exception as e:
            logger.error(f"Error building embeddings: {e}")
            self.use_semantic = False
    
    def rebuild_embeddings(self):
        """Rebuild embeddings after index changes."""
        if self.use_semantic:
            self._build_embeddings()
            self.save_cache()
    
    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict] = None,
        keyword_weight: float = 0.3,
        semantic_weight: float = 0.7
    ) -> List[ChunkRecord]:
        """
        Retrieve relevant chunks using hybrid search.
        
        Args:
            query: Search query
            top_k: Number of results to return
            filters: Optional metadata filters
            keyword_weight: Weight for keyword score (0-1)
            semantic_weight: Weight for semantic score (0-1)
            
        Returns:
            List of relevant chunks sorted by combined score
        """
        # Trigger lazy init if not ready
        if self.use_semantic and not self.is_ready:
            self.initialize()

        # If semantic search not available or not ready, use keyword only
        if not self.use_semantic or self.embeddings is None:
            return self.indexer.search(query, top_k=top_k, filters=filters)
        
        # Get keyword results
        keyword_results = self.indexer.search(query, top_k=top_k * 2, filters=filters)
        keyword_scores = {chunk.id: chunk.relevance_score for chunk in keyword_results}
        
        # Get semantic results
        semantic_results = self._semantic_search(query, top_k=top_k * 2, filters=filters)
        semantic_scores = {chunk.id: chunk.relevance_score for chunk in semantic_results}
        
        # Combine scores
        all_chunk_ids = set(keyword_scores.keys()) | set(semantic_scores.keys())
        combined_scores = {}
        
        # Normalize scores to 0-1 range
        max_keyword = max(keyword_scores.values()) if keyword_scores else 1.0
        max_semantic = max(semantic_scores.values()) if semantic_scores else 1.0
        
        for chunk_id in all_chunk_ids:
            kw_score = keyword_scores.get(chunk_id, 0) / max_keyword
            sem_score = semantic_scores.get(chunk_id, 0) / max_semantic
            combined_scores[chunk_id] = (kw_score * keyword_weight) + (sem_score * semantic_weight)
        
        # Get chunks and sort by combined score
        result_chunks = []
        for chunk in self.indexer.chunks:
            if chunk.id in combined_scores:
                chunk.relevance_score = combined_scores[chunk.id] * 100  # Scale back to 0-100
                result_chunks.append(chunk)
        
        result_chunks.sort(key=lambda x: x.relevance_score, reverse=True)
        
        # Apply minimum threshold to prevent hallucination from irrelevant noise (e.g. 35%)
        result_chunks = [c for c in result_chunks if c.relevance_score >= 35.0]
        
        return result_chunks[:top_k]
    
    def _semantic_search(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[ChunkRecord]:
        """
        Perform semantic search using embeddings.
        
        Args:
            query: Search query
            top_k: Number of results
            filters: Optional metadata filters
            
        Returns:
            List of semantically similar chunks
        """
        if not self.model or self.embeddings is None:
            return []
        
        try:
            # Encode query
            query_embedding = self.model.encode([query])[0]
            
            # Calculate cosine similarity
            # Ensure embeddings are numpy array
            similarities = np.dot(self.embeddings, query_embedding) / (
                np.linalg.norm(self.embeddings, axis=1) * np.linalg.norm(query_embedding)
            )
            
            # Get top indices
            top_indices = np.argsort(similarities)[::-1]
            
            # Build results
            results = []
            for idx in top_indices:
                chunk = self.indexer.chunks[idx]
                
                # Apply filters
                if filters:
                    skip = False
                    for key, value in filters.items():
                        # Support list of values for 'IN' filtering (e.g. ['doc1.txt', 'doc2.txt'])
                        chunk_val = getattr(chunk, key) if hasattr(chunk, key) else None
                        if isinstance(value, list):
                            if chunk_val not in value:
                                skip = True
                                break
                        elif chunk_val != value:
                            skip = True
                            break
                    if skip:
                        continue
                
                # Set relevance score (similarity * 100)
                chunk.relevance_score = float(similarities[idx]) * 100
                results.append(chunk)
                
                if len(results) >= top_k:
                    break
            
            return results
            
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return []
