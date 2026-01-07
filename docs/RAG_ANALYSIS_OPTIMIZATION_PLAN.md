# RAG-Enhanced Analysis Engine - Optimization Plan

## 🎯 Core Objective
Integrate RAG system into the Analysis tab to provide context-aware, chunk-level analysis that produces higher quality legislative artifacts with better source attribution.

---

## 📋 Recommended Features

### **Phase 1: Smart Context Retrieval (High Priority)**

#### 1.1 **Query-Aware Chunk Selection**
**Problem**: Currently, the entire document is sent to Ollama, which may exceed context limits and include irrelevant information.

**Solution**: Use RAG to retrieve only the most relevant chunks based on the user's analysis goal.

**Implementation**:
```typescript
// In Analysis tab
interface AnalysisConfig {
    artifactType: string;        // "Executive Summary", "Talking Points", etc.
    tone: string;                // "Professional", "Persuasive", etc.
    focusQuery: string;          // NEW: User-defined focus (e.g., "economic impact")
    useRAG: boolean;             // Toggle RAG-enhanced analysis
    topK: number;                // Number of chunks to retrieve (default: 10)
    minRelevance: number;        // Minimum relevance score (0-100)
}
```

**Benefits**:
- ✅ Stays within Ollama context limits
- ✅ Focuses on most relevant information
- ✅ Faster generation
- ✅ More precise outputs

---

#### 1.2 **Automatic Query Generation**
**Problem**: Users may not know what query to use for optimal chunk retrieval.

**Solution**: Auto-generate intelligent queries based on artifact type and selected documents.

**Examples**:
```
Artifact: "Executive Summary" 
→ Query: "key provisions, stakeholder positions, legislative impact"

Artifact: "Talking Points"
→ Query: "main arguments, supporting evidence, counterpoints"

Artifact: "Opposition Research"
→ Query: "weaknesses, contradictions, opposing viewpoints"

Artifact: "Floor Speech"
→ Query: "compelling narratives, constituent impact, policy benefits"
```

**UI**: Show the generated query with option to edit before analysis.

---

#### 1.3 **Multi-Document Synthesis**
**Problem**: When multiple documents are selected, it's hard to find common themes and contradictions.

**Solution**: Use RAG to find related chunks across all selected documents.

**Implementation**:
```python
# Backend: Cross-document chunk retrieval
def get_cross_document_chunks(query, selected_files, top_k=20):
    # Get chunks from all selected files
    chunks = rag_search(query, top_k=top_k * len(selected_files))
    
    # Filter to only selected files
    filtered = [c for c in chunks if c.file in selected_files]
    
    # Group by topic/theme
    grouped = group_by_similarity(filtered)
    
    return grouped
```

**Benefits**:
- ✅ Find consensus across documents
- ✅ Identify contradictions
- ✅ Build comprehensive arguments

---

### **Phase 2: Prompt Engineering & Fine-Tuning (Medium Priority)**

#### 2.1 **Context-Aware Prompts**
**Problem**: Generic prompts don't leverage the rich metadata in chunks.

**Solution**: Build prompts that include chunk metadata for better context.

**Enhanced Prompt Structure**:
```
TASK: {artifact_type}
FOCUS: {user_focus_query}

RELEVANT CONTEXT:
{for each chunk:}
---
Source: {file_name}
Bill: {bill_number}
Position: {position}
Sender: {sender/organization}
Relevance: {relevance_score}%

Content:
{chunk_text}
---

INSTRUCTIONS:
1. Synthesize the above context to create a {artifact_type}
2. Focus specifically on: {user_focus_query}
3. Cite sources using [Source: {file_name}] format
4. Prioritize information from higher relevance chunks
5. Note any contradictions between sources
...
```

**Benefits**:
- ✅ Ollama understands source credibility
- ✅ Better source attribution
- ✅ Aware of positions (Support/Oppose)

---

#### 2.2 **Relevance Threshold Control**
**Problem**: Low-relevance chunks may confuse the model.

**Solution**: Let users set minimum relevance threshold.

**UI Component**:
```typescript
<div className="analysis-settings">
    <label>Minimum Chunk Relevance</label>
    <input 
        type="range" 
        min="0" 
        max="100" 
        value={minRelevance}
        onChange={(e) => setMinRelevance(e.target.value)}
    />
    <span>{minRelevance}%</span>
    <p className="hint">
        Higher = More precise but fewer chunks
        Lower = More context but may include noise
    </p>
</div>
```

**Default**: 50% for broad analysis, 75% for focused analysis

---

#### 2.3 **Chunk Limit Control**
**Problem**: Too many chunks overwhelm the model; too few miss important context.

**Solution**: Smart chunk limit with preview.

**UI**:
```typescript
<div className="chunk-preview">
    <label>Number of Chunks to Analyze</label>
    <input 
        type="number" 
        min="5" 
        max="50" 
        value={topK}
    />
    
    {/* Show estimated token count */}
    <div className="token-estimate">
        Estimated tokens: ~{estimatedTokens}
        {estimatedTokens > 4000 && (
            <Warning>May exceed context limit for some models</Warning>
        )}
    </div>
    
    {/* Preview which chunks will be used */}
    <button onClick={previewChunks}>
        Preview Selected Chunks
    </button>
</div>
```

---

### **Phase 3: Advanced Features (Lower Priority)**

#### 3.1 **Position-Aware Analysis**
**Problem**: Need to analyze support vs. opposition arguments separately.

**Solution**: Filter chunks by position before analysis.

