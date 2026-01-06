import { useState, useEffect } from 'react';
import { Monitor, Moon, Sun, Contrast, Upload, Image as ImageIcon, Save, ShieldAlert, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface BrandingSettings {
    appTitle: string;
    tagline: string;
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
    appTitle: 'C.A.P.I.T.O.L.',
    tagline: 'Civic Artificial Programming & Intelligence for Tracking, Organizing & Lawmaking',
    logoUrl: '',
    primaryColor: '#d97706', // amber-600 (gold rush)
    accentColor: '#9333ea', // purple-600 (royal/classical)
};

export function SettingsView() {
    const [theme, setTheme] = useState('dark');
    const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
    const [showSaved, setShowSaved] = useState(false);

    useEffect(() => {
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);

        // Load branding from localStorage
        const savedBranding = localStorage.getItem('branding');
        if (savedBranding) {
            try {
                setBranding(JSON.parse(savedBranding));
            } catch (e) {
                console.error('Failed to load branding:', e);
            }
        }
    }, []);

    const changeTheme = (newTheme: string) => {
        setTheme(newTheme);
        const root = document.documentElement;
        root.classList.remove('dark', 'high-contrast-dark', 'high-contrast-light');

        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else if (newTheme === 'high-contrast-dark') {
            root.classList.add('dark', 'high-contrast-dark');
        } else if (newTheme === 'high-contrast-light') {
            root.classList.add('high-contrast-light');
        }

        localStorage.setItem('theme', newTheme);
        // Trigger global sync
        window.dispatchEvent(new CustomEvent('theme-updated', { detail: newTheme }));
    };

    const updateBranding = (updates: Partial<BrandingSettings>) => {
        const newBranding = { ...branding, ...updates };
        setBranding(newBranding);
    };

    const saveBranding = () => {
        localStorage.setItem('branding', JSON.stringify(branding));
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);

        // Trigger a custom event to update sidebar
        window.dispatchEvent(new CustomEvent('branding-updated', { detail: branding }));
    };

    const resetBranding = () => {
        if (window.confirm('Reset branding to defaults? This will clear your custom logo and settings.')) {
            setBranding(DEFAULT_BRANDING);
            localStorage.setItem('branding', JSON.stringify(DEFAULT_BRANDING));
            window.dispatchEvent(new CustomEvent('branding-updated', { detail: DEFAULT_BRANDING }));
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 2000);
        }
    };

    const handleLogoUpload = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (!file) {
                    console.log('No file selected');
                    return;
                }

                console.log('File selected:', file.name, file.type, file.size);

                const reader = new FileReader();
                reader.onerror = (error) => {
                    console.error('FileReader error:', error);
                    alert('Failed to read file');
                };

                reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    if (!dataUrl) {
                        console.error('No data URL from FileReader');
                        alert('Failed to read image data');
                        return;
                    }

                    console.log('FileReader complete, data URL length:', dataUrl.length);

                    const img = new Image();
                    img.crossOrigin = 'anonymous'; // Allow canvas to read image

                    img.onerror = (err) => {
                        console.error('Image load error:', err);
                        console.error('Data URL prefix:', dataUrl.substring(0, 50));
                        alert('Failed to load image. Try a different image format (JPG or PNG).');
                    };

                    img.onload = () => {
                        console.log('Image loaded successfully:', img.width, 'x', img.height);

                        try {
                            // Resize to 200x200
                            const canvas = document.createElement('canvas');
                            const size = 200;
                            canvas.width = size;
                            canvas.height = size;
                            const ctx = canvas.getContext('2d');

                            if (!ctx) {
                                throw new Error('Failed to get canvas context');
                            }

                            // Draw image centered and cropped
                            const scale = Math.max(size / img.width, size / img.height);
                            const x = (size - img.width * scale) / 2;
                            const y = (size - img.height * scale) / 2;
                            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                            // Convert to base64
                            const resizedDataUrl = canvas.toDataURL('image/png', 0.9);
                            console.log('Image resized, data URL length:', resizedDataUrl.length);

                            // Update branding state
                            const newBranding = { ...branding, logoUrl: resizedDataUrl };
                            setBranding(newBranding);

                            // Auto-save to localStorage
                            localStorage.setItem('branding', JSON.stringify(newBranding));
                            console.log('Branding saved to localStorage');

                            // Trigger sidebar update
                            window.dispatchEvent(new CustomEvent('branding-updated', { detail: newBranding }));

                            // Show success message
                            setShowSaved(true);
                            setTimeout(() => setShowSaved(false), 2000);
                        } catch (err) {
                            console.error('Canvas processing error:', err);
                            alert('Failed to process image: ' + err);
                        }
                    };

                    // Set the data URL as image source
                    img.src = dataUrl;
                };

                reader.readAsDataURL(file);
            };
            input.click();
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload logo: ' + err);
        }
    };

    const applyColors = () => {
        // Apply colors to CSS custom properties
        document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
        document.documentElement.style.setProperty('--color-accent', branding.accentColor);
    };

    useEffect(() => {
        applyColors();
    }, [branding.primaryColor, branding.accentColor]);


    const ThemeOption = ({ label, icon: Icon, active, onClick, extraClass }: any) => (
        <button onClick={onClick}
            className={clsx(
                "relative group flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
                active
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800",
                extraClass
            )}>
            <div className={clsx("p-3 rounded-full transition-colors", active ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-blue-500")}>
                <Icon size={24} />
            </div>
            <span className={clsx("font-medium text-sm", active ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-300")}>{label}</span>
            {active && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500"></div>}
        </button>
    );

    const resetVault = async () => {
        if (!confirm("CAUTION: This will permanently delete all generated content and re-calculate your RAG index. Documents in your library will NOT be deleted, but the index will be rebuilt from scratch.\n\nContinue?")) return;

        try {
            const res = await fetch('http://localhost:5001/reset', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                alert("✨ Minerva is Ready: The vault has been cleared and your documents have been re-indexed.");
            } else {
                throw new Error(data.error || "Reset failed");
            }
        } catch (err) {
            alert("Reset failed: " + err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black/95 text-gray-900 dark:text-white p-8 lg:p-12 max-w-6xl mx-auto w-full overflow-y-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Vault Configuration</h2>
                <p className="text-gray-500 dark:text-gray-400">Tailor your Golden State mining experience and branding.</p>
            </div>

            <div className="grid gap-8">
                {/* Branding Section */}
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                        <ImageIcon size={16} /> Branding
                    </h3>
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Logo / Profile Picture</label>
                            <div className="flex items-center gap-4">
                                {branding.logoUrl ? (
                                    <img src={branding.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                                        <ImageIcon className="text-white" size={32} />
                                    </div>
                                )}
                                <button onClick={handleLogoUpload} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                                    <Upload size={16} /> Upload Logo
                                </button>
                                {branding.logoUrl && (
                                    <button onClick={() => updateBranding({ logoUrl: '' })} className="text-sm text-red-600 hover:text-red-700">
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* App Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Application Title</label>
                            <input
                                type="text"
                                value={branding.appTitle}
                                onChange={(e) => updateBranding({ appTitle: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Legislate"
                            />
                        </div>

                        {/* Tagline */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Tagline</label>
                            <input
                                type="text"
                                value={branding.tagline}
                                onChange={(e) => updateBranding({ tagline: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Studio v1.0"
                            />
                        </div>

                        {/* Save and Reset Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <button onClick={saveBranding} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                                <Save size={16} /> Save Branding
                            </button>
                            <button onClick={resetBranding} className="flex items-center gap-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                                <Trash2 size={16} /> Reset to Defaults
                            </button>
                            {showSaved && <span className="text-sm text-green-600 dark:text-green-400">✓ Saved successfully!</span>}
                        </div>
                    </div>
                </section>

                {/* Appearance Section */}
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                        <Monitor size={16} /> Appearance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ThemeOption
                            label="Light"
                            icon={Sun}
                            active={theme === 'light'}
                            onClick={() => changeTheme('light')}
                        />
                        <ThemeOption
                            label="Dark"
                            icon={Moon}
                            active={theme === 'dark'}
                            onClick={() => changeTheme('dark')}
                        />
                        <ThemeOption
                            label="High Contrast"
                            icon={Contrast}
                            active={theme === 'high-contrast-light'}
                            onClick={() => changeTheme('high-contrast-light')}
                            extraClass="contrast-125 saturate-0"
                        />
                        <ThemeOption
                            label="HC Dark"
                            icon={Contrast}
                            active={theme === 'high-contrast-dark'}
                            onClick={() => changeTheme('high-contrast-dark')}
                            extraClass="bg-black border-gray-600"
                        />
                    </div>
                </section>

                {/* Danger Zone */}
                <div className="bg-red-50/30 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-xl">
                            <ShieldAlert size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-900 dark:text-red-100 uppercase tracking-tight">Danger Zone</h3>
                            <p className="text-sm text-red-600/70 dark:text-red-400/70">Wipe the slate clean and restart your mining operation.</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-white dark:bg-black/40 border border-red-200 dark:border-red-900/50 rounded-xl shadow-sm">
                        <div className="max-w-md">
                            <div className="font-bold text-gray-900 dark:text-white mb-1">Reset Vault & Reindex</div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Use this if you're seeing incorrect results or want to clear all
                                generated analysis logs. Your library documents will remain safe,
                                but the Minerva RAG index will be rebuilt from scratch.
                            </p>
                        </div>
                        <button
                            onClick={resetVault}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-red-900/20"
                        >
                            <Trash2 size={16} />
                            Nuke the Vault
                        </button>
                    </div>
                </div>

                {/* About Section */}
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">About</h3>
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="font-bold text-lg">C.A.P.I.T.O.L. Analysis Engine</div>
                            <div className="text-sm text-gray-500">Version 1.1.0 (Civic Intelligence Edition)</div>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                            <div>Powered by Ollama</div>
                            <div>Local Processing Only</div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
