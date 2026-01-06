import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, Sparkles, BookOpen, ChevronDown, ChevronUp, Loader2, Trash2, Flame } from 'lucide-react';
import clsx from 'clsx';
import { useOracle } from '../contexts/OracleContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
}

interface ChatProps {
    selectedDocs: any[];
}

export function Chat({ selectedDocs }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSources, setShowSources] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false); // Track if we've loaded from localStorage

    // Oracle Context for Forge integration
    const { consultMinerva } = useOracle();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Load persisted Oracle state on mount
    useEffect(() => {
        const saved = localStorage.getItem('oracle_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                setMessages(state.messages || []);
                setInput(state.input || '');
            } catch (err) {
                console.error('Failed to load oracle state:', err);
            }
        }
        // Mark as loaded after attempting to restore
        setIsLoaded(true);
    }, []);

    // Save Oracle state on changes (only after initial load)
    useEffect(() => {
        if (!isLoaded) return; // Don't save until we've loaded

        const state = {
            messages,
            input
        };
        localStorage.setItem('oracle_state', JSON.stringify(state));
    }, [messages, input]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const systemPersona = localStorage.getItem('analysis_persona') ||
                "You are a senior legislative analyst with expertise in California state politics and policy analysis.";

            const res = await fetch('http://localhost:5001/rag/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    history: messages.slice(-10),
                    system_persona: systemPersona,
                    filters: selectedDocs.length > 0 ? { filename: selectedDocs.map(d => d.Filename) } : null,
                })
            });

            if (!res.ok) throw new Error("Failed to get response from AI");

            const data = await res.json();
            const assistantMsg: Message = {
                role: 'assistant',
                content: data.answer,
                sources: data.sources
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "⚠️ I'm sorry, I encountered an error. Please make sure the backend is running and try again."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        if (messages.length === 0 || window.confirm("Start a new conversation? This will clear your chat history.")) {
            setMessages([]);
            setInput('');

            // Show toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-8 right-8 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-xl z-50 animate-in slide-in-from-top-4 duration-300';
            toast.innerHTML = '<div class="text-sm font-medium flex items-center gap-2"><span>🔮</span> New conversation started</div>';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }
    };

    // Forge from specific message (per-message button)
    const forgeFromMessage = (message: Message) => {
        // Find the user question that prompted this response
        const msgIndex = messages.indexOf(message);
        const userQuestion = msgIndex > 0 ? messages[msgIndex - 1].content : '';

        // Extract unique source files from this message's sources
        const sourceFiles = message.sources
            ? [...new Set(message.sources.map(s => s.file))]
            : [];

        // Use first sentence of user question as focus query
        const focusQuery = userQuestion.split(/[.!?]/)[0].trim() || userQuestion.substring(0, 100);

        consultMinerva(focusQuery, sourceFiles, message.sources || []);

        // Toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-8 right-8 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-500';
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">🔥</span>
                <div>
                    <div class="font-bold">The Oracle's wisdom flows to Minerva's Forge</div>
                    <div class="text-sm opacity-90">${sourceFiles.length} source${sourceFiles.length !== 1 ? 's' : ''} selected</div>
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        // Navigate to Forge
        setTimeout(() => {
            const forgeLink = document.querySelector('[data-view="analysis"]') as HTMLElement;
            if (forgeLink) forgeLink.click();
        }, 500);
    };

    // Extract focus query from conversation


    // Forge wisdom button handler


    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0d1117] relative">
            {/* Header */}
            <div className="h-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-lg text-white shadow-lg shadow-purple-900/20">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white leading-tight text-sm">The Oracle</h2>
                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <BookOpen size={10} /> RAG-Enhanced Legislative Analysis
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={clearChat}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                        title="Start New Chat"
                    >
                        <Trash2 size={14} />
                        New Chat
                    </button>
                </div>

                {/* Document Context Banner */}
                {selectedDocs.length > 0 && (
                    <div className="px-6 pb-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs">
                                <div className="bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                                    {selectedDocs.length}
                                </div>
                                <span className="font-semibold text-blue-900 dark:text-blue-100">
                                    Document{selectedDocs.length !== 1 ? 's' : ''} Selected
                                </span>
                                <span className="text-blue-600 dark:text-blue-400">
                                    (Oracle limited to these sources)
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {selectedDocs.slice(0, 3).map((doc, idx) => (
                                    <span key={idx} className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                        {doc.Filename}
                                    </span>
                                ))}
                                {selectedDocs.length > 3 && (
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 px-2 py-0.5">
                                        +{selectedDocs.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Bot size={32} />
                        </div>
                        <div className="max-w-xs">
                            <h3 className="font-bold text-lg dark:text-white">Ask anything...</h3>
                            <p className="text-sm text-gray-500">I can analyze your legislative library, find specific testimony, or explain policy impacts.</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={clsx(
                        "flex gap-4 max-w-4xl mx-auto",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                        <div className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                            msg.role === 'user' ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                        )}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        <div className={clsx(
                            "flex flex-col space-y-2",
                            msg.role === 'user' ? "items-end" : "items-start"
                        )}>
                            <div className={clsx(
                                "rounded-2xl px-4 py-3 text-sm shadow-sm border",
                                msg.role === 'user'
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                            )}>
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>

                            {/* Sources Section */}
                            {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                <div className="w-full max-w-2xl">
                                    <button
                                        onClick={() => setShowSources(showSources === idx ? null : idx)}
                                        className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                                    >
                                        <BookOpen size={10} />
                                        {msg.sources.length} Supporting Sources
                                        {showSources === idx ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                    </button>

                                    {showSources === idx && (
                                        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {msg.sources.map((src, sIdx) => (
                                                <div key={sIdx} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-[11px]">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{src.file}</span>
                                                        <span className="text-purple-600 font-mono text-[9px]">{src.relevance}% Match</span>
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 italic line-clamp-2">"{src.text}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Per-Message Forge Button */}
                                    <button
                                        onClick={() => forgeFromMessage(msg)}
                                        className="mt-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all hover:scale-105 shadow-md"
                                    >
                                        <Flame size={14} />
                                        Forge This →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 max-w-4xl mx-auto items-center">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center animate-pulse">
                            <Bot size={16} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 size={16} className="animate-spin text-purple-600" />
                            Analyzing documents...
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="e.g., 'What are the main concerns from the Teachers Association about SB 1047?'"
                        className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-purple-600 dark:focus:border-purple-500 rounded-2xl px-5 py-4 text-sm focus:ring-0 outline-none shadow-sm transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="p-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:bg-gray-400 text-white rounded-2xl shadow-lg transition-all active:scale-95"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 mt-3 uppercase tracking-widest font-bold">
                    AI-Powered Search • Local Data Only • Session Private
                </p>
            </div>
        </div>
    );
}
