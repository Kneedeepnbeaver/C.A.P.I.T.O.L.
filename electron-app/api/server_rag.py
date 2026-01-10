"""
Enhanced Legislative Analysis API Server with RAG Support

Extends the original server.py with RAG capabilities for improved document
processing and retrieval.
"""

import sys
# Force unbuffered output for debugging
sys.stdout.reconfigure(line_buffering=True)
print("DEBUG: Starting server_rag.py...", file=sys.stdout, flush=True)

import os
import subprocess
from pathlib import Path

# Handle PyInstaller packaged mode - add rag package to path if needed
if getattr(sys, 'frozen', False):
    # Running in a PyInstaller bundle
    if hasattr(sys, '_MEIPASS'):
        # Add rag and backend_core packages to path from temp directory
        base_path = Path(sys._MEIPASS)
        rag_path = base_path / 'rag'
        backend_core_path = base_path / 'backend_core'
        
        # Add to sys.path if they exist
        if rag_path.exists():
            sys.path.insert(0, str(rag_path.parent))
            print(f"DEBUG: Added rag package path: {rag_path.parent}", file=sys.stdout, flush=True)
        if backend_core_path.exists():
            sys.path.insert(0, str(backend_core_path.parent))
            print(f"DEBUG: Added backend_core package path: {backend_core_path.parent}", file=sys.stdout, flush=True)
else:
    # In development mode, ensure PROJECT_ROOT is on path
    # Calculate project root from this file's location
    _this_file = Path(__file__).resolve()
    _project_root = _this_file.parent.parent.parent  # Go up from electron-app/api/server_rag.py
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))
        print(f"DEBUG: Added project root to path: {_project_root}", file=sys.stdout, flush=True)

print("DEBUG: Importing Flask...", file=sys.stdout, flush=True)
from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import threading
import time

# Current: .../Legislative_Analysis/electron-app/api/server_rag.py
# --- CONFIGURATION & PATHS ---
try:
    from backend_core import config
    from backend_core import extractor
    print("DEBUG: Imported backend_core successfully", file=sys.stdout, flush=True)
    BACKEND_IMPORT_ERROR = None
except Exception as e:
    print(f"DEBUG: Failed to import backend_core: {e}", file=sys.stdout, flush=True)
    config = None
    BACKEND_IMPORT_ERROR = str(e)

# Compatibility aliases
backend = config  # For code still referencing 'backend' variable

# Determine root directory - handle both dev and packaged modes
if config and hasattr(config, 'BASE_DIR'):
    # Use BASE_DIR from config which handles packaged apps correctly
    root_dir = config.BASE_DIR
    print(f"DEBUG: Using config.BASE_DIR: {root_dir}", file=sys.stdout, flush=True)
else:
    # Fallback: calculate from current file location
    # In packaged mode, __file__ points to temp directory
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        root_dir = Path(sys._MEIPASS)
        print(f"DEBUG: Using PyInstaller temp dir as root_dir: {root_dir}", file=sys.stdout, flush=True)
    else:
        # Current file: .../Legislative_Analysis/electron-app/api/server_rag.py
        # Root: .../Legislative_Analysis
        root_dir = Path(__file__).parent.parent.parent.resolve()
        print(f"DEBUG: Calculated root_dir from __file__: {root_dir}", file=sys.stdout, flush=True)

# Metadata JSON path - use BASE_DIR when available (handles packaged apps)
if config and hasattr(config, 'BASE_DIR'):
    METADATA_JSON = config.BASE_DIR / "legislative_metadata.json"
else:
    METADATA_JSON = root_dir / "legislative_metadata.json"

print(f"DEBUG: METADATA_JSON path: {METADATA_JSON}", file=sys.stdout, flush=True)
print(f"DEBUG: METADATA_JSON exists: {METADATA_JSON.exists()}", file=sys.stdout, flush=True)

if config:
    TEXT_DIR = config.TEXT_DIR
    OUTPUT_DIR = config.OUTPUT_DIR
else:
    TEXT_DIR = Path("legislative_documents") # Fallback
    OUTPUT_DIR = Path("generated_content") # Fallback

