import { Library, Wand2, Upload, Settings, ChevronRight, Activity, Cpu, Sparkles, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface SidebarProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    status: string;
}

export function Sidebar({ currentView, setCurrentView }: SidebarProps) {
    const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'loading'>('loading');
    const [llmStatus, setLlmStatus] = useState<'online' | 'offline' | 'loading'>('loading');
    const [branding, setBranding] = useState({
        appTitle: 'C.A.P.I.T.O.L.',
        tagline: 'Civic Artificial Programming & Intelligence for Tracking, Organizing & Lawmaking',
        logoUrl: ''
    });

    const navItems = [
        { id: 'library', label: 'The Vault', icon: Library },
        { id: 'analysis', label: 'Minerva\'s Forge', icon: Wand2 },
        { id: 'chat', label: 'The Oracle', icon: Sparkles },
        { id: 'import', label: 'Ingestion', icon: Upload },
        { id: 'help', label: 'Help & Docs', icon: HelpCircle },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    useEffect(() => {
        // Load branding from localStorage
        const loadBranding = () => {
            const saved = localStorage.getItem('branding');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setBranding({
                        appTitle: parsed.appTitle || 'C.A.P.I.T.O.L.',
                        tagline: parsed.tagline || 'Civic Artificial Programming & Intelligence for Tracking, Organizing & Lawmaking',
                        logoUrl: parsed.logoUrl || ''
                    });
                } catch (e) {
                    console.error('Failed to load branding:', e);
                }
            }
        };

        loadBranding();

        // Listen for branding updates
        const handleBrandingUpdate = (event: any) => {
            setBranding({
                appTitle: event.detail.appTitle || 'C.A.P.I.T.O.L.',
                tagline: event.detail.tagline || 'Civic Artificial Programming & Intelligence for Tracking, Organizing & Lawmaking',
                logoUrl: event.detail.logoUrl || ''
            });
        };

        window.addEventListener('branding-updated', handleBrandingUpdate);
        return () => window.removeEventListener('branding-updated', handleBrandingUpdate);
    }, []);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('http://localhost:5001/health');
                if (res.ok) setBackendStatus('online');
                else setBackendStatus('offline');
            } catch { setBackendStatus('offline'); }

            try {
                const res = await fetch('http://localhost:5001/models');
                const data = await res.json();
                if (data && data.length > 0) setLlmStatus('online');
                else setLlmStatus('offline');
            } catch { setLlmStatus('offline'); }
        };

        checkStatus();
        const timer = setInterval(checkStatus, 15000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-20">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8" style={{ WebkitAppRegion: 'drag' } as any}>
                    {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
                    ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-accent))' }}>
                            <Activity className="text-white" size={24} />
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white leading-tight">{branding.appTitle}</h1>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{branding.tagline}</p>
                    </div>
                </div>

                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                data-view={item.id}
                                onClick={() => setCurrentView(item.id)}
                                className={clsx(
                                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={clsx(isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600")} />
                                    {item.label}
                                </div>
                                {isActive && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-wider">System Status</div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Activity size={12} className="text-blue-500" />
                                Backend
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse",
                                    backendStatus === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")}></div>
                                <span className="text-[10px] font-bold uppercase">{backendStatus}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Cpu size={12} className="text-purple-500" />
                                Ollama LLM
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse",
                                    llmStatus === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")}></div>
                                <span className="text-[10px] font-bold uppercase">{llmStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Secure Local Mode</span>
                </div>
            </div>
        </div>
    );
}
