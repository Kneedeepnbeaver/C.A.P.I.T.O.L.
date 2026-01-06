import { useState, useEffect } from 'react';
import { Search, FolderOpen, RefreshCw, FileText, X, Save, Edit3, Sparkles, FileSearch, Flame } from 'lucide-react';
import clsx from 'clsx';
import { useOracle } from '../contexts/OracleContext';

interface LibraryProps {
    onSelectionChange: (selectedPaths: string[]) => void;
    selectedPaths: string[];
}

interface RAGChunk {
    id: string;
    text: string;
    file: string;
    bill: string;
    sender: string;
    position: string;
    relevance: number;
    chunk_index: number;
    total_chunks: number;
}

export function Library({ onSelectionChange, selectedPaths }: LibraryProps) {
    const [allDocs, setAllDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [ragStats, setRagStats] = useState<any>(null);

    // Unified search results
    const [searchResults, setSearchResults] = useState<{
        documents: any[];
        chunks: RAGChunk[];
        hasSearched: boolean;
    }>({ documents: [], chunks: [], hasSearched: false });

    // Accordion state for chunks
    const [chunksExpanded, setChunksExpanded] = useState(false);
    const [isVaultLoaded, setIsVaultLoaded] = useState(false);

    // Edit State
    const [editingDoc, setEditingDoc] = useState<any>(null);

    // Oracle Context
    const { consultMinerva } = useOracle();

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/library');
            const data = await res.json();
            setAllDocs(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    // Load persisted state on mount
    useEffect(() => {
        const saved = localStorage.getItem('vault_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                setSearch(state.search || '');
                setSearchResults(state.searchResults || { documents: [], chunks: [], hasSearched: false });
                setChunksExpanded(state.chunksExpanded || false);
            } catch (err) {
                console.error('Failed to load vault state:', err);
            }
        }
        setIsVaultLoaded(true);
    }, []);

    // Save state on changes (only after initial load)
    useEffect(() => {
        if (!isVaultLoaded) return;

        const state = {
            search,
            searchResults,
            chunksExpanded
        };
        localStorage.setItem('vault_state', JSON.stringify(state));
    }, [search, searchResults, chunksExpanded, isVaultLoaded]);

    const performUnifiedSearch = async () => {
        if (!search.trim()) {
            setSearchResults({ documents: [], chunks: [], hasSearched: false });
            return;
        }

        setLoading(true);
        try {
            // Search in parallel: metadata filter, full-text, and RAG
            const searchLower = search.toLowerCase();

            // 1. Metadata filtering (instant, local)
            const metadataMatches = allDocs.filter(doc =>
                doc['Document Title']?.toLowerCase().includes(searchLower) ||
                doc['Sender/Organization']?.toLowerCase().includes(searchLower) ||
                doc['Bill Number']?.toLowerCase().includes(searchLower)
            );

            // 2. Full-text search (API call)
            let fullTextMatches: any[] = [];
            try {
                const ftRes = await fetch('http://localhost:5001/library/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: search })
                });
                fullTextMatches = await ftRes.json();
            } catch (err) {
                console.error('Full-text search error:', err);
            }

            // 3. RAG search (API call)
            let ragMatches: RAGChunk[] = [];
            try {
                const ragRes = await fetch('http://localhost:5001/rag/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: search, top_k: 20 })
                });
                ragMatches = await ragRes.json();
            } catch (err) {
                console.error('RAG search error:', err);
            }

            // Combine and deduplicate documents
            const allMatchedDocs = new Map();

            // Add metadata matches (highest priority)
            metadataMatches.forEach(doc => {
                allMatchedDocs.set(doc.Filename, { ...doc, matchType: 'metadata', score: 100 });
            });

            // Add full-text matches
            fullTextMatches.forEach(doc => {
                if (!allMatchedDocs.has(doc.Filename)) {
                    allMatchedDocs.set(doc.Filename, { ...doc, matchType: 'fulltext', score: 80 });
                }
            });

            // Add documents from RAG chunks
            ragMatches.forEach(chunk => {
                if (!allMatchedDocs.has(chunk.file)) {
                    // Find the full document
                    const fullDoc = allDocs.find(d => d.Filename === chunk.file);
                    if (fullDoc) {
                        allMatchedDocs.set(chunk.file, {
                            ...fullDoc,
                            matchType: 'rag',
                            score: chunk.relevance
                        });
                    }
                }
            });

            setSearchResults({
                documents: Array.from(allMatchedDocs.values()),
                chunks: ragMatches,
                hasSearched: true
            });

        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRAGStats = async () => {
        try {
            const res = await fetch('http://localhost:5001/rag/stats');
            const data = await res.json();
            setRagStats(data);
        } catch (err) { console.error(err); }
    };

    const syncLibrary = async () => {
        setLoading(true);
        try {
            await fetch('http://localhost:5001/sync', { method: 'POST' });
            await fetchDocs();
        } catch (err) { alert("Sync failed: " + err); } finally { setLoading(false); }
    };

    const openFolder = async () => {
        try {
            await fetch('http://localhost:5001/open-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder: 'library' })
            });
        } catch (err) { console.error(err); }
    };

    const saveMetadata = async () => {
        if (!editingDoc) return;
        try {
            const res = await fetch('http://localhost:5001/library/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingDoc)
            });
            const data = await res.json();
            if (data.status === 'success') {
                setEditingDoc(null);
                fetchDocs(); // Refresh table
            } else {
                alert("Error saving: " + data.error);
            }
        } catch (err) {
            alert("Save failed: " + err);
        }
    };

    useEffect(() => {
        fetchDocs();
        fetchRAGStats();
    }, []);

    // Determine which documents to display
    const displayedDocs = searchResults.hasSearched ? searchResults.documents : allDocs;

    const toggleSelect = (filename: string) => {
        if (selectedPaths.includes(filename)) {
            onSelectionChange(selectedPaths.filter(p => p !== filename));
        } else {
            onSelectionChange([...selectedPaths, filename]);
        }
    };

    const handleEdit = (doc: any) => {
        setEditingDoc({ ...doc });
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black/95 text-gray-900 dark:text-gray-100 p-8 gap-6 max-w-7xl mx-auto w-full relative">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">The Vault</h2>
                    <p className="text-gray-500 dark:text-gray-400">Prospecting for nuggets of wisdom in your legislative documents.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={syncLibrary} disabled={loading}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                        <RefreshCw size={16} className={clsx(loading && "animate-spin")} />
                        {loading ? "Syncing..." : "Sync Metadata"}
                    </button>
                    <button onClick={openFolder}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                        <FolderOpen size={16} /> Open Folder
                    </button>
                </div>
            </div>

            {/* Unified Search */}
            <div className="flex gap-4 items-center">
                <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="text-gray-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search across all documents (metadata, content, and semantic)..."
                        className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl py-4 pl-12 pr-4 text-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') performUnifiedSearch(); }}
                    />
                </div>
                <button
                    onClick={performUnifiedSearch}
                    disabled={loading || !search.trim()}
                    className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all">
                    <Sparkles size={18} />
                    Search
                </button>
            </div>

            <div className="px-1 -mt-4 mb-2 text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <Sparkles size={12} className="text-purple-500" />
                <span>
                    Unified search combines metadata filtering, full-text search, and RAG semantic search.
                    {ragStats && <span className="text-gray-500 ml-2">({ragStats.total_chunks} nuggets of wisdom & {ragStats.total_words?.toLocaleString()} words indexed)</span>}
                </span>
            </div>

            {/* Consult Minerva Button - Appears when search has results */}
            {searchResults.hasSearched && (searchResults.documents.length > 0 || searchResults.chunks.length > 0) && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => {
                            const docFilenames = searchResults.documents.map(d => d.Filename);
                            consultMinerva(search, docFilenames, searchResults.chunks);

                            const toast = document.createElement('div');
                            toast.className = 'fixed top-8 right-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500';
                            toast.innerHTML = `<div class="flex items-center gap-3"><span class="text-2xl">🏛️</span><div><div class="font-bold">The Oracle guides your path...</div><div class="text-sm opacity-90">Minerva awaits your wisdom</div></div></div>`;
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 3000);

                            setTimeout(() => {
                                const analysisLink = document.querySelector('[data-view="analysis"]') as HTMLElement;
                                if (analysisLink) analysisLink.click();
                            }, 500);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <Flame size={20} className="animate-pulse" />
                        Consult Minerva →
                    </button>
                </div>
            )}

            {/* RAG Chunk Results - Collapsible Accordion */}
            {searchResults.hasSearched && searchResults.chunks.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl shadow-lg overflow-hidden">
                    {/* Accordion Header - Always Visible */}
                    <button
                        onClick={() => setChunksExpanded(!chunksExpanded)}
                        className="w-full p-6 flex items-center justify-between hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Nuggets of Wisdom Found
                                    <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                                        {searchResults.chunks.length}
                                    </span>
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {chunksExpanded ? 'Click to hide nuggets' : 'Click to view semantically relevant nuggets of wisdom'}
                                </p>
                            </div>
                        </div>
                        <div className={clsx(
                            "text-gray-500 transition-transform duration-200",
                            chunksExpanded && "rotate-180"
                        )}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </button>

                    {/* Accordion Content - Collapsible */}
                    {chunksExpanded && (
                        <div className="px-6 pb-6 space-y-3 max-h-[500px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                            {searchResults.chunks.map((chunk) => (
                                <div key={chunk.id} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="flex items-center gap-2">
                                                <FileSearch size={16} className="text-purple-500" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-md">{chunk.file}</span>
                                            </div>
                                            {chunk.bill && (
                                                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                                                    {chunk.bill}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-gray-500">
                                                Nugget {chunk.chunk_index + 1}/{chunk.total_chunks}
                                            </div>
                                            <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs font-bold text-purple-700 dark:text-purple-300">
                                                {chunk.relevance.toFixed(0)}% match
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
                                        {chunk.text}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        {chunk.position && (
                                            <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full font-medium",
                                                chunk.position.toLowerCase().includes('support') ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                                    chunk.position.toLowerCase().includes('oppose') ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                            )}>
                                                {chunk.position}
                                            </span>
                                        )}
                                        {chunk.sender && (
                                            <span className="text-gray-500 dark:text-gray-400">{chunk.sender}</span>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (!selectedPaths.includes(chunk.file)) {
                                                    onSelectionChange([...selectedPaths, chunk.file]);
                                                }
                                            }}
                                            className="ml-auto px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-xs font-medium transition-colors"
                                        >
                                            Select File
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Document Grid */}
            <div className="flex-1 overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900/40 shadow-xl flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900/80 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-800 w-12">
                                    <input type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-100 dark:bg-gray-800"
                                        checked={displayedDocs.length > 0 && selectedPaths.length === displayedDocs.length}
                                        onChange={(e) => {
                                            if (e.target.checked) onSelectionChange(displayedDocs.map((d: any) => d.Filename));
                                            else onSelectionChange([]);
                                        }} />
                                </th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-800 font-semibold text-xs uppercase tracking-wider text-gray-500">Document</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-800 font-semibold text-xs uppercase tracking-wider text-gray-500 w-32">Date</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-800 font-semibold text-xs uppercase tracking-wider text-gray-500 w-32">Bill</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-800 font-semibold text-xs uppercase tracking-wider text-gray-500 w-32">Position</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-800 font-semibold text-xs uppercase tracking-wider text-gray-500 w-48">Sender</th>
                                <th className="p-4 border-b border-gray-200 dark:border-gray-800 font-semibold text-xs uppercase tracking-wider text-gray-500 w-16">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                            {displayedDocs.map((doc: any, i: number) => {
                                const isSelected = selectedPaths.includes(doc.Filename);
                                return (
                                    <tr key={i} className={clsx("group transition-colors duration-150",
                                        isSelected ? "bg-blue-50/50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50")}>
                                        <td className="p-4">
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(doc.Filename)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-100 dark:bg-gray-800" />
                                        </td>
                                        <td className="p-4 cursor-pointer" onClick={() => toggleSelect(doc.Filename)}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-md">{doc['Document Title']}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{doc.Filename}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4"><span className="text-sm text-gray-600 dark:text-gray-400">{doc['Document Date']}</span></td>
                                        <td className="p-4"><span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">{doc['Bill Number']}</span></td>
                                        <td className="p-4">
                                            <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                doc['Position']?.toLowerCase().includes('support') ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                                    doc['Position']?.toLowerCase().includes('oppose') ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                            )}>{doc['Position']}</span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{doc['Sender/Organization']}</td>
                                        <td className="p-4">
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(doc); }} className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                                                <Edit3 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 p-3 text-xs text-gray-500 flex justify-between items-center">
                    <span>{displayedDocs.length} documents {searchResults.hasSearched ? 'found' : 'total'}</span>
                    <span>{selectedPaths.length} selected</span>
                </div>
            </div>

            {/* Edit Modal */}
            {editingDoc && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditingDoc(null)}></div>
                    <div className="relative w-[500px] h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Edit3 size={20} className="text-blue-500" /> Edit Metadata</h3>
                            <button onClick={() => setEditingDoc(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-500 break-all border border-gray-200 dark:border-gray-700">
                                <span className="font-bold block text-xs uppercase tracking-wider mb-1">Filename</span>
                                {editingDoc.Filename}
                            </div>

                            {['Document Title', 'Document Date', 'Sender/Organization', 'Bill Number', 'Position'].map(field => (
                                <div key={field}>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">{field}</label>
                                    <input type="text" className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editingDoc[field] || ''}
                                        onChange={e => setEditingDoc({ ...editingDoc, [field]: e.target.value })} />
                                </div>
                            ))}

                            {['Summary', 'Key Arguments', 'Stakeholders', 'Keywords'].map(field => (
                                <div key={field}>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">{field}</label>
                                    <textarea className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                        value={editingDoc[field] || ''}
                                        onChange={e => setEditingDoc({ ...editingDoc, [field]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                            <button onClick={() => setEditingDoc(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900">Cancel</button>
                            <button onClick={saveMetadata} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2">
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
