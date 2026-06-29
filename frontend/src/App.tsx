import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sliders, ShieldCheck, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import SystemControls from './components/SystemControls';
import SecurityOverview from './components/SecurityOverview';
import Settings from './components/Settings';

type TabType = 'chat' | 'controls' | 'security' | 'settings';

function InteractiveParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#8b5cf6' : '#ec4899',
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particleCount; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        if (mouseX !== -1000) {
          const dx = p1.x - mouseX;
          const dy = p1.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            p1.x += (dx / dist) * force * 1.5;
            p1.y += (dy / dist) * force * 1.5;
          }
        }

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();

        for (let j = i + 1; j < particleCount; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = ((100 - dist) / 100) * 0.12;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6
      }}
    />
  );
}

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
      <InteractiveParticles />
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
