import { useState } from 'react';
import { Terminal, FolderOpen, Wand2, CheckCircle, AlertTriangle, Play } from 'lucide-react';

export default function SystemControls() {
  const [vscodePath, setVscodePath] = useState('');
  const [terminalPath, setTerminalPath] = useState('');
  const [shellType, setShellType] = useState('cmd');
  
  // Status states
  const [vscodeStatus, setVscodeStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [organizeStatus, setOrganizeStatus] = useState<{ success: boolean; moved: string[]; errors: string[] } | null>(null);
  const [organizing, setOrganizing] = useState(false);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'X-ASTRA-Token': (window as any).ASTRA_TOKEN || ''
    };
  };

  const handleOpenVsCode = async (pathOverride?: string) => {
    const targetPath = pathOverride || vscodePath;
    if (!targetPath.trim()) {
      setVscodeStatus({ success: false, msg: 'Please provide or select a path.' });
      return;
    }
    
    setVscodeStatus(null);
    try {
      const res = await fetch('/api/system/vscode', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ path: targetPath })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVscodeStatus({ success: true, msg: `VS Code opened successfully at ${targetPath}` });
      } else {
        setVscodeStatus({ success: false, msg: data.error || 'Failed to open VS Code at target path.' });
      }
    } catch (err: any) {
      setVscodeStatus({ success: false, msg: `Error: ${err.message}` });
    }
  };

  const handleOpenTerminal = async (pathOverride?: string) => {
    const targetPath = pathOverride || terminalPath;
    setTerminalStatus(null);
    try {
      const res = await fetch('/api/system/terminal', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ path: targetPath, shell: shellType })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTerminalStatus({ success: true, msg: `Terminal opened successfully.` });
      } else {
        setTerminalStatus({ success: false, msg: 'Failed to launch terminal process.' });
      }
    } catch (err: any) {
      setTerminalStatus({ success: false, msg: `Error: ${err.message}` });
    }
  };

  const handleOrganizeDesktop = async () => {
    setOrganizing(true);
    setOrganizeStatus(null);
    try {
      const res = await fetch('/api/system/organize-desktop', {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setOrganizeStatus({
          success: data.success,
          moved: data.moved || [],
          errors: data.errors || []
        });
      } else {
        setOrganizeStatus({ success: false, moved: [], errors: ['Server returned an error organizing desktop.'] });
      }
    } catch (err: any) {
      setOrganizeStatus({ success: false, moved: [], errors: [`Network Error: ${err.message}`] });
    } finally {
      setOrganizing(false);
    }
  };

  // Quick picks
  const quickPicks = [
    { name: "ASTRA Workspace", path: "C:\\Users\\User\\Desktop\\ProjectClge\\ASTRA" },
    { name: "User Home", path: "C:\\Users\\User" },
    { name: "Desktop", path: "C:\\Users\\User\\Desktop" },
    { name: "Documents", path: "C:\\Users\\User\\Documents" },
    { name: "Downloads", path: "C:\\Users\\User\\Downloads" }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      
      {/* Upper Grid: VS Code & Terminal Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* VS Code Card */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FolderOpen size={24} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>VS Code Workspace Launcher</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.4 }}>
            Open any local folder or project on your laptop instantly in a new VS Code window.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Directory Path</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="e.g. C:\Users\User\Desktop\ProjectClge\ASTRA"
                value={vscodePath}
                onChange={(e) => setVscodePath(e.target.value)}
                style={{
                  flexGrow: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-light)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  color: 'white',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px'
                }}
              />
              <button 
                onClick={() => handleOpenVsCode()}
                className="glow-button"
                style={{ padding: '12px 24px', borderRadius: '8px' }}
              >
                Launch
              </button>
            </div>
          </div>

          {/* Quick Picks for VS Code */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickPicks.map((pick, i) => (
              <button
                key={i}
                onClick={() => {
                  setVscodePath(pick.path);
                  handleOpenVsCode(pick.path);
                }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-light)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
              >
                + {pick.name}
              </button>
            ))}
          </div>

          {vscodeStatus && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: vscodeStatus.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: vscodeStatus.success ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '13px',
              color: vscodeStatus.success ? 'var(--accent-green)' : 'var(--accent-red)'
            }}>
              {vscodeStatus.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              <span>{vscodeStatus.msg}</span>
            </div>
          )}
        </div>

        {/* Terminal Card */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Terminal size={24} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Terminal Window Opener</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.4 }}>
            Launch a Command Prompt or PowerShell session initialized at a target path.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Directory Path</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="e.g. C:\Users\User (Leave blank for default)"
                value={terminalPath}
                onChange={(e) => setTerminalPath(e.target.value)}
                style={{
                  flexGrow: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-light)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  color: 'white',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px'
                }}
              />
              <select
                value={shellType}
                onChange={(e) => setShellType(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-light)',
                  padding: '12px',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="cmd">CMD</option>
                <option value="powershell">PowerShell</option>
              </select>
              <button 
                onClick={() => handleOpenTerminal()}
                className="glow-button"
                style={{ padding: '12px 24px', borderRadius: '8px' }}
              >
                Open
              </button>
            </div>
          </div>

          {/* Quick Picks for Terminal */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickPicks.map((pick, i) => (
              <button
                key={i}
                onClick={() => {
                  setTerminalPath(pick.path);
                  handleOpenTerminal(pick.path);
                }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-light)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
              >
                + {pick.name}
              </button>
            ))}
          </div>

          {terminalStatus && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: terminalStatus.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: terminalStatus.success ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '13px',
              color: terminalStatus.success ? 'var(--accent-green)' : 'var(--accent-red)'
            }}>
              {terminalStatus.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              <span>{terminalStatus.msg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Organizer Card */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wand2 size={26} style={{ color: 'var(--accent-secondary)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Desktop File Organizer</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                Cleans up messy stray files on your Desktop by grouping them into matching directories (Images, Documents, Archives, Audio, etc.).
              </p>
            </div>
          </div>
          <button
            onClick={handleOrganizeDesktop}
            disabled={organizing}
            className="glow-button"
            style={{ 
              padding: '14px 28px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
            }}
          >
            <Play size={16} />
            {organizing ? 'Organizing Desktop...' : 'Run Clean Up'}
          </button>
        </div>

        {organizeStatus && (
          <div style={{ 
            background: 'rgba(0,0,0,0.15)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '10px', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: organizeStatus.success ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
              {organizeStatus.success ? 'Desktop Cleanup Finished!' : 'Desktop Cleanup Complete with warnings'}
            </h4>
            
            {organizeStatus.moved.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                No messy files were found on the Desktop. Everything was already neat!
              </div>
            )}

            {organizeStatus.moved.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Files Relocated ({organizeStatus.moved.length}):</span>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'none', paddingLeft: 0 }}>
                  {organizeStatus.moved.map((file, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'var(--accent-green)' }}>✓</span>
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {organizeStatus.errors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-red)' }}>Failures / Locked Files ({organizeStatus.errors.length}):</span>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px', listStyleType: 'none', paddingLeft: 0 }}>
                  {organizeStatus.errors.map((err, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-red)', display: 'flex', gap: '8px' }}>
                      <span>⚠</span>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
