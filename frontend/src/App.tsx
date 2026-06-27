import { useState } from 'react';
import { MessageSquare, Sliders, ShieldCheck, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import SystemControls from './components/SystemControls';
import SecurityOverview from './components/SecurityOverview';
import Settings from './components/Settings';

type TabType = 'chat' | 'controls' | 'security' | 'settings';

function AstraLogo() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-svg"
    >
      <defs>
        <linearGradient id="astraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer cyber ring */}
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="url(#astraGrad)"
        strokeWidth="3.5"
        strokeDasharray="24 12 8 12"
        strokeLinecap="round"
        opacity="0.85"
        className="logo-ring"
      />
      {/* Core neon star */}
      <path
        d="M50 14 L60 38 L85 38 L65 53 L72 78 L50 63 L28 78 L35 53 L15 38 L40 38 Z"
        fill="url(#astraGrad)"
        filter="url(#glow)"
      />
      {/* Center glowing star */}
      <path
        d="M50 25 L55 41 L71 41 L58 51 L63 68 L50 58 L37 68 L42 51 L29 41 L45 41 Z"
        fill="#ffffff"
        opacity="0.95"
      />
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  // Verify that the security token is loaded
  const tokenExists = !!(window as any).ASTRA_TOKEN && (window as any).ASTRA_TOKEN !== '${ASTRA_TOKEN}';

  const menuItems = [
    { id: 'chat', label: 'AI Dialogue', icon: <MessageSquare size={20} /> },
    { id: 'controls', label: 'Laptop Control', icon: <Sliders size={20} /> },
    { id: 'security', label: 'Security Audits', icon: <ShieldCheck size={20} /> },
    { id: 'settings', label: 'Brain Settings', icon: <SettingsIcon size={20} /> },
  ] as const;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'controls':
        return <SystemControls />;
      case 'security':
        return <SecurityOverview />;
      case 'settings':
        return <Settings />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel">
        <div className="logo-container">
          <AstraLogo />
          <span className="logo-text gradient-text">ASTRA</span>
        </div>

        <nav className="nav-menu">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {tokenExists ? (
            <div className="security-badge">
              <ShieldCheck size={16} />
              <span>Security Shield: Active</span>
            </div>
          ) : (
            <div className="security-badge" style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: 'var(--accent-yellow)'
            }}>
              <ShieldAlert size={16} />
              <span>Token Unsecured</span>
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
            ASTRA Personal Assistant v1.0
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="workspace-container">
        <header className="header-bar">
          <h1 className="header-title">
            {menuItems.find(t => t.id === activeTab)?.label} Workspace
          </h1>
          <div className="header-status">
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              {tokenExists ? 'Internal Link (Encrypted)' : 'Vite Dev Server (Proxied)'}
            </span>
            <div className="status-dot"></div>
          </div>
        </header>

        <div className="view-content">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}
