import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Save, FolderOpen, Wand2, FileText, Layout, Cpu, MessageSquare, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useOracle } from '../contexts/OracleContext';

interface AnalysisProps {
    selectedDocs: any[]; // The full metadata objects
    onSelectionChange: (selectedPaths: string[]) => void;
    fullLibrary: any[];
}

declare global {
    interface Window {
        electron: {
            selectFolder: () => Promise<string[]>;
            selectFiles: () => Promise<string[]>;
            saveFile: (options: any) => Promise<string | undefined>;
        }
    }
}

export function Analysis({ selectedDocs, onSelectionChange, fullLibrary }: AnalysisProps) {
    const [artifactType, setArtifactType] = useState('Executive Summary');
    const [tone, setTone] = useState('Professional');
    const [instructions, setInstructions] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    // New states for dynamic models and presets
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [presets, setPresets] = useState<any[]>([]);
    const [autoSavedPath, setAutoSavedPath] = useState<string | null>(null);


    // RAG Enhancement States
    const [useRAG, setUseRAG] = useState(true);
    const [focusQuery, setFocusQuery] = useState('');
    const [topK, setTopK] = useState(10);
    const [minRelevance, setMinRelevance] = useState(50);
    const [ragMetadata, setRagMetadata] = useState<any>(null);
    const [isForgeLoaded, setIsForgeLoaded] = useState(false);
    const [stats, setStats] = useState<any>(null);



    // Oracle Context
    const { searchQuery, selectedDocuments, hasOracleGuidance, clearOracle } = useOracle();

    const [systemPersona, setSystemPersona] = useState(() => {
        return localStorage.getItem('analysis_persona') || "You are a senior legislative analyst with expertise in California state politics, policy analysis, and political strategy.";
    });

    useEffect(() => {
        localStorage.setItem('analysis_persona', systemPersona);
    }, [systemPersona]);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const mRes = await fetch('http://localhost:5001/models');
                const mData = await mRes.json();
                setModels(mData);
                if (mData.length > 0) setSelectedModel(mData[0]);

                const pRes = await fetch('http://localhost:5001/presets');
                const pData = await pRes.json();
                setPresets(pData);

                // Fetch RAG stats
                const sRes = await fetch('http://localhost:5001/rag/stats');
                const sData = await sRes.json();
                setStats(sData);
            } catch (err) { console.error("Failed to fetch analysis config", err); }
        };
        fetchConfig();
    }, []);

    // Load persisted Forge state on mount
    useEffect(() => {
        const saved = localStorage.getItem('forge_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                setFocusQuery(state.focusQuery || '');
                setArtifactType(state.artifactType || 'Executive Summary');
                setTone(state.tone || 'Professional');
                setInstructions(state.instructions || '');
                setResult(state.result || '');
                setTopK(state.topK || 10);
                setMinRelevance(state.minRelevance || 50);
                setRagMetadata(state.ragMetadata || null);
            } catch (err) {
                console.error('Failed to load forge state:', err);
            }
        }
        setIsForgeLoaded(true);
    }, []);

    // Save Forge state on changes (only after initial load)
    useEffect(() => {
        if (!isForgeLoaded) return;

        const state = {
            focusQuery,
            artifactType,
            tone,
            instructions,
            result,
            topK,
            minRelevance,
            ragMetadata
        };
        localStorage.setItem('forge_state', JSON.stringify(state));
    }, [focusQuery, artifactType, tone, instructions, result, topK, minRelevance, ragMetadata, isForgeLoaded]);

    // Oracle Auto-Population - Check for imported context
    useEffect(() => {
        if (hasOracleGuidance && searchQuery) {
            // Auto-fill Focus Query
            setFocusQuery(searchQuery);

            // Auto-select documents from Oracle context
            if (selectedDocuments.length > 0) {
                // Find matching documents in fullLibrary and select them
                const docsToSelect = fullLibrary
                    .filter(doc => selectedDocuments.includes(doc.Filename))
                    .map(doc => doc.Filename);

                if (docsToSelect.length > 0) {
                    onSelectionChange(docsToSelect);
                }
            }

            // Show success toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500';
            toast.innerHTML = `<div class="flex items-center gap-3"><span class="text-2xl">✨</span><div><div class="font-bold">Minerva receives wisdom from Vesta's flame</div><div class="text-sm opacity-90">${searchQuery}</div></div></div>`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);

            // Clear oracle context after use
            setTimeout(() => clearOracle(), 500);
        }
    }, [hasOracleGuidance, searchQuery, selectedDocuments, clearOracle, fullLibrary, onSelectionChange]);

    // Preview chunks function


    const generate = async () => {
        if (selectedDocs.length === 0) {
            alert("Please select documents in the Library first.");
            return;
        }

        setLoading(true);
        setRagMetadata(null);
        try {
            // Use RAG endpoint if enabled
            const endpoint = useRAG ? '/rag/generate' : '/generate';

            const payload: any = {
                selected_docs: selectedDocs,
                artifact_type: artifactType,
                tone: tone,
                instructions: instructions,
                model: selectedModel
            };

            // Add RAG-specific parameters
            if (useRAG) {
                payload.query = focusQuery || `${artifactType} for ${selectedDocs.map(d => d['Bill Number']).filter(Boolean).join(', ')}`;
                payload.top_k = topK;
                payload.min_relevance = minRelevance;
                payload.system_persona = systemPersona;
            }

            const res = await fetch(`http://localhost:5001${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server error (${res.status}): ${errorText}`);
            }

            const data = await res.json();

            if (useRAG && data.content) {
                // RAG endpoint response
                setResult(data.content);
                setRagMetadata({
                    chunks_used: data.chunks_used,
                    sources: data.sources,
                    query: data.query
                });
            } else {
                // Standard endpoint response
                setResult(data.markdown);
                setAutoSavedPath(data.auto_saved_path || null);
            }

            if (data.auto_saved_path) {
                console.log("Auto-saved to:", data.auto_saved_path);
                setAutoSavedPath(data.auto_saved_path);
            }
        } catch (err) {
            console.error("Generation error:", err);
            alert("Generation failed: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };


    const exportAs = async () => {
        if (!result) return;

        try {
            const formats = [
                { name: 'Markdown', extensions: ['md'] },
                { name: 'HTML', extensions: ['html'] },
                { name: 'Text', extensions: ['txt'] },
                { name: 'Word Document', extensions: ['docx'] },
            ];

            const savePath = await window.electron.saveFile({
                title: 'Export Analysis',
                defaultPath: `analysis_${Date.now()}`,
                filters: formats
            });

            if (savePath) {
                const res = await fetch('http://localhost:5001/save-as', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: result, path: savePath })
                });
                const data = await res.json();
                if (data.path) alert(`Exported to: ${data.path}`);
            }
        } catch (err) { alert("Export failed: " + err); }
    };

    const openFolder = async () => {
        await fetch('http://localhost:5001/open-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: 'results' })
        });
    };

    const artifactTypes = [
        { id: "Executive Summary", desc: "High-level overview of key issues." },
        { id: "Policy Analysis", desc: "Deep dive into legal and social impact." },
        { id: "Policy Recommendations", desc: "Strategic advice and future fixes." },
        { id: "Talking Points (Pro)", desc: "Arguments in support." },
        { id: "Talking Points (Con)", desc: "Arguments in opposition." },
        { id: "Vote Recommendation", desc: "Internal memo with advice." },
        { id: "Committee Briefing", desc: "Quick notes for hearing prep." },
        { id: "Press Release", desc: "Draft for media distribution." },
        { id: "Social Media Suite", desc: "Content for X, LinkedIn, etc." },
        { id: "Coalition Letter", desc: "Draft letter for support." },
        { id: "Opposition Research", desc: "Analysis of bill weaknesses." },
    ];

    return (
        <div className="flex h-full bg-gray-50/50 dark:bg-black/95 text-gray-900 dark:text-gray-100">
            {/* Configuration Pane */}
            <div className="w-[450px] border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900/50 backdrop-blur-sm z-10 transition-all">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                        <Wand2 className="text-blue-500" size={24} />
                        Minerva: The Gold Prospector
                    </h2>
                    <p className="text-sm text-gray-500">Transform documents into nuggets of wisdom.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">

                    {/* Model Selection */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 block flex items-center gap-2">
                            <Cpu size={14} /> LLM Engine
                        </label>
                        <select className="w-full bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                            value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
                            {models.map(m => <option key={m} value={m}>{m}</option>)}
                            {models.length === 0 && <option>No models found (Check Ollama)</option>}
                        </select>
                    </div>

                    {/* Minerva's Lens - Moved to top for prominence */}
                    {useRAG && (
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                            <label className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2 block flex items-center gap-2">
                                🦉 Minerva's Lens (Optional)
                            </label>
                            <input
                                type="text"
                                value={focusQuery}
                                onChange={e => setFocusQuery(e.target.value)}
                                placeholder={`e.g., "economic impact on small businesses"`}
                                className="w-full bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                Focus Minerva's wisdom on a specific aspect. Leave empty for broad analysis.
                            </p>
                        </div>
                    )}

                    {/* Context */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 block">Context</label>
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex items-center gap-3">
                            <div className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 w-10 h-10 rounded-lg flex items-center justify-center font-bold">
                                {selectedDocs.length}
                            </div>
                            <div>
                                <div className="font-medium text-sm text-blue-900 dark:text-blue-100">Selected Documents</div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 truncate max-w-[280px]">
                                    {selectedDocs.map(d => d.Filename).join(", ") || "None selected"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Artifact Type */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 block">Analysis Goal</label>
                        <div className="grid grid-cols-2 gap-2">
                            {artifactTypes.map((t) => (
                                <button key={t.id} onClick={() => setArtifactType(t.id)}
                                    className={clsx(
                                        "text-left p-2.5 rounded-lg border transition-all group",
                                        artifactType === t.id
                                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20"
                                            : "bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                                    )}>
                                    <div className="font-bold text-[13px] leading-tight">{t.id}</div>
                                    <div className={clsx("text-[10px] mt-0.5 mt-1", artifactType === t.id ? "text-blue-100" : "text-gray-500")}>{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Presets & Tone */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 block flex items-center gap-2">
                            <MessageSquare size={14} /> Tone / Voice Preset
                        </label>
                        <div className="space-y-3">
                            <select className="w-full bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                value={tone} onChange={e => setTone(e.target.value)}>
                                <option value="Professional">Default: Professional</option>
                                {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                            </select>
                            <textarea className="w-full bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                value={instructions} onChange={e => setInstructions(e.target.value)}
                                placeholder="Additional context or specific constraints..." />
                        </div>
                    </div>

                    {/* RAG Enhancement Section */}
                    <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                <Sparkles size={14} className="text-purple-500" /> Results from Mt. Olympus
                            </label>
                            <button
                                onClick={() => setUseRAG(!useRAG)}
                                className={clsx(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                    useRAG ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-700"
                                )}
                            >
                                <span className={clsx(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                    useRAG ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>

                        {useRAG && (
                            <div className="space-y-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                                {/* Focus Query */}
                                <div>
                                    <label className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2 block flex items-center gap-2">
                                        🦉 Minerva's Lens (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={focusQuery}
                                        onChange={e => setFocusQuery(e.target.value)}
                                        placeholder={`e.g., "economic impact on small businesses"`}
                                        className="w-full bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                        Focus Minerva's wisdom on a specific aspect. Leave empty for broad analysis.
                                    </p>
                                </div>

                                {/* Chunk Settings */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Top K */}
                                    <div>
                                        <label className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2 block">
                                            Nuggets of Wisdom to Prospect
                                        </label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="50"
                                            value={topK}
                                            onChange={e => setTopK(parseInt(e.target.value))}
                                            className="w-full bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                            {stats ? `${stats.total_chunks} nuggets total` : '5-50 nuggets'}
                                        </p>
                                    </div>

                                    {/* Min Relevance */}
                                    <div>
                                        <label className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2 block">
                                            Min Relevance: {minRelevance}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={minRelevance}
                                            onChange={e => setMinRelevance(parseInt(e.target.value))}
                                            className="w-full h-2 bg-purple-200 dark:bg-purple-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                            Higher = More precise
                                        </p>
                                    </div>
                                </div>

                                {/* Custom Persona */}
                                <div className="border-t border-purple-200 dark:border-purple-800 pt-4">
                                    <label className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2 block flex justify-between">
                                        <span>🎭 AI Persona / System Role</span>
                                        <button
                                            onClick={() => setSystemPersona("You are a senior legislative analyst with expertise in California state politics, policy analysis, and political strategy.")}
                                            className="text-[10px] text-purple-600 hover:text-purple-800 underline"
                                        >
                                            Reset Default
                                        </button>
                                    </label>
                                    <textarea
                                        value={systemPersona}
                                        onChange={e => setSystemPersona(e.target.value)}
                                        rows={3}
                                        className="w-full bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono text-[11px]"
                                        placeholder="Define who the AI is (e.g., expertise, state/region, role)..."
                                    />
                                    <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70 mt-1">
                                        Customize the AI's identity (e.g., change "California" to "New York" or adjust its seniority).
                                    </p>
                                </div>

                                {/* Info Box */}
                                <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                                    <p className="text-xs text-purple-800 dark:text-purple-200">
                                        <strong>✨ RAG Mode:</strong> Uses semantic search to find the most relevant passages from your documents, providing focused context to the AI for better quality outputs.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <button onClick={generate} disabled={loading || !selectedModel}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50">
                        {loading ? <span className="animate-spin text-xl">⏳</span> : <Wand2 size={20} />}
                        Generate Analysis
                    </button>
                </div>
            </div>

            {/* Preview Pane */}
            <div className="flex-1 flex flex-col bg-gray-100 dark:bg-[#0d1117] relative">

                <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 text-gray-900 dark:text-white">
                    <span className="font-semibold text-gray-500 text-sm flex items-center gap-2">
                        <Layout size={16} /> Preview
                    </span>

                    <div className="flex gap-2">
                        <button onClick={exportAs} disabled={!result} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
                            <FileText size={16} /> Export As...
                        </button>
                        <button onClick={openFolder} className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-gray-600 dark:text-gray-300 rounded-lg transition-colors" title="Open Generated Folder">
                            <FolderOpen size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative flex justify-center">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-6 z-0">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-gray-900 dark:text-white tracking-[0.2em] mb-1">C.A.P.I.T.O.L.</p>
                                <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-tight mb-3">Civic Artificial Programming & Intelligence for Tracking, Organizing & Lawmaking</p>
                                <p className="text-xs text-gray-500">Prospecting through the text using {selectedModel}...</p>
                            </div>
                        </div>
                    ) : result ? (
                        <div className="w-full max-w-4xl space-y-6">
                            {/* RAG Metadata Card */}
                            {ragMetadata && (
                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 shadow-lg">
                                    <h3 className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
                                        <Sparkles size={16} className="text-purple-500" />
                                        RAG Analysis Metadata
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{ragMetadata.chunks_used}</div>
                                            <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">Nuggets of Wisdom Analyzed</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{ragMetadata.sources?.length || 0}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Claims Staked</div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">🏛️</div>
                                            <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                                                Mt. Olympus Results
                                                {stats && <div className="text-[8px] opacity-70 mt-1">& {stats.total_words?.toLocaleString()} words</div>}
                                            </div>
                                        </div>
                                    </div>
                                    {ragMetadata.query && (
                                        <div className="mt-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                                            <div className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">Focus Query:</div>
                                            <div className="text-sm text-purple-700 dark:text-purple-300">{ragMetadata.query}</div>
                                        </div>
                                    )}

                                    {autoSavedPath && (
                                        <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 bg-white/50 dark:bg-black/20 rounded px-2 py-1 border border-gray-100 dark:border-gray-800">
                                            <Save size={10} />
                                            <span className="truncate">Auto-saved to: {autoSavedPath}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Generated Output */}
                            <div className="bg-white dark:bg-gray-900 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 rounded-xl min-h-[800px] border border-gray-100 dark:border-gray-800 p-12 transition-all">
                                <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-800 prose-blue prose-p:leading-relaxed prose-li:my-1">
                                    <ReactMarkdown>{result}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <FileText size={80} className="mb-6 opacity-10" />
                            <p className="text-xl font-bold">Workspace Ready</p>
                            <p className="max-w-sm text-center mt-2 text-sm">Select goals on the left to generate insights.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
