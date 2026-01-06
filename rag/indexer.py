"""
Document Indexer for Legislative Analysis

Provides fast chunk-level indexing and retrieval with keyword search.
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class ChunkRecord:
    """Represents a document chunk with metadata."""
    id: str
    text: str
    source_file: str
    chunk_index: int
    total_chunks: int
    chunk_hash: str
    content_hash: str
    char_count: int
    word_count: int
    token_count: int
    processing_date: str
    # Legislative metadata
    filename: str = ""
    bill_number: str = ""
    sender: str = ""
    position: str = ""
    organization: str = ""
    date: str = ""
    document_type: str = "legislative"
    # Search metadata
    relevance_score: float = 0.0


class DocumentIndexer:
    """
    Document indexer for fast chunk-level search and retrieval.
    
    Stores chunks in JSONL format for persistence and provides
    keyword-based search with relevance scoring.
    """
    
    def __init__(self, index_path: Optional[Path] = None):
        """
        Initialize the indexer.
        
        Args:
            index_path: Path to JSONL index file (default: legislative_chunks/index.jsonl)
        """
        if index_path is None:
            # Use absolute path relative to this file's location
            from pathlib import Path
            base_dir = Path(__file__).parent.parent
            index_path = base_dir / "legislative_chunks" / "index.jsonl"
        
        self.index_path = Path(index_path)
        self.chunks: List[ChunkRecord] = []
        
        # Create directory if it doesn't exist
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing index
        if self.index_path.exists():
            self.load()
    
    def add_chunks(self, chunks: List[Dict]) -> int:
        """
        Add chunks to the index.
        
        Args:
            chunks: List of chunk dictionaries
            
        Returns:
            Number of chunks added
        """
        added = 0
        for chunk_dict in chunks:
            try:
                chunk = ChunkRecord(**chunk_dict)
                self.chunks.append(chunk)
                added += 1
            except Exception as e:
                logger.warning(f"Skipping invalid chunk: {e}")
        
        return added
    
    def remove_by_file(self, filename: str) -> int:
        """
        Remove all chunks from a specific file.
        
        Args:
            filename: Source filename
            
        Returns:
            Number of chunks removed
        """
        original_count = len(self.chunks)
        self.chunks = [c for c in self.chunks if c.source_file != filename]
        removed = original_count - len(self.chunks)
        
        if removed > 0:
            logger.info(f"Removed {removed} chunks from {filename}")
        
        return removed
    
    def search(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[ChunkRecord]:
        """
        Search for chunks matching the query.
        
        Args:
            query: Search query
            top_k: Number of top results to return
            filters: Optional filters (e.g., {"bill_number": "AB 123"})
            
        Returns:
            List of matching chunks sorted by relevance
        """
        query_lower = query.lower()
        query_terms = set(query_lower.split())
        
        # Score each chunk
        scored_chunks = []
        for chunk in self.chunks:
            # Apply filters first
            if filters:
                skip = False
                for key, value in filters.items():
                    # Support list of values for 'IN' filtering
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
            
            # Calculate relevance score
            text_lower = chunk.text.lower()
            
            # Exact phrase match (highest score)
            if query_lower in text_lower:
                score = 100.0
            else:
                # Term frequency scoring
                score = 0.0
                for term in query_terms:
                    if term in text_lower:
                        # Count occurrences
                        count = text_lower.count(term)
                        score += count * 10
                
                # Boost if query terms appear in metadata
                metadata_text = f"{chunk.bill_number} {chunk.sender} {chunk.organization}".lower()
                for term in query_terms:
                    if term in metadata_text:
                        score += 20
            
            if score > 0:
                chunk.relevance_score = score
                scored_chunks.append(chunk)
        
        # Sort by relevance and return top_k
        scored_chunks.sort(key=lambda x: x.relevance_score, reverse=True)
        return scored_chunks[:top_k]
    
    def get_by_file(self, filename: str) -> List[ChunkRecord]:
        """
        Get all chunks from a specific file.
        
        Args:
            filename: Source filename
            
        Returns:
            List of chunks from that file
        """
        return [c for c in self.chunks if c.source_file == filename]
    
    def get_by_bill(self, bill_number: str) -> List[ChunkRecord]:
        """
        Get all chunks related to a specific bill.
        
        Args:
            bill_number: Bill number (e.g., "AB 123")
            
        Returns:
            List of chunks related to that bill
        """
        return [c for c in self.chunks if c.bill_number == bill_number]
    
    def save(self) -> None:
        """Save the index to disk in JSONL format."""
        try:
            with open(self.index_path, 'w', encoding='utf-8') as f:
                for chunk in self.chunks:
                    chunk_dict = asdict(chunk)
                    f.write(json.dumps(chunk_dict, ensure_ascii=False) + '\n')
            
            logger.info(f"Saved {len(self.chunks)} chunks to {self.index_path}")
        except Exception as e:
            logger.error(f"Error saving index: {e}")
            raise
    
    def load(self) -> None:
        """Load the index from disk."""
        try:
            self.chunks = []
            with open(self.index_path, 'r', encoding='utf-8') as f:
                for line in f:
                    chunk_dict = json.loads(line)
                    chunk = ChunkRecord(**chunk_dict)
                    self.chunks.append(chunk)
            
            logger.info(f"Loaded {len(self.chunks)} chunks from {self.index_path}")
        except Exception as e:
            logger.error(f"Error loading index: {e}")
            raise
    
    def rebuild(self, chunks: List[Dict]) -> None:
        """
        Rebuild the entire index from scratch.
        
        Args:
            chunks: List of all chunk dictionaries
        """
        self.chunks = []
        self.add_chunks(chunks)
        self.save()
        logger.info(f"Rebuilt index with {len(self.chunks)} chunks")
    
    def stats(self) -> Dict:
        """
        Get index statistics.
        
        Returns:
            Dictionary of statistics
        """
        unique_files = set(c.source_file for c in self.chunks)
        unique_bills = set(c.bill_number for c in self.chunks if c.bill_number)
        
        positions = {}
        for chunk in self.chunks:
            pos = chunk.position or "Unknown"
            positions[pos] = positions.get(pos, 0) + 1
        
        return {
            "total_chunks": len(self.chunks),
            "total_words": sum(c.word_count for c in self.chunks),
            "unique_files": len(unique_files),
            "unique_bills": len(unique_bills),
            "positions": positions,
            "index_path": str(self.index_path),
            "index_size_mb": self.index_path.stat().st_size / (1024 * 1024) if self.index_path.exists() else 0
        }
