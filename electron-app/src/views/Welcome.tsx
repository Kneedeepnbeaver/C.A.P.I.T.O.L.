import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Terminal, AlertCircle, Database, Layout } from 'lucide-react';
import clsx from 'clsx';

interface WelcomeProps {
    onComplete: () => void;
}

export default function Welcome({ onComplete }: WelcomeProps) {
    const [checkingOllama, setCheckingOllama] = useState(false);
    const [ollamaStatus, setOllamaStatus] = useState<'pending' | 'success' | 'failed'>('pending');

    const checkOllama = async () => {
        setCheckingOllama(true);
        try {
            await fetch('http://localhost:5001/api/tags'); // Proxy or direct? We usually hit 11434 via backend or direct
            // Actually our backend proxies it? Or we check backend health?
            // Let's check backend health first, then ollama
            const health = await fetch('http://localhost:5001/health');
            if (health.ok) {
                setOllamaStatus('success'); // Backend is responsive, assumes Ollama is too or backend handles it
            } else {
                throw new Error("Backend unreachable");
            }
        } catch (e) {
            console.error(e);
            setOllamaStatus('failed');
        } finally {
            setCheckingOllama(false);
        }
    };

    // Demo content import logic removed as it's not currently interconnected with the UI
    // Users are instructed to use the Import feature manually.

    useEffect(() => {
        // Auto check on mount
        checkOllama();
    }, []);

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-950 z-[100] flex flex-col">
            {/* Header */}
            <div className="flex-none p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-xl">
                        🏛️
                    </div>
                    <div>
                        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
                            C.A.P.I.T.O.L.
                        </h1>
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-500 tracking-widest uppercase">
                            Statecraft & Strategy Suite
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-4xl w-full grid grid-cols-2 gap-12 items-center">

                    {/* Left: Graphic */}
                    <div className="relative aspect-square hidden lg:flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="relative space-y-8">
                            <div className="flex items-center gap-4 text-gray-400 dark:text-gray-600 text-sm font-mono">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                                <span>Initializing Legislative Matrix...</span>
                            </div>
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                        <Database size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-2 w-20 bg-gray-100 dark:bg-gray-800 rounded mb-1"></div>
                                        <div className="h-2 w-12 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
                                    <div className="h-2 w-2/3 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl transform translate-x-8 translate-y-[-20px] rotate-[3deg] hover:rotate-0 transition-transform duration-500 z-10 relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                        <Layout size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-2 w-20 bg-gray-100 dark:bg-gray-800 rounded mb-1"></div>
                                        <div className="h-2 w-12 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Interact */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome, Strategist.</h2>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                C.A.P.I.T.O.L. is ready to connect your local intelligence with legislative analysis. Let's ensure your environment is primed.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Step 1: Backend Check */}
                            <div className={clsx(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                                ollamaStatus === 'success' ? "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800" :
                                    ollamaStatus === 'failed' ? "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800" :
                                        "border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800"
                            )}>
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    ollamaStatus === 'success' ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                                        ollamaStatus === 'failed' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                )}>
                                    {checkingOllama ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" /> :
                                        ollamaStatus === 'success' ? <CheckCircle size={20} /> :
                                            ollamaStatus === 'failed' ? <AlertCircle size={20} /> :
                                                <Terminal size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Local Intelligence Engine</h3>
                                    <p className="text-xs text-gray-500">
                                        {checkingOllama ? "Connecting to backend..." :
                                            ollamaStatus === 'success' ? "Online & Ready" :
                                                ollamaStatus === 'failed' ? "Connection failed. Is the app allowed to spawn python?" :
                                                    "Waiting to check..."}
                                    </p>
                                </div>
                                {ollamaStatus === 'failed' && (
                                    <button onClick={checkOllama} className="text-xs text-blue-600 font-medium hover:underline">Retry</button>
                                )}
                            </div>

                            {/* Step 2: Next Steps */}
                            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Getting Started</h3>
                                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-2 list-disc pl-4">
                                    <li>Visit <strong>Help & Docs</strong> for a Quick Start guide.</li>
                                    <li>Use <strong>Import</strong> to load the provided "Demo Content".</li>
                                    <li>Ensure <strong>Ollama</strong> is running externally for AI features.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={onComplete}
                                className="group w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
                            >
                                Enter Workspace
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
