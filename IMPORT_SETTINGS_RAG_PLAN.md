# Import & Settings RAG Optimization Plan

## 🎯 Objective
Ensure all imported documents are automatically chunked and indexed for RAG, and provide Settings controls for RAG system management.

---

## 📥 Import Module Enhancements

### **Current Flow:**
```
1. User selects files/folder
2. Files copied to Legislative_Analysis directory
3. Metadata extracted and synced
4. ✅ Done
```

### **Enhanced RAG Flow:**
```
1. User selects files/folder
2. Files copied to Legislative_Analysis directory
3. Metadata extracted and synced
4. 🆕 Files automatically chunked
5. 🆕 Chunks indexed in RAG system
6. 🆕 Show indexing progress in log
7. ✅ Done - Ready for RAG search!
```

---

## 🔧 Implementation Details

### **1. Auto-Indexing on Import**

#### **Add to Import Component:**
```typescript
const handleImportWithRAG = async (path: string) => {
    try {
        // Step 1: Import file
        const res = await fetch('http://localhost:5001/import/folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        });
        const data = await res.json();
        
        if (data.error) {
            addLog(`❌ Error [${path}]: ${data.error}`);
            return;
        }
        
        addLog(`✅ Imported: ${path.split('/').pop()}`);
        
        // Step 2: Auto-index for RAG
        addLog(`🔮 Indexing for RAG...`);
        const ragRes = await fetch('http://localhost:5001/rag/index-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: data.filename })
        });
        
        const ragData = await ragRes.json();
        if (ragData.chunks_added) {
            addLog(`✨ Indexed ${ragData.chunks_added} chunks`);
        }
        
    } catch (err) {
        addLog(`❌ Failed [${path}]: ${err}`);
    }
};
```

#### **Backend Endpoint Needed:**
```python
@app.route('/rag/index-file', methods=['POST'])
def index_single_file():
    """Index a single file for RAG"""
    data = request.json
    filename = data.get('filename')
    
    # Read file
    file_path = os.path.join(LIBRARY_DIR, filename)
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Chunk and index
    chunks = chunker.chunk_document(content, filename)
    for chunk in chunks:
        indexer.add_chunk(chunk)
    
    indexer.save()
    
    return jsonify({
        'status': 'success',
        'chunks_added': len(chunks),
        'filename': filename
    })
```

---

### **2. Bulk Re-Indexing**

#### **Add to Import Component:**
```typescript
const reindexAll = async () => {
    addLog(`🔄 Re-indexing all documents for RAG...`);
    try {
        const res = await fetch('http://localhost:5001/rag/reindex', {
            method: 'POST'
        });
        const data = await res.json();
        addLog(`✨ Re-indexed ${data.total_chunks} chunks from ${data.files_processed} files`);
    } catch (err) {
        addLog(`❌ Re-indexing failed: ${err}`);
    }
};
```

#### **UI Button:**
```tsx
<button 
    onClick={reindexAll}
    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2"
>
    <Sparkles size={16} />
    Re-index All for RAG
</button>
```

---

### **3. Import Progress Indicators**

#### **Enhanced Log Messages:**
```
📂 Folder selected: /path/to/folder
📄 Selected 5 files. Starting import...
✅ Imported: document1.pdf
🔮 Indexing for RAG...
✨ Indexed 42 chunks
✅ Imported: document2.txt
🔮 Indexing for RAG...
✨ Indexed 18 chunks
...
⚡ Syncing metadata...
✅ Sync complete.
📊 Total: 5 files, 203 chunks indexed
```

---

## ⚙️ Settings Module Enhancements

### **New RAG Settings Section**

#### **1. Index Management**

