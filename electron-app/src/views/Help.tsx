import { useState } from 'react';
import { HelpCircle, BookOpen, Shield, Rocket, Info, ExternalLink, Library, Wand2, Sparkles, Upload, Settings as SettingsIcon, Database, Zap, Lock, Code, Heart } from 'lucide-react';
import clsx from 'clsx';

export function Help() {
    const [activeTab, setActiveTab] = useState('quickstart');

    const tabs = [
        { id: 'quickstart', label: 'Quick Start', icon: Rocket },
        { id: 'guide', label: 'User Guide', icon: BookOpen },
        { id: 'privacy', label: 'Privacy & Security', icon: Shield },
        { id: 'ollama', label: 'Ollama Setup', icon: HelpCircle },
        { id: 'about', label: 'About', icon: Info },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0d1117]">
            {/* Header */}
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 bg-white dark:bg-gray-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg">
                        <HelpCircle size={18} />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white leading-tight text-sm">Help & Documentation</h2>
                        <p className="text-[10px] text-gray-500">Everything you need to know about C.A.P.I.T.O.L.</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
                <div className="flex gap-1 px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === tab.id
                                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            )}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {activeTab === 'quickstart' && <QuickStart />}
                    {activeTab === 'guide' && <UserGuide />}
                    {activeTab === 'privacy' && <PrivacySecurity />}
                    {activeTab === 'ollama' && <OllamaSetup />}
                    {activeTab === 'about' && <About />}
                </div>
            </div>
        </div>
    );
}

