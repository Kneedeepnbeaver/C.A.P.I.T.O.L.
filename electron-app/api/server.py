import sys
import os
import subprocess
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

# Add project root to path to import legislative_backend
# Current file: .../Legislative_Analysis/electron-app/api/server.py
# Root: .../Legislative_Analysis
root_dir = Path(__file__).parent.parent.parent.resolve()
sys.path.append(str(root_dir))

import legislative_backend as backend

app = Flask(__name__)
# Enable CORS for all domains on all routes
CORS(app, resources={r"/*": {"origins": "*"}})

@app.before_request
def log_request():
    print(f"Request: {request.method} {request.path}", file=sys.stderr)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/library', methods=['GET'])
def list_library():
    """Returns the content of legislative_metadata.csv/json"""
    # METADATA_JSON is not in backend module, define it relative to backend.METADATA_CSV or root
    json_path = root_dir / "Legislative_Analysis" / "legislative_metadata.json"
    
    if json_path.exists():
        import json
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify([])

@app.route('/library/search', methods=['POST'])
def search_library():
    """Searches full text and returns matching metadata entries."""
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return list_library() # Return all if empty
        
    # 1. Get matching filenames from backend
    matching_filenames = backend.search_documents(query)
    
    # 2. Get full metadata
    json_path = root_dir / "Legislative_Analysis" / "legislative_metadata.json"
    full_library = []
    if json_path.exists():
        import json
        with open(json_path, 'r', encoding='utf-8') as f:
            full_library = json.load(f)
            
    # 3. Filter metadata
    filtered_docs = [doc for doc in full_library if doc.get('Filename') in matching_filenames]
    
    return jsonify(filtered_docs)

@app.route('/library/update', methods=['POST'])
def update_library_metadata():
    """Updates metadata for a specific file."""
    data = request.json # { Filename: "...", "Document Title": "...", ... }
    target_filename = data.get('Filename')
    
    if not target_filename:
        return jsonify({"error": "Filename is required"}), 400
        
    json_path = root_dir / "Legislative_Analysis" / "legislative_metadata.json"
    
    if not json_path.exists():
         return jsonify({"error": "Metadata store not found"}), 500
         
    try:
        import json
        with open(json_path, 'r', encoding='utf-8') as f:
            library = json.load(f)
            
        # Find and update
        updated = False
        for doc in library:
            if doc['Filename'] == target_filename:
                # Update fields provided in request, ignore unknown ones or preserve existing
                for key, value in data.items():
                    if key != 'Filename': # Don't allow renaming via this endpoint for now
                        doc[key] = value
                updated = True
                break
        
        if updated:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(library, f, indent=2)
            return jsonify({"status": "success", "message": "Metadata updated"})
        else:
            return jsonify({"error": "Document not found"}), 404
            
    except Exception as e:
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
    
    # Auto-save as .txt to Legislative_Analysis/generated_content
    import datetime
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_type = artifact_type.replace(" ", "_").replace("/", "_")
    auto_save_path = backend.export_to_file(
        result_md, 
        "txt", 
        filename_prefix=f"{safe_type}_{timestamp}"
    )
    
    return jsonify({
        "markdown": result_md,
        "auto_saved_path": str(auto_save_path) if auto_save_path else None
    })

@app.route('/generate/preview', methods=['POST'])
def preview_prompt():
    """Returns the prompt that would be sent to Ollama without actually running it."""
    data = request.json
    selected_docs = data.get('selected_docs', [])
    artifact_type = data.get('artifact_type', 'Executive Summary')
    tone = data.get('tone', 'Professional')
    instructions = data.get('instructions', '')
    
    # Build context the same way as generate
    num_docs = len(selected_docs)
    if num_docs == 1:
        max_chars_per_doc = 3000
    elif num_docs <= 3:
        max_chars_per_doc = 1500
    else:
        max_chars_per_doc = 800
    
    context = ""
    for i, doc in enumerate(selected_docs):
        context += f"DOCUMENT {i+1}: {doc['Document Title']}\n"
        summary = doc.get('Summary', '')
        if summary:
            context += f"Summary: {summary}\n"
        context += "\n"
    
    return jsonify({
        "num_docs": num_docs,
        "max_chars_per_doc": max_chars_per_doc,
        "context_size": len(context),
        "context_preview": context[:500] + "..." if len(context) > 500 else context
    })

@app.route('/save', methods=['POST'])
def save_artifact():
    data = request.json
    content = data.get('content')
    fmt = data.get('format', 'Markdown')
    style = data.get('style', 'Professional')
    
    path = backend.export_to_file(content, fmt, style, "legislative_analysis")
    return jsonify({"path": str(path)})

@app.route('/save-as', methods=['POST'])
def save_artifact_as():
    """Save to a custom path specified by the user."""
    data = request.json
    content = data.get('content')
    target_path = data.get('path')
    
    if not target_path or not content:
        return jsonify({"error": "Missing content or path"}), 400
    
    try:
        from pathlib import Path
        path = Path(target_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return jsonify({"path": str(path)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sync', methods=['POST'])
def sync_metadata_route():
    # Run the extraction script
    script_path = root_dir / "Legislative_Analysis" / "extract_legislative_metadata.py"
    try:
        # We run it in the root dir context
        subprocess.run([sys.executable, str(script_path)], cwd=str(root_dir), check=True)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/import/folder', methods=['POST'])
def import_folder():
    data = request.json
    source_path = data.get('path')
    if not source_path:
        return jsonify({"error": "No path provided"}), 400
    
    # Simple copy logic reused from desktop_app idea
    import shutil
    src = Path(source_path)
    if not src.exists():
         return jsonify({"error": "Path not found"}), 404
         
    count = 0
    allowed = ['.txt', '.pdf', '.md', '.docx']
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
    folder = request.json.get('folder', 'library') # library or results
    if folder == 'library': path = backend.TEXT_DIR
    elif folder == 'generated_content': path = backend.OUTPUT_DIR
    else: path = backend.OUTPUT_DIR
    path = path.resolve()
    
    if sys.platform == "darwin":
        subprocess.run(["open", str(path)])
    elif sys.platform == "win32":
        os.startfile(path)
    
    return jsonify({"status": "opened"})

if __name__ == "__main__":
    # Run on port 5001 to avoid MacOS AirPlay conflict on 5000
    app.run(host="127.0.0.1", port=5001)
