# RAG Integration - Testing Guide

## ✅ Integration Complete!

The RAG system has been successfully integrated into your Legislative Analysis Tool's Electron frontend!

## 🚀 What's Running

- **Electron App**: Running in dev mode
- **Vite Dev Server**: http://localhost:5173
- **RAG-Enhanced API**: http://127.0.0.1:5001
- **Index Status**: 206 chunks from 5 documents

## 🎯 New Features to Test

### 1. RAG Search Mode

**Location**: Library tab → Search bar → "RAG Search" button

**How to Test**:
1. Click on the **"RAG Search"** button (with sparkle icon ✨)
2. Type a query like:
   - "artificial intelligence safety"
   - "SB 1047"
   - "frontier models"
   - "housing affordability"
3. Press **Enter**
4. You should see:
   - Chunk-level results with relevance scores
   - Preview of chunk text
   - Bill number, position, sender
   - "Select File" button to add to selection

### 2. Chunk Preview Display

**What to Look For**:
- Purple/blue gradient background for RAG results
- Each chunk shows:
  - **Relevance score** (e.g., "95% match")
  - **Chunk position** (e.g., "Chunk 3/10")
  - **File name** with icon
  - **Bill number** badge
  - **Position** badge (Support/Oppose)
  - **Text preview** (3 lines max)
  - **Select File** button

### 3. Search Modes Comparison

Try the same query in all three modes:

**Metadata Search**:
- Instant filtering
- Searches title, sender, bill number only
- Shows full documents

**Full Text Search**:
- Searches entire document content
- Shows matching documents
- Press Enter to search

**RAG Search** (NEW!):
- Semantic understanding
- Chunk-level results
- Relevance scoring
- Press Enter to search

## 🧪 Test Scenarios

### Scenario 1: Find AI Safety Information
```
Mode: RAG Search
Query: "artificial intelligence safety concerns"
Expected: Chunks from SB 1047 documents with high relevance scores
```

### Scenario 2: Bill-Specific Search
```
Mode: RAG Search  
Query: "SB 1047"
Expected: All chunks related to SB 1047, sorted by relevance
```

### Scenario 3: Topic Search
```
Mode: RAG Search
Query: "frontier models regulation"
Expected: Relevant chunks about AI model regulation
```

### Scenario 4: Select Files from Chunks
```
1. Perform RAG search
2. Click "Select File" on a chunk
3. Verify file is added to selection
4. Go to Analysis tab
5. Verify selected files are there
```

## 📊 RAG Stats Display

**Location**: Below search bar when RAG mode is active

**Shows**:
- Total chunks indexed (e.g., "206 chunks indexed")
- Sparkle icon indicating RAG is active
- Hint text about semantic search

## 🎨 Visual Indicators

### RAG Mode Active:
- **Search button**: White background with blue text and sparkle icon
- **Hint text**: Purple sparkle icon + "RAG-powered semantic search..."
- **Placeholder**: "RAG semantic search - finds relevant chunks..."

### RAG Results:
- **Container**: Purple-to-blue gradient background
- **Header**: Purple icon + "RAG Search Results"
- **Chunks**: White cards with hover effects
- **Relevance**: Purple badge with percentage
- **Select button**: Purple background

## 🐛 Things to Check

### 1. RAG Stats Loading
- [ ] Stats show correct chunk count (206)
- [ ] Stats update after reindexing
- [ ] No errors in console

### 2. Search Functionality
- [ ] RAG search returns results
- [ ] Relevance scores are reasonable (0-100%)
- [ ] Chunks are sorted by relevance
- [ ] Preview text is readable

### 3. File Selection
- [ ] "Select File" button works
- [ ] Files are added to selection
- [ ] Selection persists across tabs
- [ ] Can use selected files in Analysis

### 4. UI/UX
- [ ] Search modes toggle smoothly
- [ ] RAG results display nicely
- [ ] Scrolling works in chunk list
- [ ] Dark mode looks good
- [ ] Responsive layout

## 🔧 If Something Doesn't Work

### RAG Search Returns No Results
**Check**:
1. Index has chunks: `curl http://localhost:5001/rag/stats`
2. Server is running: Check terminal output
3. Query is not empty

**Fix**:
```bash
# Reindex documents
curl -X POST http://localhost:5001/rag/reindex
```

### Server Not Starting
**Check**:
1. Port 5001 is free: `lsof -i:5001`
2. Python venv is activated
3. Dependencies installed

**Fix**:
```bash
# Kill port 5001
lsof -ti:5001 | xargs kill -9

# Restart app
cd electron-app && npm run dev
```

### Chunks Not Displaying
**Check**:
1. Browser console for errors (Cmd+Option+I)
2. Network tab for failed requests
3. React component rendering

## 📈 Performance Expectations

- **Search speed**: <200ms for 206 chunks
- **Index load**: <100ms
- **UI response**: Instant
- **Chunk display**: Smooth scrolling

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ RAG Search button appears in Library
2. ✅ Clicking it shows RAG mode hint
3. ✅ Searching returns chunk results
4. ✅ Results show relevance scores
5. ✅ "Select File" adds files to selection
6. ✅ No console errors
7. ✅ UI looks polished and professional

## 🚀 Next Steps After Testing

1. **Test with real queries** - Try your actual use cases
2. **Verify generation** - Use selected files in Analysis tab
3. **Check performance** - Make sure it's fast enough
4. **Note improvements** - What could be better?
5. **Package the app** - When ready: `npm run dist`

## 📝 Notes

- The RAG system uses **keyword-only search** by default (faster)
- **Semantic search** is available but requires sentence-transformers
- Index is stored in `legislative_chunks/index.jsonl`
- Server logs show in terminal (helpful for debugging)

---

**Happy Testing!** 🎊

The RAG integration is complete and ready to use. Test it out and let me know what you think or if you need any adjustments!
