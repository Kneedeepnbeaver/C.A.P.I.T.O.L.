import { useState, useCallback, useEffect } from 'react';
import { Upload, Folder, ClipboardCopy, CheckCircle, Terminal, FilePlus, Files, Sparkles } from 'lucide-react';
import clsx from 'clsx';

declare global {
    interface Window {
        electron: {
            selectFolder: () => Promise<string[]>;
            selectFiles: () => Promise<string[]>;
            saveFile: (options: any) => Promise<string | undefined>;
        }
    }
}

export function Import() {
    const [folderPath, setFolderPath] = useState('');
    const [pasteTitle, setPasteTitle] = useState('');
    const [pasteContent, setPasteContent] = useState('');
    const [log, setLog] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'disk' | 'paste'>('disk');
    const [isDragging, setIsDragging] = useState(false);
    const [normalizeTranscripts, setNormalizeTranscripts] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isImporting, setIsImporting] = useState(false);
    const [recentImports, setRecentImports] = useState<{ name: string, status: 'success' | 'error', time: string }[]>([]);
    const [isIngestionLoaded, setIsIngestionLoaded] = useState(false);

    const addLog = (msg: string) => setLog(prev => [msg, ...prev]);
    const addRecent = (name: string, status: 'success' | 'error') => {
        setRecentImports(prev => [{ name, status, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 10));
    };

    // Load persisted Ingestion state on mount
    useEffect(() => {
        const saved = localStorage.getItem('ingestion_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                setLog(state.log || []);
                setRecentImports(state.recentImports || []);
            } catch (err) {
                console.error('Failed to load ingestion state:', err);
            }
        }
        setIsIngestionLoaded(true);
    }, []);

    // Save Ingestion state on changes (only after initial load)
    useEffect(() => {
        if (!isIngestionLoaded) return;

        const state = {
            log,
            recentImports
        };
        localStorage.setItem('ingestion_state', JSON.stringify(state));
    }, [log, recentImports, isIngestionLoaded]);

    const browseFolder = async () => {
        try {
            const paths = await window.electron.selectFolder();
            if (paths && paths.length > 0) {
                setFolderPath(paths[0]);
                addLog(`📂 Folder selected: ${paths[0]}`);
            }
        } catch (err) { console.error(err); }
    };

    const browseFiles = async () => {
        try {
            const paths = await window.electron.selectFiles();
            if (paths && paths.length > 0) {
                setIsImporting(true);
                setProgress(0);
                addLog(`📄 Selected ${paths.length} files. Starting import...`);
                for (let i = 0; i < paths.length; i++) {
                    await handleSingleFileImport(paths[i]);
                    setProgress(Math.round(((i + 1) / paths.length) * 100));
                }
                addLog("⚡ Syncing metadata...");
                await fetch('http://localhost:5001/sync', { method: 'POST' });
                addLog("✨ Minerva is Ready: Sync complete.");
                setIsImporting(false);
                setTimeout(() => setProgress(0), 1000);
            }
        } catch (err) {
            console.error(err);
            setIsImporting(false);
        }
    };

    const handleSingleFileImport = async (path: string) => {
        try {
            const res = await fetch('http://localhost:5001/import/folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path })
            });
            const data = await res.json();

            if (data.error) {
                addLog(`❌ Error [${path}]: ${data.error}`);
                addRecent(path.split('/').pop() || 'Unknown', 'error');
                return;
            }

            const filename = path.split('/').pop() || 'Unknown';
            addLog(`✅ Imported: ${filename}`);
            addRecent(filename, 'success');

            // Normalize transcript if enabled and file is VTT or TXT
            const fileExt = filename?.toLowerCase().split('.').pop();
            const isTranscript = fileExt === 'vtt' || fileExt === 'txt';

            if (normalizeTranscripts && isTranscript) {
                try {
                    addLog(`📝 Normalizing transcript...`);
                    const normRes = await fetch('http://localhost:5001/import/normalize-transcript', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: data.filename || filename })
                    });

                    if (normRes.ok) {
                        const normData = await normRes.json();
                        if (normData.changes_made) {
                            addLog(`✨ Normalized (${normData.original_length} → ${normData.normalized_length} chars)`);
                        } else {
                            addLog(`ℹ️  No normalization needed`);
                        }
                    }
                } catch (normErr) {
                    addLog(`⚠️  Normalization failed: ${normErr}`);
                }
            }

            // Auto-index for RAG
            try {
                addLog(`🔮 Indexing for RAG...`);
                const ragRes = await fetch('http://localhost:5001/rag/index-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: data.filename || filename })
                });

                if (ragRes.ok) {
                    const ragData = await ragRes.json();
                    addLog(`✨ Indexed ${ragData.chunks_added} chunks`);
                } else {
                    addLog(`⚠️  RAG indexing skipped (may not be a text file)`);
                }
            } catch (ragErr) {
                addLog(`⚠️  RAG indexing failed: ${ragErr}`);
            }
        } catch (err) { addLog(`❌ Failed [${path}]: ${err}`); }
    };

    const handleImportFolder = async () => {
        if (!folderPath) { alert("Please select a folder first."); return; }
        addLog(`⏳ Importing folder: ${folderPath}...`);
        try {
            const res = await fetch('http://localhost:5001/import/folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: folderPath })
            });
            const data = await res.json();
            if (data.error) addLog(`❌ Error: ${data.error}`);
            else {
                addLog(`✅ Success! Imported ${data.count} files.`);
                addLog("⚡ Syncing metadata...");
                await fetch('http://localhost:5001/sync', { method: 'POST' });
                addLog("✨ Minerva is Ready: Sync complete.");
            }
        } catch (err) { addLog(`❌ Failed: ${err}`); }
    };

    const handlePasteSave = async () => {
        if (!pasteContent) return;
        addLog("⏳ Saving pasted content...");
        try {
            const res = await fetch('http://localhost:5001/import/paste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: pasteTitle, content: pasteContent })
            });
            const data = await res.json();

            if (data.error) {
                addLog(`❌ Error: ${data.error}`);
                return;
            }

            const filename = data.filename;
            addLog(`✅ Saved as ${filename}`);

            // Normalize if enabled
            if (normalizeTranscripts) {
                try {
                    addLog(`📝 Normalizing transcript...`);
                    const normRes = await fetch('http://localhost:5001/import/normalize-transcript', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: filename })
                    });

                    if (normRes.ok) {
                        const normData = await normRes.json();
                        if (normData.changes_made) {
                            addLog(`✨ Normalized (${normData.original_length} → ${normData.normalized_length} chars)`);
                        } else {
                            addLog(`ℹ️  No normalization needed`);
                        }
                    }
                } catch (normErr) {
                    addLog(`⚠️  Normalization failed: ${normErr}`);
                }
            }

            // Auto-index for RAG
            try {
                addLog(`🔮 Indexing for RAG...`);
                const ragRes = await fetch('http://localhost:5001/rag/index-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: filename })
                });

                if (ragRes.ok) {
                    const ragData = await ragRes.json();
                    addLog(`✨ Indexed ${ragData.chunks_added} chunks`);
                } else {
                    addLog(`⚠️  RAG indexing skipped`);
                }
            } catch (ragErr) {
                addLog(`⚠️  RAG indexing failed: ${ragErr}`);
            }

            addLog("⚡ Syncing metadata...");
            await fetch('http://localhost:5001/sync', { method: 'POST' });
            addLog("✅ Sync complete.");
            setPasteContent(''); setPasteTitle('');
        } catch (err) { addLog(`❌ Failed: ${err}`); }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        // Direct file drop is tricky in Electron's renderer without path protection, 
        // usually better to use the button. But we can log that we saw a drop.
        addLog("💡 Tip: Use the 'Select Files' or 'Select Folder' buttons for best compatibility.");
    }, []);

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black/95 text-gray-900 dark:text-white p-8 lg:p-12 max-w-6xl mx-auto w-full">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Wisdom Ingestion</h2>
                <p className="text-gray-500 dark:text-gray-400">Prospecting for wisdom in your legislative documents.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
                        <button onClick={() => setActiveTab('disk')}
                            className={clsx("pb-3 px-1 font-medium text-sm transition-colors border-b-2 flex items-center gap-2",
                                activeTab === 'disk' ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}>
                            <Files size={18} /> Disk Ingestion
                        </button>
                        <button onClick={() => setActiveTab('paste')}
                            className={clsx("pb-3 px-1 font-medium text-sm transition-colors border-b-2 flex items-center gap-2",
                                activeTab === 'paste' ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}>
                            <ClipboardCopy size={18} /> Instant Capture
                        </button>
                    </div>

                    {activeTab === 'disk' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Individual Files */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center group active:scale-[0.99] transition-all cursor-pointer hover:border-blue-500/50"
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDrop}
                                onClick={browseFiles}>
                                <div className={clsx("w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
                                    isDragging ? "bg-blue-500 text-white scale-110" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30")}>
                                    <FilePlus size={32} />
                                </div>
                                <h3 className="text-lg font-bold mb-1">Spotlight Documents (Hollywood)</h3>
                                <p className="text-sm text-gray-500 max-w-xs">Select PDF, DOCX, TXT, VTT, or Markdown files to analyze.</p>
                                {isDragging && <div className="mt-4 text-blue-500 font-bold text-sm">Drop to import</div>}
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-400" /> Ingestion Options
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Smart Transcript Normalization (Silicon Valley Style)</span>
                                        <span className="text-xs text-gray-500">Auto-fix ALL CAPS, remove VTT headers, and iterate on punctuation</span>
                                    </div>
                                    <button
                                        onClick={() => setNormalizeTranscripts(!normalizeTranscripts)}
                                        className={clsx(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                            normalizeTranscripts ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                                        )}
                                    >
                                        <span
                                            className={clsx(
                                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                                normalizeTranscripts ? "translate-x-6" : "translate-x-1"
                                            )}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                                    <Folder size={14} /> Bulk Folder Import
                                </h3>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center px-3">
                                        <input type="text" placeholder="Paste path or use Browse..."
                                            className="bg-transparent border-none outline-none w-full text-sm py-3"
                                            value={folderPath} onChange={e => setFolderPath(e.target.value)} />
                                    </div>
                                    <button onClick={browseFolder} className="px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-sm">
                                        Browse
                                    </button>
                                </div>
                                <button onClick={handleImportFolder}
                                    className="w-full mt-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                    Import Selective Contents
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'paste' && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Paste Legislative Text</h3>
                                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-full">
                                    <Sparkles size={12} className="text-purple-500" />
                                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">RAG Enabled</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <input type="text" placeholder="Title for reference (e.g. Memo from Staff)"
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={pasteTitle} onChange={e => setPasteTitle(e.target.value)} />
                                <div className="relative">
                                    <textarea placeholder="Paste content here..."
                                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 min-h-[300px] w-full text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                                        value={pasteContent} onChange={e => setPasteContent(e.target.value)} />
                                    {normalizeTranscripts && (
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-500 font-bold uppercase tracking-wider backdrop-blur-sm">
                                            Auto-Normalize On
                                        </div>
                                    )}
                                </div>
                                <button onClick={handlePasteSave}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                    <CheckCircle size={18} /> Ingest into Vault
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-[#1e1e1e] text-gray-300 rounded-xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col h-[600px]">
                        <div className="bg-[#2d2d2d] p-3 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-blue-400" />
                                <span className="text-xs font-mono font-bold text-gray-400">SESSION LOG</span>
                            </div>
                            <button onClick={() => setLog([])} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold">Clear</button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-2 leading-relaxed">
                            {log.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20">
                                    <Upload size={32} className="mb-2" />
                                    <span>Monitoring ingest...</span>
                                </div>
                            ) : log.map((l, i) => (
                                <div key={i} className="flex gap-3">
                                    <span className="text-gray-600 shrink-0">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                                    <span className={clsx(l.includes('✅') ? "text-green-400" : l.includes('❌') ? "text-red-400" : "text-blue-300")}>{l}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                            Recent Ingestions
                        </h3>
                        <div className="space-y-3">
                            {recentImports.length === 0 ? (
                                <div className="p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center text-xs text-gray-500">
                                    No recent imports
                                </div>
                            ) : recentImports.map((item, i) => (
                                <div key={i} className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("w-2 h-2 rounded-full", item.status === 'success' ? "bg-green-500" : "bg-red-500")}></div>
                                        <span className="text-sm font-medium truncate max-w-[150px]">{item.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Progress Overlay */}
            {isImporting && (
                <div className="fixed bottom-8 right-8 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 z-50 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-500 animate-pulse" />
                            Channeling Wisdom...
                        </span>
                        <span className="text-xs font-mono text-gray-500">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
}
