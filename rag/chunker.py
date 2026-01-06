"""
Legislative Document Chunker

Adapted from ML_Models text_chunker.py for legislative document processing.
Provides smart chunking at sentence/paragraph boundaries with metadata extraction.
"""

import re
import hashlib
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

try:
    import tiktoken
    TIKTOKEN_AVAILABLE = True
except ImportError:
    TIKTOKEN_AVAILABLE = False
    logging.warning("tiktoken not available - token counting disabled")

logger = logging.getLogger(__name__)


class LegislativeChunker:
    """
    Smart text chunker optimized for legislative documents.
    
    Features:
    - Sentence-boundary aware chunking
    - Configurable chunk size and overlap
    - Legislative metadata extraction
    - PDF and text file support
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        overlap: int = 200,
        tokenizer_model: str = "gpt-4"
    ):
        """
        Initialize the chunker.
        
        Args:
            chunk_size: Target chunk size in characters
            overlap: Overlap between chunks in characters
            tokenizer_model: Model name for tiktoken tokenizer
        """
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.tokenizer_model = tokenizer_model
        
        # Initialize tokenizer if available
        self.tokenizer = None
        if TIKTOKEN_AVAILABLE:
            try:
                self.tokenizer = tiktoken.encoding_for_model(tokenizer_model)
            except KeyError:
                logger.warning(f"Model {tokenizer_model} not found, using cl100k_base")
                self.tokenizer = tiktoken.get_encoding("cl100k_base")
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into chunks at sentence boundaries.
        
        Args:
            text: Input text to chunk
            
        Returns:
            List of text chunks
        """
        # Split by paragraphs first
        paragraphs = re.split(r'\n\n+', text)
        
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # If paragraph is larger than chunk_size, split at sentences
            if len(para) > self.chunk_size:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    
                    # If adding sentence exceeds chunk size, save current chunk
                    if current_chunk and len(current_chunk) + len(sentence) + 1 > self.chunk_size:
                        chunks.append(current_chunk.strip())
                        current_chunk = sentence
                    else:
                        current_chunk = current_chunk + " " + sentence if current_chunk else sentence
            else:
                # Paragraph fits, add it
                if current_chunk and len(current_chunk) + len(para) + 2 > self.chunk_size:
                    chunks.append(current_chunk.strip())
                    current_chunk = para
                else:
                    current_chunk = current_chunk + "\n\n" + para if current_chunk else para
        
        # Add remaining chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # Apply overlap if specified
        if self.overlap > 0 and len(chunks) > 1:
            overlapped_chunks = [chunks[0]]
            
            for i in range(1, len(chunks)):
                prev_chunk = chunks[i-1]
                current_chunk = chunks[i]
                
                # Take last 'overlap' characters from previous chunk
                if len(prev_chunk) >= self.overlap:
                    overlap_text = prev_chunk[-self.overlap:]
                    # Start at word boundary
                    overlap_text = re.sub(r'^\W+', '', overlap_text)
                    overlapped_chunk = overlap_text + " " + current_chunk
                else:
                    overlapped_chunk = current_chunk
                
                overlapped_chunks.append(overlapped_chunk)
            
            chunks = overlapped_chunks
        
        return chunks
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken."""
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        else:
            # Fallback: approximate as words * 1.3
            return int(len(text.split()) * 1.3)
    
    def extract_legislative_metadata(self, text: str, filename: str) -> Dict:
        """
        Extract legislative-specific metadata from text.
        
        Args:
            text: Document text
            filename: Source filename
            
        Returns:
            Dictionary of extracted metadata
        """
        metadata = {
            "filename": filename,
            "bill_number": "",
            "sender": "",
            "position": "",
            "organization": "",
            "date": "",
            "document_type": "legislative"
        }
        
        # Extract bill number patterns (e.g., AB 123, SB 456, HR 789)
        bill_patterns = [
            r'\b(AB|SB|HR|HB|S\.|H\.R\.)\s*(\d+)\b',
            r'\bBill\s+(\d+)\b',
        ]
        for pattern in bill_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                metadata["bill_number"] = match.group(0)
                break
        
        # Extract sender/organization
        org_patterns = [
            r'From:\s*(.+?)(?:\n|$)',
            r'Organization:\s*(.+?)(?:\n|$)',
            r'Sender:\s*(.+?)(?:\n|$)',
        ]
        for pattern in org_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                metadata["sender"] = match.group(1).strip()
                break
        
        # Extract position (Support/Oppose/Neutral)
        if re.search(r'\b(support|favor|endorse)\b', text, re.IGNORECASE):
            metadata["position"] = "Support"
        elif re.search(r'\b(oppose|against|object)\b', text, re.IGNORECASE):
            metadata["position"] = "Oppose"
        else:
            metadata["position"] = "Neutral"
        
        # Extract date
        date_patterns = [
            r'(\d{4}-\d{2}-\d{2})',
            r'(\d{1,2}/\d{1,2}/\d{4})',
            r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}',
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                metadata["date"] = match.group(0)
                break
        
        return metadata
    
    def chunk_document(
        self,
        text: str,
        filename: str,
        extract_metadata: bool = True
    ) -> List[Dict]:
        """
        Chunk a document and create structured chunk objects.
        
        Args:
            text: Document text
            filename: Source filename
            extract_metadata: Whether to extract legislative metadata
            
        Returns:
            List of chunk dictionaries with metadata
        """
        # Extract document-level metadata
        doc_metadata = {}
        if extract_metadata:
            doc_metadata = self.extract_legislative_metadata(text, filename)
        
        # Create chunks
        text_chunks = self.chunk_text(text)
        
        # Build chunk objects
        chunks = []
        content_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:16]
        
        for i, chunk_text in enumerate(text_chunks):
            chunk_hash = hashlib.md5(chunk_text.encode('utf-8')).hexdigest()[:16]
            token_count = self.count_tokens(chunk_text)
            
            chunk = {
                "id": str(uuid.uuid4()),
                "chunk_index": i,
                "total_chunks": len(text_chunks),
                "chunk_hash": chunk_hash,
                "content_hash": content_hash,
                "text": chunk_text,
                "char_count": len(chunk_text),
                "word_count": len(chunk_text.split()),
                "token_count": token_count,
                "source_file": filename,
                "processing_date": datetime.now().isoformat(),
                **doc_metadata  # Include document metadata in each chunk
            }
            
            chunks.append(chunk)
        
        return chunks
    
    def chunk_file(self, file_path: Path) -> List[Dict]:
        """
        Chunk a file from disk.
        
        Args:
            file_path: Path to file
            
        Returns:
            List of chunk dictionaries
        """
        # Read file
        try:
            if file_path.suffix.lower() == '.pdf':
                # PDF support requires pdfplumber
                try:
                    import pdfplumber
                    text = ""
                    with pdfplumber.open(file_path) as pdf:
                        for page in pdf.pages:
                            extracted = page.extract_text()
                            if extracted:
                                text += extracted + "\n"
                except ImportError:
                    raise ImportError("pdfplumber required for PDF support. Install with: pip install pdfplumber")
            else:
                # Text file
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
            
            return self.chunk_document(text, file_path.name)
            
        except Exception as e:
            logger.error(f"Error chunking file {file_path}: {e}")
            raise


def chunk_legislative_document(
    text: str,
    filename: str,
    chunk_size: int = 1000,
    overlap: int = 200
) -> List[Dict]:
    """
    Convenience function to chunk a legislative document.
    
    Args:
        text: Document text
        filename: Source filename
        chunk_size: Target chunk size in characters
        overlap: Overlap between chunks
        
    Returns:
        List of chunk dictionaries
    """
    chunker = LegislativeChunker(chunk_size=chunk_size, overlap=overlap)
    return chunker.chunk_document(text, filename)