function QuickStart() {
    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                    <Rocket size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Welcome to C.A.P.I.T.O.L.
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Your private, local AI assistant for legislative analysis
                </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-600 p-3 rounded-lg text-white">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">100% Private</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Your data never leaves your computer</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-4">
                        <div className="bg-green-600 p-3 rounded-lg text-white">
                            <Rocket size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-green-900 dark:text-green-100 mb-1">Fast & Offline</h3>
                            <p className="text-sm text-green-700 dark:text-green-300">No internet required after setup</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-4">
                        <div className="bg-purple-600 p-3 rounded-lg text-white">
                            <span className="text-2xl">💰</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-1">No API Costs</h3>
                            <p className="text-sm text-purple-700 dark:text-purple-300">Unlimited AI without subscriptions</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-4">
                        <div className="bg-amber-600 p-3 rounded-lg text-white">
                            <span className="text-2xl">🎯</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Full Control</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300">Your documents, your AI, your rules</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Start Steps */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>⚡</span> 5-Minute Quick Start
                    </h2>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {/* Step 1 */}
                    <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                1
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Install Ollama</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    C.A.P.I.T.O.L. requires Ollama to run AI models locally. See the <strong>Ollama Setup</strong> tab for detailed instructions.
                                </p>
                                <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm">
                                    <div className="text-green-400">$ ollama pull llama3.2:3b</div>
                                    <div className="text-green-400">$ ollama serve</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                2
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Import Your Documents</h3>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-600 dark:text-purple-400">→</span>
                                        Click <strong>Ingestion</strong> in the sidebar
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-600 dark:text-purple-400">→</span>
                                        Click <strong>Browse Files</strong> or <strong>Browse Folder</strong>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-600 dark:text-purple-400">→</span>
                                        Select your legislative documents (PDF, TXT, DOCX, VTT)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-600 dark:text-purple-400">→</span>
                                        Click <strong>Import & Process</strong>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                3
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Explore Your Documents</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    Go to <strong>The Vault</strong> (Library) to:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="text-green-600">✓</span> Browse all documents
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="text-green-600">✓</span> Search your collection
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="text-green-600">✓</span> View metadata
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="text-green-600">✓</span> Select for analysis
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                                4
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ask Questions</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Use <strong>The Oracle</strong> (Chat) to ask questions about your documents and get AI-powered answers with source citations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center text-white font-bold">
                                5
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Generate Artifacts</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Go to <strong>Minerva's Forge</strong> (Analysis) to generate Executive Summaries, Talking Points, Press Releases, and more.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
                    <span>💡</span> Pro Tips
                </h3>
                <div className="grid gap-3">
                    <div className="flex items-start gap-3">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">→</span>
                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                            <strong>Use Minerva's Lens:</strong> The focus query helps AI understand what you're looking for
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">→</span>
                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                            <strong>Select Relevant Docs:</strong> Choose specific documents for more targeted analysis
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">→</span>
                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                            <strong>Forge from Oracle:</strong> Click "Forge This →" under AI responses to transfer context
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserGuide() {
    const features = [
        {
            title: 'The Vault',
            subtitle: 'Library',
            icon: Library,
            color: 'blue',
            items: [
                { label: 'Document Browser', desc: 'View all imported documents with metadata' },
                { label: 'Unified Search', desc: 'Search across documents and chunks simultaneously' },
                { label: 'Chunk Explorer', desc: 'View document chunks with relevance scores' },
                { label: 'Document Selection', desc: 'Choose specific documents for analysis' },
                { label: 'Consult Minerva', desc: 'Transfer search results to Minerva\'s Forge' },
            ]
        },
        {
            title: 'Minerva\'s Forge',
            subtitle: 'Analysis',
            icon: Wand2,
            color: 'purple',
            items: [
                { label: 'Minerva\'s Lens', desc: 'Guide AI to specific topics with focus queries' },
                { label: 'Artifact Types', desc: 'Executive Summary, Talking Points, Press Release, etc.' },
                { label: 'Tone Control', desc: 'Professional, Persuasive, Analytical, or Neutral' },
                { label: 'Custom Instructions', desc: 'Additional guidance for AI generation' },
                { label: 'RAG Configuration', desc: 'Adjust chunk count and relevance threshold' },
            ]
        },
        {
            title: 'The Oracle',
            subtitle: 'Chat',
            icon: Sparkles,
            color: 'amber',
            items: [
                { label: 'Context-Aware Chat', desc: 'Ask questions about your documents' },
                { label: 'Source Citations', desc: 'See which documents informed each answer' },
                { label: 'Document Filtering', desc: 'Limit chat to specific documents' },
                { label: 'Forge This', desc: 'Transfer specific responses to Minerva\'s Forge' },
                { label: 'New Chat', desc: 'Start fresh conversations anytime' },
            ]
        },
        {
            title: 'Ingestion',
            subtitle: 'Import',
            icon: Upload,
            color: 'green',
            items: [
                { label: 'PDF Documents', desc: 'Import legislative bills and reports' },
                { label: 'Text Files', desc: 'Plain text documents (.txt)' },
                { label: 'Word Documents', desc: 'Microsoft Word files (.docx)' },
                { label: 'Video Transcripts', desc: 'WebVTT subtitle files (.vtt)' },
                { label: 'Auto-Processing', desc: 'Chunking, embeddings, and indexing' },
            ]
        },
    ];

    const colorMap: Record<string, { bg: string; border: string; icon: string; text: string }> = {
        blue: { bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-600', text: 'text-blue-900 dark:text-blue-100' },
        purple: { bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-600', text: 'text-purple-900 dark:text-purple-100' },
        amber: { bg: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-600', text: 'text-amber-900 dark:text-amber-100' },
        green: { bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20', border: 'border-green-200 dark:border-green-800', icon: 'bg-green-600', text: 'text-green-900 dark:text-green-100' },
    };

    return (
        <div className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                    <BookOpen size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
                    User Guide
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Complete documentation for all features
                </p>
            </div>

            {/* Features */}
            {features.map((feature, idx) => {
                const colors = colorMap[feature.color];
                const Icon = feature.icon;

                return (
                    <div key={idx} className={`bg-gradient-to-br ${colors.bg} rounded-xl border ${colors.border} overflow-hidden`}>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`${colors.icon} p-3 rounded-lg text-white`}>
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold ${colors.text}`}>{feature.title}</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.subtitle}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {feature.items.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 bg-white/50 dark:bg-black/20 rounded-lg p-3">
                                        <span className={colors.text}>✓</span>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{item.label}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Settings Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-slate-600 p-3 rounded-lg text-white">
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Customize your experience</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                        <div className="font-semibold text-gray-900 dark:text-white">Branding</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Upload logo, change title & tagline</div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                        <div className="font-semibold text-gray-900 dark:text-white">Appearance</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Light, Dark, or High Contrast themes</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PrivacySecurity() {
    return (
        <div className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                    <Shield size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Privacy & Security
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Your data stays local. Always.
                </p>
            </div>

            {/* Main Promise */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-300 dark:border-green-700 p-8 text-center">
                <Lock size={48} className="mx-auto mb-4 text-green-600 dark:text-green-400" />
                <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">100% Local Processing</h2>
                <p className="text-green-700 dark:text-green-300 text-lg">
                    C.A.P.I.T.O.L. runs entirely on your computer. Nothing is sent to the cloud.
                </p>
            </div>

            {/* How It Works */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white">How It Works</h2>
                </div>
                <div className="p-6 space-y-4">
                    {[
                        { icon: Database, title: 'Documents stored locally only', desc: 'Files never leave your machine' },
                        { icon: Zap, title: 'AI models run on your machine', desc: 'Powered by Ollama' },
                        { icon: Shield, title: 'No cloud uploads or API calls', desc: '100% offline capable' },
                        { icon: Lock, title: 'No telemetry or tracking', desc: 'We don\'t collect any data' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                            <div className="bg-green-600 p-2 rounded-lg text-white flex-shrink-0">
                                <item.icon size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">{item.title}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Perfect For */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { emoji: '📜', label: 'Sensitive legislative documents' },
                    { emoji: '🏛️', label: 'Confidential policy analysis' },
                    { emoji: '🔬', label: 'Private research' },
                    { emoji: '⚖️', label: 'Compliance-sensitive work' },
                    { emoji: '🎓', label: 'Academic research' },
                    { emoji: '🔐', label: 'Secure environments' },
                ].map((item, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
                        <div className="text-3xl mb-2">{item.emoji}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                    </div>
                ))}
            </div>

            {/* Compliance */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4">Compliance Benefits</h3>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'GDPR', desc: 'Data never crosses borders' },
                        { label: 'HIPAA', desc: 'No third-party processors' },
                        { label: 'FERPA', desc: 'Educational records stay private' },
                        { label: 'Public Records', desc: 'Maintain chain of custody' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400">✓</span>
                            <div>
                                <div className="font-bold text-blue-900 dark:text-blue-100">{item.label}</div>
                                <div className="text-sm text-blue-700 dark:text-blue-300">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function OllamaSetup() {
    return (
        <div className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                    <HelpCircle size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Ollama Setup
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Run AI models locally on your computer
                </p>
            </div>

            {/* What is Ollama */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
                <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-3">What is Ollama?</h2>
                <p className="text-indigo-800 dark:text-indigo-200">
                    Ollama is a free, open-source tool that lets you run large language models (LLMs) locally on your computer.
                    No internet required, no API costs, complete privacy.
                </p>
            </div>

            {/* Installation Steps */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white">Installation</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">macOS & Linux</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                            Visit <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ollama.com/download <ExternalLink className="inline" size={14} /></a> or use terminal:
                        </p>
                        <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm">
                            <div className="text-green-400">$ curl -fsSL https://ollama.com/install.sh | sh</div>
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Windows</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Visit <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ollama.com/download <ExternalLink className="inline" size={14} /></a>,
                            click "Download for Windows", and run the installer.
                        </p>
                    </div>
                </div>
            </div>

            {/* Model Recommendations */}
            <div className="grid gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">⭐</span>
                        <h3 className="text-xl font-bold text-green-900 dark:text-green-100">Recommended: Llama 3.2 (3B)</h3>
                    </div>
                    <p className="text-green-700 dark:text-green-300 mb-3">Fast, efficient, great for most legislative analysis</p>
                    <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm">
                        <div className="text-green-400">$ ollama pull llama3.2:3b</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3">Alternative: Phi-3 Mini</h3>
                    <p className="text-blue-700 dark:text-blue-300 mb-3">Smaller, faster, good for quick queries</p>
                    <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm">
                        <div className="text-green-400">$ ollama pull phi3:mini</div>
                    </div>
                </div>
            </div>

            {/* Start Server */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
                <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-3">Start Ollama Server</h3>
                <p className="text-amber-700 dark:text-amber-300 mb-3">Run this command and keep the terminal open:</p>
                <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm mb-3">
                    <div className="text-green-400">$ ollama serve</div>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ <strong>Important:</strong> Keep this terminal window open while using C.A.P.I.T.O.L.
                </p>
            </div>

            {/* System Requirements */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-600 to-gray-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white">System Requirements</h2>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Model</th>
                                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">RAM</th>
                                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Storage</th>
                                    <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Speed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { model: 'Phi-3 Mini', ram: '8 GB', storage: '2.3 GB', speed: '⚡⚡⚡' },
                                    { model: 'Llama 3.2 3B', ram: '16 GB', storage: '2.0 GB', speed: '⚡⚡' },
                                    { model: 'Llama 3.1 8B', ram: '32 GB', storage: '4.7 GB', speed: '⚡' },
                                ].map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-3 px-4 text-gray-900 dark:text-white">{row.model}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{row.ram}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{row.storage}</td>
                                        <td className="py-3 px-4">{row.speed}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function About() {
    return (
        <div className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                    <Info size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
                    About C.A.P.I.T.O.L.
                </h1>
            </div>

            {/* Mission Statement */}
            <div className="bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/20 dark:to-purple-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Civic Artificial Programming & Intelligence<br />
                    for Tracking, Organizing & Lawmaking
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    A privacy-focused, local-first AI assistant for legislative analysis
                </p>
            </div>

            {/* Version Info */}
            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: 'Version', value: '1.0.0' },
                    { label: 'License', value: 'MIT (Open Source)' },
                    { label: 'Platform', value: 'Electron + React + Python' },
                    { label: 'AI Runtime', value: 'Ollama' },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                        <div className="font-bold text-gray-900 dark:text-white">{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Creator */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3">Created By</h3>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Dylan Carpowich</p>
                <a href="https://artsbydylan.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    artsbydylan.com <ExternalLink size={14} />
                </a>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Vibe-coded with AI software from Google and Microsoft
                </p>
            </div>

            {/* Tech Stack */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-600 to-gray-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Code size={24} /> Technology Stack
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                    {[
                        { label: 'Frontend', value: 'React + TypeScript + Vite' },
                        { label: 'Desktop', value: 'Electron' },
                        { label: 'Backend', value: 'Python + Flask' },
                        { label: 'AI', value: 'Ollama (Llama, Phi-3)' },
                        { label: 'RAG', value: 'Sentence Transformers + FAISS' },
                        { label: 'UI', value: 'Tailwind CSS' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400">→</span>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-200 dark:border-pink-800 p-8 text-center">
                <Heart size={48} className="mx-auto mb-4 text-pink-600 dark:text-pink-400" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Made with ❤️ for legislative professionals and the public good
                </p>
            </div>
        </div>
    );
}
