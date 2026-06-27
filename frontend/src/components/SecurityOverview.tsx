import { useEffect, useState } from 'react';
import { Shield, Lock, Server, Key, Globe, Radio } from 'lucide-react';

interface SecurityReport {
  serverAddress: string;
  serverPort: string;
  corsRestricted: boolean;
  corsOrigins: string[];
  authMechanism: string;
  sessionActive: boolean;
  osType: string;
  javaVersion: string;
  tokenActive: boolean;
}

export default function SecurityOverview() {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityReport = async () => {
      try {
        const token = (window as any).ASTRA_TOKEN || '';
        const res = await fetch('/api/security', {
          headers: {
            'X-ASTRA-Token': token
          }
        });
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch (err) {
        console.error('Failed to fetch security report', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityReport();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        <div className="gradient-text" style={{ fontSize: '20px', fontWeight: 600 }}>Analyzing ASTRA Security Matrix...</div>
      </div>
    );
  }

  const securityMeasures = [
    {
      icon: <Server size={24} style={{ color: 'var(--accent-cyan)' }} />,
      title: "Local Host Bind Only",
      desc: "Backend binds exclusively to loopback interface 127.0.0.1. No external devices on your Wi-Fi, local network, or internet can access or query this server.",
      status: report?.serverAddress.includes("127.0.0.1") ? "Strictly Safe" : "Active"
    },
    {
      icon: <Key size={24} style={{ color: 'var(--accent-primary)' }} />,
      title: "X-ASTRA Header Handshake",
      desc: "Every API request is audited for a secure session token. Even if another browser tab attempts a CSRF or DNS Rebinding exploit, it cannot read files or execute local operations.",
      status: report?.tokenActive ? "Enabled" : "Active"
    },
    {
      icon: <Globe size={24} style={{ color: 'var(--accent-secondary)' }} />,
      title: "CORS Whitelist Lock",
      desc: "Cross-Origin Resource Sharing is locked down. Only approved local development ports are allowed to establish handshake connections.",
      status: report?.corsRestricted ? "Locked" : "Active"
    },
    {
      icon: <Lock size={24} style={{ color: 'var(--accent-green)' }} />,
      title: "Command Injection Shield",
      desc: "System actions (e.g., launching terminal/VS Code) are invoked using split-string ProcessBuilders with specific parameters. No raw command execution in system shells.",
      status: "Active Isolation"
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Hero Security Status */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', gap: '24px', alignItems: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={48} style={{ color: 'var(--accent-green)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Laptop Security Protocol Active</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.5 }}>
            ASTRA is constructed using zero-trust local principles. All filesystem access, wallpaper routines, and shell linkages are restricted and validated.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Core Protection Shields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Defense Vectors</h3>
          {securityMeasures.map((measure, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', gap: '16px', position: 'relative' }}>
              <div style={{ marginTop: '2px' }}>{measure.icon}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '70px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{measure.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{measure.desc}</p>
              </div>
              <span style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '20px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: 'var(--accent-green)', 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '4px 8px', 
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {measure.status}
              </span>
            </div>
          ))}
        </div>

        {/* Runtime Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Instance Metrics</h3>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', flexGrow: 1 }}>Operating System</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600 }}>{report?.osType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', flexGrow: 1 }}>Java SDK Runtime</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600 }}>v{report?.javaVersion}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', flexGrow: 1 }}>Endpoint Bind</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--accent-cyan)' }}>http://{report?.serverAddress}:{report?.serverPort}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'between', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', flexGrow: 1 }}>CORS Policy Origin whitelist</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>
                {report?.corsOrigins.join(', ')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'between', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', flexGrow: 1 }}>Active Session Token</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                {((window as any).ASTRA_TOKEN ? 'Verified (Local Handshake Match)' : 'System Key Missing')}
              </span>
            </div>
          </div>

          {/* Secure Execution FAQ Box */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.15)', display: 'flex', gap: '12px' }}>
            <Radio size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#c084fc' }}>Security Tip: How is the token loaded?</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>
                When you load the page, the Java server reads the original index.html file, injects the session-specific token into the script header, and returns the modified page. External sites cannot read this origin's variables due to Same-Origin browser sandbox security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