# Import RAG components
print("DEBUG: Importing RAG components...", file=sys.stdout, flush=True)
print(f"DEBUG: sys.path: {sys.path[:3]}...", file=sys.stdout, flush=True)  # Show first 3 paths

# Try importing RAG with better error handling
RAG_AVAILABLE = False
try:
    import rag
    print(f"DEBUG: rag module found at: {rag.__file__ if hasattr(rag, '__file__') else 'unknown'}", file=sys.stdout, flush=True)
    from rag import (
        LegislativeChunker,
        DocumentIndexer,
        HybridRetriever,
        LegislativeRAGAgent
    )
    RAG_AVAILABLE = True
    print("DEBUG: RAG components imported successfully", file=sys.stdout, flush=True)
except ImportError as e:
    import traceback
    error_details = traceback.format_exc()
    logging.warning(f"RAG components not available: {e}")
    print(f"DEBUG: RAG ImportError: {e}", file=sys.stdout, flush=True)
    print(f"DEBUG: Traceback: {error_details}", file=sys.stdout, flush=True)
    RAG_AVAILABLE = False
except Exception as e:
    import traceback
    error_details = traceback.format_exc()
    print(f"DEBUG: RAG General error: {e}", file=sys.stdout, flush=True)
    print(f"DEBUG: Traceback: {error_details}", file=sys.stdout, flush=True)
    RAG_AVAILABLE = False

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize RAG components
indexer = None
retriever = None
rag_agent = None

if RAG_AVAILABLE:
    try:
        indexer = DocumentIndexer()
        retriever = HybridRetriever(indexer)
        rag_agent = LegislativeRAGAgent(indexer, retriever)
        
        # Start initialization in a background thread to avoid blocking startup
        def background_init():
            # Small delay to let the server start listening first
            time.sleep(2)
            logging.info("Starting background RAG initialization...")
            try:
                retriever.initialize()
                logging.info("Background RAG initialization complete")
            except Exception as e:
                logging.error(f"Background initialization error: {e}")
                
        init_thread = threading.Thread(target=background_init, daemon=True)
        init_thread.start()
        logging.info("RAG components created; background init thread started")
    except Exception as e:
        logging.error(f"Failed to initialize RAG system: {e}")
        RAG_AVAILABLE = False

@app.before_request
def log_request():
    print(f"Request: {request.method} {request.path}", file=sys.stderr)

# ===== ORIGINAL ENDPOINTS =====

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "rag_available": RAG_AVAILABLE,
        "semantic_status": "ready" if (retriever and retriever.is_ready) else "loading",
        "index_stats": indexer.stats() if indexer else None
    })

@app.route('/library', methods=['GET'])
def list_library():
    """Returns the content of legislative_metadata.json"""
    if not METADATA_JSON.exists():
        print(f"DEBUG: METADATA_JSON not found at {METADATA_JSON}", file=sys.stdout, flush=True)
        return jsonify([])
    
    try:
        import json
        with open(METADATA_JSON, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"DEBUG: Loaded {len(data)} documents from metadata", file=sys.stdout, flush=True)
        return jsonify(data)
    except Exception as e:
        print(f"DEBUG: Error reading METADATA_JSON: {e}", file=sys.stdout, flush=True)
        logging.error(f"Error reading metadata: {e}")
        return jsonify([])

@app.route('/library/search', methods=['POST'])
def search_library():
    """Searches full text and returns matching metadata entries."""
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return list_library()
    
    # Use RAG search if available
    if RAG_AVAILABLE and indexer:
        try:
            chunks = rag_agent.search_documents(query, top_k=20)
            # Get unique files from chunks
            unique_files = set(chunk['file'] for chunk in chunks)
            
            # Get full metadata for these files
            full_library = []
            if METADATA_JSON.exists():
                import json
                with open(METADATA_JSON, 'r', encoding='utf-8') as f:
                    full_library = json.load(f)
            
            filtered_docs = [doc for doc in full_library if doc.get('Filename') in unique_files]
            return jsonify(filtered_docs)
        except Exception as e:
            logging.error(f"RAG search error: {e}")
            # Fall through to original search
    
    # Original search method
    matching_filenames = backend.search_documents(query) if backend else []
    full_library = []
    if METADATA_JSON.exists():
        import json
        with open(METADATA_JSON, 'r', encoding='utf-8') as f:
            full_library = json.load(f)
    
    filtered_docs = [doc for doc in full_library if doc.get('Filename') in matching_filenames]
    return jsonify(filtered_docs)

