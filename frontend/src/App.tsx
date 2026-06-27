import { useState } from 'react';
import { MessageSquare, Sliders, ShieldCheck, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import SystemControls from './components/SystemControls';
import SecurityOverview from './components/SecurityOverview';
import Settings from './components/Settings';

type TabType = 'chat' | 'controls' | 'security' | 'settings';

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
          <div className="logo-icon">A</div>
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