```tsx
<section>
    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
        <Sparkles size={16} /> RAG System
    </h3>
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        
        {/* Index Stats */}
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {ragStats?.total_chunks || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Chunks</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {ragStats?.unique_files || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Indexed Files</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {ragStats?.index_size_mb?.toFixed(2) || 0} MB
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Index Size</div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
            <button 
                onClick={reindexAll}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
            >
                <RefreshCw size={16} />
                Re-index All Documents
            </button>
            <button 
                onClick={clearIndex}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
                <Trash2 size={16} />
                Clear Index
            </button>
        </div>

        {/* Auto-index Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
            <div>
                <div className="font-medium">Auto-index on Import</div>
                <div className="text-sm text-gray-500">Automatically chunk and index new documents</div>
            </div>
            <button
                onClick={() => setAutoIndex(!autoIndex)}
                className={clsx(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    autoIndex ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-700"
                )}
            >
                <span className={clsx(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    autoIndex ? "translate-x-6" : "translate-x-1"
                )} />
            </button>
        </div>
    </div>
</section>
```

#### **2. Chunking Settings**

```tsx
<div className="space-y-4">
    <h4 className="font-medium">Chunking Configuration</h4>
    
    {/* Chunk Size */}
    <div>
        <label className="block text-sm font-medium mb-2">
            Chunk Size: {chunkSize} tokens
        </label>
        <input
            type="range"
            min="256"
            max="2048"
            step="128"
            value={chunkSize}
            onChange={(e) => setChunkSize(parseInt(e.target.value))}
            className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
            Smaller = More precise, Larger = More context
        </p>
    </div>

    {/* Overlap */}
    <div>
        <label className="block text-sm font-medium mb-2">
            Overlap: {overlap} tokens
        </label>
        <input
            type="range"
            min="0"
            max="512"
            step="32"
            value={overlap}
            onChange={(e) => setOverlap(parseInt(e.target.value))}
            className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
            Ensures continuity between chunks
        </p>
    </div>

    {/* Save Button */}
    <button 
        onClick={saveChunkingSettings}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
    >
        Save Chunking Settings
    </button>
</div>
```

---

## 🎨 UI Improvements

### **Import Tab:**
- ✨ Purple "RAG" badges next to indexed files in log
- 📊 Progress bar for bulk indexing
- 🔢 Chunk count display
- ⚡ Real-time indexing status

### **Settings Tab:**
- 📊 RAG index statistics dashboard
- 🔧 Chunking configuration controls
- 🔄 Re-index and clear buttons
- ⚙️ Auto-index toggle

---

## 🚀 Implementation Priority

### **Phase 1: Essential (Implement Now)**
1. ✅ Auto-index on file import
2. ✅ Show indexing progress in log
3. ✅ Add re-index all button in Import tab

### **Phase 2: Settings Dashboard**
1. Add RAG stats display in Settings
2. Add re-index/clear buttons
3. Add auto-index toggle

### **Phase 3: Advanced**
1. Chunking configuration UI
2. Index health monitoring
3. Selective re-indexing

---

## 📝 Backend Endpoints Needed

```python
# Already exists
POST /rag/reindex - Re-index all documents

# Need to add
POST /rag/index-file - Index a single file
POST /rag/clear - Clear the entire index
GET /rag/stats - Get index statistics (already exists)
POST /rag/update-config - Update chunking settings
```

---

## ✅ Success Criteria

1. **Automatic**: Files are indexed without user action
2. **Visible**: User sees indexing progress in real-time
3. **Manageable**: User can re-index or clear from UI
4. **Configurable**: Chunking settings adjustable in Settings
5. **Reliable**: Indexing errors are logged and handled gracefully

---

## 🎯 User Experience

### **Before (Manual)**:
```
1. Import files
2. Go to terminal
3. Run: python index_documents.py
4. Wait...
5. Hope it worked
```

### **After (Automatic)**:
```
1. Import files
2. ✨ Automatically indexed!
3. See progress in log
4. Ready to use in RAG search
```

---

**Ready to implement Phase 1?** Let's make import seamless with automatic RAG indexing! 🚀
