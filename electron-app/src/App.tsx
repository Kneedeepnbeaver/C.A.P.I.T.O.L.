import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Library } from './views/Library'
import { Analysis } from './views/Analysis'
import { Import } from './views/Import'
import { SettingsView } from './views/Settings'
import { Chat } from './views/Chat'
import { Help } from './views/Help'
import { OracleProvider } from './contexts/OracleContext'

import Welcome from './views/Welcome';

function App() {
  const [currentView, setCurrentView] = useState('library')
  const [status, setStatus] = useState<string>('Connecting to Backend...')
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(false);

  const [fullLibrary, setFullLibrary] = useState<any[]>([])

  useEffect(() => {
    // Check first-run status
    const hasRun = localStorage.getItem('has_completed_welcome');
    if (!hasRun) {
      setShowWelcome(true);
    }
  }, []);

  const completeWelcome = () => {
    localStorage.setItem('has_completed_welcome', 'true');
    setShowWelcome(false);
  };

  const refreshLibrary = async () => {
    try {
      const res = await fetch('http://localhost:5001/library');
      const data = await res.json();
      setFullLibrary(data);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    refreshLibrary();
    const interval = setInterval(refreshLibrary, 5000); // Polling for auto-sync results
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load branding and apply colors
    const applyBranding = (branding: any) => {
      if (branding.primaryColor) document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
      if (branding.accentColor) document.documentElement.style.setProperty('--color-accent', branding.accentColor);
    };

    const applyTheme = (theme: string) => {
      const root = document.documentElement;
      root.classList.remove('dark', 'high-contrast-dark', 'high-contrast-light');
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'high-contrast-dark') {
        root.classList.add('dark', 'high-contrast-dark');
      } else if (theme === 'high-contrast-light') {
        root.classList.add('high-contrast-light');
      }
    };

    const savedBranding = localStorage.getItem('branding');
    if (savedBranding) {
      try {
        applyBranding(JSON.parse(savedBranding));
      } catch (e) { console.error('Failed to load branding:', e); }
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    const handleBrandingUpdate = (e: any) => applyBranding(e.detail);
    const handleThemeUpdate = (e: any) => applyTheme(e.detail);

    window.addEventListener('branding-updated', handleBrandingUpdate);
    window.addEventListener('theme-updated', handleThemeUpdate);
    return () => {
      window.removeEventListener('branding-updated', handleBrandingUpdate);
      window.removeEventListener('theme-updated', handleThemeUpdate);
    };
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:5001/health')
        const data = await res.json()
        setStatus(`Backend: ${data.status}`)
      } catch (err) {
        setStatus(`Backend disconnected`)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  const selectedObjects = fullLibrary.filter(doc => selectedDocs.includes(doc.Filename));

  return (
    <OracleProvider>
      <div className="flex h-screen bg-white dark:bg-black text-black dark:text-gray-100 font-sans transition-colors duration-200">
        {showWelcome && <Welcome onComplete={completeWelcome} />}

        <Sidebar currentView={currentView} setCurrentView={setCurrentView} status={status} />

        <div className="flex-1 overflow-auto">
          {currentView === 'library' && (
            <Library
              selectedPaths={selectedDocs}
              onSelectionChange={setSelectedDocs}
            />
          )}
          {currentView === 'analysis' && <Analysis selectedDocs={selectedObjects} onSelectionChange={setSelectedDocs} fullLibrary={fullLibrary} />}
          {currentView === 'chat' && <Chat selectedDocs={selectedObjects} />}
          {currentView === 'import' && <Import />}
          {currentView === 'help' && <Help />}
          {currentView === 'settings' && <SettingsView />}
        </div>
      </div>
    </OracleProvider>
  )
}

export default App
