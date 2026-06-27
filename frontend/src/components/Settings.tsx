import { useEffect, useState } from 'react';
import { Save, Key, Info, Database } from 'lucide-react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoadedFromEnv, setIsLoadedFromEnv] = useState(false);
  const [astraDir, setAstraDir] = useState('');
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const token = (window as any).ASTRA_TOKEN || '';
        const res = await fetch('/api/config', {
          headers: {
            'X-ASTRA-Token': token
          }
        });
        if (res.ok) {
          const data = await res.json();
          setHasApiKey(data.hasApiKey);
          setAstraDir(data.astraDir || '');
          setIsLoadedFromEnv(!!data.isLoadedFromEnv);
          if (data.hasApiKey) {
            setApiKey(data.geminiApiKey || '');
          }
        }
      } catch (err) {
        console.error('Failed to load settings config from backend', err);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoadedFromEnv) return;
    setSaveStatus(null);

    try {
      const token = (window as any).ASTRA_TOKEN || '';
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ASTRA-Token': token
        },
        body: JSON.stringify({ geminiApiKey: apiKey })
      });

      if (res.ok) {
        setSaveStatus({ success: true, msg: 'API Key saved successfully!' });
        setHasApiKey(apiKey.trim().length > 0);
      } else {
        setSaveStatus({ success: false, msg: 'Failed to save configuration settings.' });
      }
    } catch (err: any) {
      setSaveStatus({ success: false, msg: `Error: ${err.message}` });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      
      {/* Settings Form */}
      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Key size={24} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>AI Integration Setup</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
          ASTRA connects directly to Google Gemini models to analyze your requests, compile desktop organization summaries, and search wallpapers. Enter your personal Gemini API key below to unlock this assistant's full brain power.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Google Gemini API Key</label>
            {isLoadedFromEnv && (
              <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                Loaded from .env File (Read-Only)
              </span>
            )}
          </div>
          <input
            type="password"
            placeholder={isLoadedFromEnv ? "••••••••••••••••••••••••••••••••••••••••" : hasApiKey ? "••••••••••••••••••••••••••••••••••••••••" : "AIzaSy..."}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoadedFromEnv}
            style={{
              background: isLoadedFromEnv ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-light)',
              padding: '14px 16px',
              borderRadius: '8px',
              color: isLoadedFromEnv ? 'var(--text-muted)' : 'white',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              cursor: isLoadedFromEnv ? 'not-allowed' : 'text'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="submit"
            disabled={isLoadedFromEnv}
            className="glow-button"
            style={{ 
              padding: '12px 28px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              opacity: isLoadedFromEnv ? 0.4 : 1,
              cursor: isLoadedFromEnv ? 'not-allowed' : 'pointer'
            }}
          >
            <Save size={16} />
            {isLoadedFromEnv ? 'Locked' : 'Save Key'}
          </button>

          {saveStatus && (
            <span style={{ 
              fontSize: '13px', 
              color: saveStatus.success ? 'var(--accent-green)' : 'var(--accent-red)',
              fontWeight: 500
            }}>
              {saveStatus.msg}
            </span>
          )}
        </div>

        {/* Info Guide */}
        <div style={{ 
          background: 'rgba(6, 182, 212, 0.05)', 
          border: '1px solid rgba(6, 182, 212, 0.15)', 
          borderRadius: '10px', 
          padding: '16px',
          display: 'flex',
          gap: '12px'
        }}>
          <Info size={20} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#22d3ee' }}>How to get a free API Key?</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.4 }}>
              Go to the <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Google AI Studio Console</a>, click "Get API Key", choose a project, and copy-paste the key. Free tiers provide sufficient quotas for personal daily tasks.
            </p>
          </div>
        </div>
      </form>

      {/* Directory Settings */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={24} style={{ color: 'var(--accent-secondary)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Data Storage Locations</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
          To keep your settings protected and isolated, ASTRA stores configurations, session cache, and downloaded wallpapers in a hidden directory inside your Windows user directory.
        </p>

        <div style={{ 
          background: 'rgba(0,0,0,0.15)', 
          border: '1px solid var(--border-light)', 
          borderRadius: '8px', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Hidden Configuration Root</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-cyan)' }}>{astraDir || 'C:\\Users\\User\\.astra'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Settings File</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>{astraDir ? `${astraDir}\\config.json` : 'C:\\Users\\User\\.astra\\config.json'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