@app.route('/library/update', methods=['POST'])
def update_library_metadata():
    """Updates metadata for a specific file."""
    data = request.json
    target_filename = data.get('Filename')
    
    if not target_filename:
        return jsonify({"error": "Filename is required"}), 400
    
    if not METADATA_JSON.exists():
        return jsonify({"error": f"Metadata store not found at {METADATA_JSON}"}), 500
    
    try:
        import json
        with open(METADATA_JSON, 'r', encoding='utf-8') as f:
            library = json.load(f)
        
        updated = False
        for doc in library:
            if doc['Filename'] == target_filename:
                for key, value in data.items():
                    if key != 'Filename':
                        doc[key] = value
                updated = True
                break
        
        if updated:
            with open(METADATA_JSON, 'w', encoding='utf-8') as f:
                json.dump(library, f, indent=2)
            print(f"DEBUG: Updated metadata for {target_filename}", file=sys.stdout, flush=True)
            return jsonify({"status": "success", "message": "Metadata updated"})
        else:
            return jsonify({"error": "Document not found"}), 404
    except Exception as e:
        logging.error(f"Error updating metadata: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    models = backend.list_ollama_models()
    return jsonify(models)

@app.route('/presets', methods=['GET'])
def list_presets():
    presets = backend.load_voice_presets()
    return jsonify(presets)

@app.route('/generate', methods=['POST'])
def generate_artifact():
    data = request.json
    selected_docs = data.get('selected_docs', [])
    artifact_type = data.get('artifact_type', 'Executive Summary')
    tone = data.get('tone', 'Professional')
    instructions = data.get('instructions', '')
    model = data.get('model')
    
    if not selected_docs:
        return jsonify({"error": "No documents selected"}), 400
    
    result_md = backend.generate_legislative_artifact(
        selected_docs, artifact_type, tone, instructions, model=model
    )
    
    # Auto-save (Markdown by default for rich formatting)
    safe_type = artifact_type.replace(" ", "_").replace("/", "_")
    auto_save_path = backend.export_to_file(
        result_md,
        "md",
        filename_prefix=f"{safe_type}"
    )
    
    return jsonify({
        "markdown": result_md,
        "auto_saved_path": str(auto_save_path) if auto_save_path else None
    })

@app.route('/save', methods=['POST'])
def save_artifact():
    data = request.json
    content = data.get('content')
    fmt = data.get('format', 'Markdown')
    style = data.get('style', 'Professional')
    
    path = backend.export_to_file(content, fmt, style, "legislative_analysis")
    return jsonify({"path": str(path)})

@app.route('/sync', methods=['POST'])
def sync_metadata_route():
    try:
        # Run the extraction directly
        extractor.run_extraction()
        
        return jsonify({"status": "success"})
    except Exception as e:
        logging.error(f"Sync error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/import/folder', methods=['POST'])
def import_folder():
    if backend is None:
        return jsonify({"error": f"Backend not initialized: {BACKEND_IMPORT_ERROR}"}), 503
        
    try:
        data = request.json
        source_path = data.get('path')
        if not source_path:
            return jsonify({"error": "No path provided"}), 400
        
        import shutil
        src = Path(source_path)
        if not src.exists():
            return jsonify({"error": "Path not found"}), 404
        
        count = 0
        allowed = ['.txt', '.pdf', '.md', '.docx', '.vtt']
        if src.is_file():
            if src.suffix.lower() in allowed:
                shutil.copy(src, backend.TEXT_DIR / src.name)
                count = 1
        elif src.is_dir():
            for item in src.glob("*"):
                if item.suffix.lower() in allowed:
                    shutil.copy(item, backend.TEXT_DIR / item.name)
                    count += 1
        
        return jsonify({"count": count})
    except Exception as e:
        logging.error(f"Import folder error: {e}")
        return jsonify({"error": f"Import failed: {str(e)}"}), 500

@app.route('/import/paste', methods=['POST'])
def import_paste():
    data = request.json
    title = data.get('title', 'Untitled')
    content = data.get('content', '')
    
    if not content:
        return jsonify({"error": "No content"}), 400
    
    import datetime
    safe_title = "".join([c for c in title if c.isalpha() or c.isdigit() or c==' ']).rstrip().replace(' ', '_')
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_title}_{timestamp}.txt"
    
    with open(backend.TEXT_DIR / filename, "w", encoding="utf-8") as f:
        f.write(content)
    
    return jsonify({"filename": filename})

@app.route('/open-folder', methods=['POST'])
def open_folder():
    folder = request.json.get('folder', 'library')
    if folder == 'library':
        path = backend.TEXT_DIR
    elif folder == 'generated_content':
        path = backend.OUTPUT_DIR
    else:
        path = backend.OUTPUT_DIR
    path = path.resolve()
    
    if sys.platform == "darwin":
        subprocess.run(["open", str(path)])
    elif sys.platform == "win32":
        os.startfile(path)
    
    return jsonify({"status": "opened"})

# ===== NEW RAG ENDPOINTS =====

@app.route('/rag/chunk', methods=['POST'])
def chunk_document():
    """Chunk a document and add to index."""
    if not RAG_AVAILABLE:
        return jsonify({"error": "RAG system not available"}), 503
    
    data = request.json
    filename = data.get('filename')
    text = data.get('text')
    chunk_size = data.get('chunk_size', 1000)
    overlap = data.get('overlap', 200)
    
    if not filename or not text:
        return jsonify({"error": "filename and text required"}), 400
    
    try:
        chunker = LegislativeChunker(chunk_size=chunk_size, overlap=overlap)
        chunks = chunker.chunk_document(text, filename)
        
        # Add to index
        added = indexer.add_chunks(chunks)
        indexer.save()
        
        # Rebuild embeddings if using semantic search
        if retriever.use_semantic:
            retriever.rebuild_embeddings()
        
        return jsonify({
            "status": "success",
            "chunks_created": len(chunks),
            "chunks_added": added
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rag/reindex', methods=['POST'])
def reindex_all():
    """Rebuild the entire index from all documents."""
    if not RAG_AVAILABLE:
        return jsonify({"error": "RAG system not available"}), 503
    
    try:
        all_chunks = []
        chunker = LegislativeChunker()
        
        # Chunk all documents in TEXT_DIR
        allowed_extensions = {'.txt', '.pdf', '.md', '.docx', '.vtt'}
        processed_files = 0
        for file_path in backend.TEXT_DIR.iterdir():
            if file_path.suffix.lower() in allowed_extensions:
                try:
                    chunks = chunker.chunk_file(file_path)
                    all_chunks.extend(chunks)
                    processed_files += 1
                except Exception as e:
                    logging.error(f"Error chunking {file_path}: {e}")
        
        # Rebuild index
        indexer.rebuild(all_chunks)
        
        # Rebuild embeddings
        if retriever.use_semantic:
            retriever.rebuild_embeddings()
        
        return jsonify({
            "status": "success",
            "total_chunks": len(all_chunks),
            "files_processed": processed_files
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rag/index-file', methods=['POST'])
def index_single_file():
    """Index a single file that was just imported."""
    if not RAG_AVAILABLE:
        return jsonify({"error": "RAG system not available"}), 503
    
    data = request.json
    filename = data.get('filename')
    
    if not filename:
        return jsonify({"error": "filename required"}), 400
    
    try:
        file_path = backend.TEXT_DIR / filename
        
        if not file_path.exists():
            return jsonify({"error": f"File not found: {filename}"}), 404
        
        # Chunk the file
        chunker = LegislativeChunker()
        chunks = chunker.chunk_file(file_path)
        
        # Add to index
        added = indexer.add_chunks(chunks)
        indexer.save()
        
        # Rebuild embeddings if using semantic search
        if retriever and retriever.use_semantic:
            retriever.rebuild_embeddings()
        
        return jsonify({
            "status": "success",
            "chunks_added": added,
            "filename": filename,
            "total_chunks": len(chunks)
        })
    except Exception as e:
        logging.error(f"Error indexing file {filename}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/rag/search', methods=['POST'])
def rag_search():
    """Search using RAG retrieval."""
    if not RAG_AVAILABLE:
        return jsonify({"error": "RAG system not available"}), 503
    
    data = request.json
    query = data.get('query', '')
    top_k = data.get('top_k', 10)
    filters = data.get('filters')
    
    if not query:
        return jsonify({"error": "query required"}), 400
    
    try:
        results = rag_agent.search_documents(query, top_k=top_k, filters=filters)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rag/generate', methods=['POST'])
def rag_generate():
    """Generate artifact using RAG."""
    if not RAG_AVAILABLE:
        return jsonify({"error": "RAG system not available"}), 503
    
    data = request.json
    query = data.get('query', '')
    artifact_type = data.get('artifact_type', 'Executive Summary')
    tone = data.get('tone', 'Professional')
    instructions = data.get('instructions', '')
    top_k = data.get('top_k', 5)
    
    # Map selected_docs to source_file filters if provided
    filters = data.get('filters', {})
    selected_docs = data.get('selected_docs', [])
    if selected_docs and 'source_file' not in filters:
        filters['source_file'] = [doc['Filename'] for doc in selected_docs]
        
    system_persona = data.get('system_persona')
    
    if not query:
        return jsonify({"error": "query required"}), 400
    
    try:
        result = rag_agent.generate_with_rag(
            query=query,
            artifact_type=artifact_type,
            tone=tone,
            additional_instructions=instructions,
            top_k=top_k,
            filters=filters,
            system_persona=system_persona
        )
        
        # Auto-save (Markdown by default)
        safe_type = artifact_type.replace(" ", "_").replace("/", "_")
        auto_save_path = backend.export_to_file(
            result['content'],
            "md",
            filename_prefix=f"RAG_{safe_type}"
        )
        
        result['auto_saved_path'] = str(auto_save_path) if auto_save_path else None
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rag/chat', methods=['POST'])
def rag_chat():
    """Chat with RAG agent."""
    if not RAG_AVAILABLE:
        return jsonify({"error": "RAG system not available"}), 503
    
    data = request.json
    message = data.get('message', '')
    history = data.get('history', [])
    system_persona = data.get('system_persona')
    top_k = data.get('top_k', 5)
    filters = data.get('filters')
    
    if not message:
        return jsonify({"error": "message required"}), 400
    
    try:
        result = rag_agent.chat_with_rag(
            message=message,
            history=history,
            system_persona=system_persona,
            top_k=top_k,
            filters=filters
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rag/stats', methods=['GET'])
def rag_stats():
    """Get RAG system statistics."""
    if not RAG_AVAILABLE:
        return jsonify({"error": "RAG system not available"}), 503
    
    try:
        stats = indexer.stats()
        stats['semantic_search_enabled'] = retriever.use_semantic if retriever else False
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rag/preview', methods=['POST'])
def rag_preview():
    """Preview chunks that will be used for RAG generation without actually generating."""
    if not RAG_AVAILABLE:
        return jsonify({"error": "RAG system not available"}), 503
    
    data = request.json
    query = data.get('query', '')
    top_k = data.get('top_k', 10)
    min_relevance = data.get('min_relevance', 35)
    
    # Map selected_docs to source_file filters if provided
    filters = data.get('filters', {})
    selected_docs = data.get('selected_docs', [])
    if selected_docs and 'source_file' not in filters:
        filters['source_file'] = [doc['Filename'] if isinstance(doc, dict) else doc for doc in selected_docs]
    
    if not query:
        return jsonify({"error": "query required"}), 400
    
    try:
        # Use the retriever to get chunks
        chunks = retriever.retrieve(
            query=query,
            top_k=top_k,
            filters=filters
        )
        
        # Filter by minimum relevance
        filtered_chunks = [c for c in chunks if c.get('relevance', 0) >= min_relevance]
        
        # Calculate statistics
        total_words = sum(c.get('word_count', 0) for c in filtered_chunks)
        total_chars = sum(len(c.get('text', '')) for c in filtered_chunks)
        
        # Format for frontend
        preview_chunks = []
        for chunk in filtered_chunks:
            preview_chunks.append({
                'id': chunk.get('id'),
                'text': chunk.get('text', '')[:500] + ('...' if len(chunk.get('text', '')) > 500 else ''),  # Truncate for preview
                'full_text': chunk.get('text', ''),
                'file': chunk.get('source_file', chunk.get('file', 'Unknown')),
                'relevance': chunk.get('relevance', 0),
                'chunk_index': chunk.get('chunk_index', 0),
                'total_chunks': chunk.get('total_chunks', 1),
                'bill': chunk.get('bill_number', ''),
                'sender': chunk.get('sender', ''),
                'position': chunk.get('position', '')
            })
        
        return jsonify({
            'chunks': preview_chunks,
            'total_chunks': len(preview_chunks),
            'total_words': total_words,
            'total_chars': total_chars,
            'estimated_tokens': total_words * 1.3  # Rough estimate
        })
    except Exception as e:
        logging.error(f"Preview error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/import/normalize-transcript', methods=['POST'])
def normalize_transcript_endpoint():
    """Normalize a transcript file (VTT/ALL CAPS to sentence case)."""
    data = request.json
    filename = data.get('filename')
    
    if not filename:
        return jsonify({"error": "filename required"}), 400
    
    try:
        file_path = backend.TEXT_DIR / filename
        
        if not file_path.exists():
            return jsonify({"error": f"File not found: {filename}"}), 404
        
        # Read original content
        with open(file_path, 'r', encoding='utf-8') as f:
            original_text = f.read()
        
        # Import normalizer
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent.parent))
        from backend_core.normalizer import normalize_transcript
        
        # Normalize
        normalized_text = normalize_transcript(original_text)
        
        # Save normalized version
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(normalized_text)
        
        return jsonify({
            "status": "success",
            "filename": filename,
            "original_length": len(original_text),
            "normalized_length": len(normalized_text),
            "changes_made": len(original_text) != len(normalized_text)
        })
    except Exception as e:
        logging.error(f"Error normalizing transcript {filename}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/reset', methods=['POST'])
def reset_application():
    """Clear generated content and reindex documents for a fresh start."""
    try:
        # 1. Clear generated content
        if backend.OUTPUT_DIR.exists():
            import shutil
            for item in backend.OUTPUT_DIR.iterdir():
                if item.is_file(): item.unlink()
                elif item.is_dir(): shutil.rmtree(item)
        
        # 2. Rebuild index
        if RAG_AVAILABLE and indexer:
            # Reindex all files in library
            all_chunks = []
            chunker = LegislativeChunker()
            allowed_extensions = {'.txt', '.pdf', '.md', '.docx', '.vtt'}
            for file_path in backend.TEXT_DIR.iterdir():
                if file_path.suffix.lower() in allowed_extensions:
                    try:
                        chunks = chunker.chunk_file(file_path)
                        all_chunks.extend(chunks)
                    except Exception as e:
                        logging.error(f"Error during reset reindex: {e}")
            
            indexer.rebuild(all_chunks)
            if retriever and retriever.use_semantic:
                retriever.rebuild_embeddings()
                
        return jsonify({"status": "success", "message": "Vault and index reset complete."})
    except Exception as e:
        logging.error(f"Reset error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run on port 5001 to avoid MacOS AirPlay conflict
    # Turn off debug reloader for stability in this environment
    print("DEBUG: Starting Flask app run on port 5001...", file=sys.stdout, flush=True)
    app.run(host="127.0.0.1", port=5001, debug=False)