**UI**:
```typescript
<div className="position-filter">
    <label>Include Positions:</label>
    <Checkbox checked={includeSupport}>Support</Checkbox>
    <Checkbox checked={includeOppose}>Oppose</Checkbox>
    <Checkbox checked={includeNeutral}>Neutral/Unknown</Checkbox>
</div>
```

**Use Cases**:
- "Opposition Research" → Only "Oppose" chunks
- "Support Brief" → Only "Support" chunks
- "Balanced Analysis" → All positions

---

#### 3.2 **Iterative Refinement**
**Problem**: First draft may not be perfect.

**Solution**: Allow users to refine with additional context.

**Workflow**:
1. Generate initial artifact with RAG
2. User reviews and identifies gaps
3. User adds refinement query (e.g., "add more economic data")
4. System retrieves additional chunks matching refinement
5. Regenerate with expanded context

**UI**:
```typescript
<div className="refinement-panel">
    <h4>Refine Analysis</h4>
    <input 
        placeholder="What's missing? (e.g., 'environmental impact')"
        value={refinementQuery}
    />
    <button onClick={refineAnalysis}>
        Add Context & Regenerate
    </button>
</div>
```

---

#### 3.3 **Source Citation Validation**
**Problem**: Ollama may hallucinate sources.

**Solution**: Validate citations against actual chunks.

**Implementation**:
```python
def validate_citations(generated_text, chunks_used):
    # Extract citations from generated text
    citations = extract_citations(generated_text)
    
    # Check each citation exists in chunks
    valid = []
    invalid = []
    
    for citation in citations:
        if citation_exists_in_chunks(citation, chunks_used):
            valid.append(citation)
        else:
            invalid.append(citation)
    
    return {
        'valid': valid,
        'invalid': invalid,
        'accuracy': len(valid) / len(citations)
    }
```

**UI**: Show citation accuracy score and highlight invalid citations.

---

#### 3.4 **Chunk Highlighting in Output**
**Problem**: Hard to verify which chunks contributed to which parts of the output.

**Solution**: Link output sections to source chunks.

**UI**:
```typescript
// Hovering over a paragraph shows which chunks were used
<div className="generated-paragraph" 
     onMouseEnter={() => showSourceChunks([chunk1, chunk2])}>
    {paragraph_text}
    <span className="source-indicator">📄 2 sources</span>
</div>

// Sidebar shows chunk details
<div className="source-sidebar">
    <h4>Sources for this section:</h4>
    {sourceChunks.map(chunk => (
        <ChunkCard chunk={chunk} />
    ))}
</div>
```

---

## 🎨 Recommended UI Layout for Analysis Tab

```
┌─────────────────────────────────────────────────────────┐
│ Analysis Configuration                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Artifact Type: [Executive Summary ▼]                    │
│ Tone: [Professional ▼]                                  │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🎯 Focus Query (Optional)                         │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ What should this analysis focus on?          │ │   │
│ │ │ e.g., "economic impact on small businesses"  │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ │                                                   │   │
│ │ [Auto-generate from artifact type]               │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ☑ Use RAG-Enhanced Analysis                            │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ RAG Settings (when enabled)                       │   │
│ │                                                   │   │
│ │ Chunks to analyze: [10] (5-50)                   │   │
│ │ Min relevance: [50%] ▬▬▬●▬▬▬▬                    │   │
│ │                                                   │   │
│ │ Include positions:                                │   │
│ │ ☑ Support  ☑ Oppose  ☑ Neutral                   │   │
│ │                                                   │   │
│ │ [Preview Selected Chunks]                         │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ [Generate Analysis]                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Generated Output                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ {Generated artifact with inline citations}              │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 📊 Analysis Metadata                              │   │
│ │ • Chunks used: 8                                  │   │
│ │ • Avg relevance: 78%                              │   │
│ │ • Citation accuracy: 95%                          │   │
│ │ • Sources: 3 documents                            │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ [Refine Analysis] [Export] [Copy]                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Priority

### **Immediate (This Session)**
1. ✅ Add "Focus Query" input to Analysis tab
2. ✅ Add RAG toggle checkbox
3. ✅ Integrate RAG search into generation flow
4. ✅ Show chunk count and relevance in output metadata

### **Next Session**
1. Add chunk preview before generation
2. Implement relevance threshold slider
3. Add position filtering
4. Improve prompt templates with chunk metadata

### **Future Enhancement**
1. Iterative refinement workflow
2. Citation validation
3. Source highlighting
4. Auto-query generation

---

## 💡 Key Benefits

1. **Better Quality**: Focus on relevant information only
2. **Transparency**: See which chunks influenced the output
3. **Control**: Fine-tune what the AI sees
4. **Efficiency**: Faster generation with smaller context
5. **Accuracy**: Validate citations against sources
6. **Flexibility**: Adjust analysis depth on the fly

---

## 🎯 Success Metrics

- **Relevance**: Generated artifacts cite appropriate sources
- **Accuracy**: 95%+ citation accuracy
- **Speed**: <10s generation time (vs. 30s+ for full documents)
- **User Control**: Users can preview and adjust context before generation
- **Quality**: Outputs are more focused and actionable

---

## 📝 Next Steps

**Would you like me to:**
1. **Start with Phase 1** - Add Focus Query and RAG toggle to Analysis tab?
2. **Create a detailed spec** for one specific feature?
3. **Build a prototype** of the enhanced Analysis UI?
4. **Implement the backend** RAG-enhanced generation endpoint first?

Let me know which direction you'd like to go, and I'll get started! 🚀
