import { useState, useEffect } from 'react';
import { SecurityEvent } from '../utils/aiEngine';
import { Activity, Globe, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

interface DashboardProps {
  alerts: SecurityEvent[];
  onAnalyze: (logText: string) => void;
  setActiveTab: (tab: string) => void;
  complianceScores: Record<string, number>;
}

export default function Dashboard({ alerts, onAnalyze, setActiveTab, complianceScores }: DashboardProps) {
  const [systemHealth, setSystemHealth] = useState(98.4);
  const [anomalyRate, setAnomalyRate] = useState(1.8);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Dynamic status oscillation
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemHealth(prev => Math.min(100, Math.max(90, +(prev + (Math.random() - 0.5) * 0.4).toFixed(2))));
      setAnomalyRate(prev => Math.max(0.1, +(prev + (Math.random() - 0.5) * 0.3).toFixed(2)));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const totalThreats = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  const sentinelNodes = [
    { 
      id: 0, 
      label: 'THREAT-ANALYZER', 
      desc: 'Correlating security logs and performing threat diagnostics', 
      grad: 'var(--grad-cyan)',
      icon: <Activity style={{ width: '22px', height: '22px', color: '#06070d' }} />,
      tab: 'analyzer'
    },
    { 
      id: 1, 
      label: 'PHISHING-GUARD', 
      desc: 'Inspecting email drafts for compliance and risk scores', 
      grad: 'var(--grad-pink)',
      icon: <Cpu style={{ width: '22px', height: '22px', color: '#ffffff' }} />,
      tab: 'phishing'
    },
    { 
      id: 2, 
      label: 'GRC-AUDITOR', 
      desc: 'Auditing compliance policies and tracking framework scores', 
      grad: 'var(--grad-orange)',
      icon: <CheckCircle style={{ width: '22px', height: '22px', color: '#06070d' }} />,
      tab: 'grc'
    },
    { 
      id: 3, 
      label: 'RISK-LEDGER', 
      desc: 'Reviewing security vulnerabilities and tracking risk items', 
      grad: 'var(--grad-purple)',
      icon: <ShieldAlert style={{ width: '22px', height: '22px', color: '#06070d' }} />,
      tab: 'risks'
    },
    { 
      id: 4, 
      label: 'SANDBOX', 
      desc: 'Simulating payload exploits in secure container sandbox', 
      grad: 'var(--grad-green)',
      icon: <Globe style={{ width: '22px', height: '22px', color: '#06070d' }} />,
      tab: 'sandbox'
    }
  ];

  const getAvatarStyle = (idx: number) => {
    if (hoveredIdx === null) return {};
    if (hoveredIdx === idx) {
      return {
        transform: 'translateY(-12px) scale(1.25) rotate(-3deg)',
        zIndex: 100,
        borderColor: '#00f2fe',
        boxShadow: '0 20px 30px rgba(0, 242, 254, 0.4)'
      };
    }
    const shiftAmount = idx < hoveredIdx ? -14 : 14;
    return {
      transform: `translateX(${shiftAmount}px) scale(0.92)`,
      opacity: 0.55
    };
  };

  const nodeAlertDetails: Record<string, string> = {
    'MUMBAI_HQ': 'Mumbai Workstation: Main local developer environment active on port 3000.',
    'LOCAL_HOST': 'Localhost: Core dev server running Vite HMR telemetry.',
    'GATEWAY_MUM': 'Gateway Router: Firewall monitoring active for local subnet 192.168.1.0/24.',
    'WAN_LINK': 'WAN Uplink: Standard internet traffic. No external anomalies detected.',
    'THREAT_SRC': 'Sandbox Source: Simulated attack vectors originating from containment container.'
  };

  const renderDial = (value: number, label: string, gradientId: string, color1: string, color2: string) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '16px', 
          background: 'rgba(255, 255, 255, 0.02)', 
          borderRadius: '20px', 
          border: '1.5px solid rgba(255, 255, 255, 0.05)',
          transition: 'var(--spring-transition)',
          cursor: 'pointer'
        }}
        className="hover:scale-105"
      >
        <svg width="74" height="74" viewBox="0 0 74 74">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>
          <circle cx="37" cy="37" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="5" />
          <circle 
            cx="37" cy="37" r={radius} 
            fill="none" 
            stroke={`url(#${gradientId})`} 
            strokeWidth="5" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 37 37)"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          />
          <text 
            x="37" y="42" 
            className="tech-font" 
            textAnchor="middle" 
            fill="#ffffff" 
            fontSize="12" 
            fontWeight="900"
          >
            {value}%
          </text>
        </svg>
        <div style={{ fontSize: '0.65rem', fontWeight: '800', marginTop: '10px', color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="cyber-grid-container">

      {/* Skiper UI Hover Members Hero Banner */}
      <div className="cyber-panel skiper-hero-container" style={{ gridColumn: 'span 12' }}>
        <div className="skiper-facepile">
          {sentinelNodes.map((node) => (
            <div 
              key={node.id} 
              className="skiper-avatar"
              style={{ 
                background: node.grad,
                ...getAvatarStyle(node.id) 
              }}
              onMouseEnter={() => setHoveredIdx(node.id)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setActiveTab(node.tab)}
              title={`Open ${node.label} module`}
            >
              {node.icon}
            </div>
          ))}
        </div>
        
        <div className={`skiper-giant-text ${hoveredIdx !== null ? 'active' : ''}`}>
          {hoveredIdx !== null ? sentinelNodes[hoveredIdx].label : 'CYBER-SENTINEL'}
        </div>

        <div className="skiper-description">
          {hoveredIdx !== null ? sentinelNodes[hoveredIdx].desc : 'Hover a sentinel guard node to invoke sub-system logs'}
        </div>
      </div>
      <div className="cyber-panel stat-card" style={{ gridColumn: 'span 3' }}>
        <div className="stat-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-font" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>TOTAL THREATS</span>
            <span className="pulse-dot-cyan" />
          </div>
          <div className="stat-value" style={{ background: 'var(--grad-cyan)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {totalThreats}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Actively monitored logs</span>
        </div>
      </div>

      <div className="cyber-panel stat-card" style={{ gridColumn: 'span 3' }}>
        <div className="stat-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-font" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CRITICAL ALERTS</span>
            <ShieldAlert style={{ color: '#ff0844', width: '18px', height: '18px' }} />
          </div>
          <div className="stat-value" style={{ background: 'var(--grad-pink)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {criticalCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending remediation</span>
        </div>
      </div>

      <div className="cyber-panel stat-card" style={{ gridColumn: 'span 3' }}>
        <div className="stat-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-font" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ANOMALY TREND</span>
            <Activity style={{ color: '#fda085', width: '18px', height: '18px' }} />
          </div>
          <div className="stat-value" style={{ background: 'var(--grad-orange)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {anomalyRate}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Threshold deviation</span>
        </div>
      </div>

      <div className="cyber-panel stat-card" style={{ gridColumn: 'span 3' }}>
        <div className="stat-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-font" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI INTEGRITY</span>
            <Cpu style={{ color: '#38f9d7', width: '18px', height: '18px' }} />
          </div>
          <div className="stat-value" style={{ background: 'var(--grad-green)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {systemHealth}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correlation latency normal</span>
        </div>
      </div>

      {/* Global Threat Map Simulation */}
      <div className="cyber-panel" style={{ gridColumn: 'span 8', height: '410px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="tech-font" style={{ fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe style={{ width: '18px', height: '18px', color: '#4facfe' }} /> LOCAL INTRANET TOPOLOGY (TAP NODES)
          </h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tap any system node to inspect live logs</span>
        </div>
        
        {/* SVG Intranet Map Vector Representation */}
        <div style={{ flex: 1, position: 'relative', background: 'radial-gradient(circle at center, #0e122a 0%, #06070f 100%)', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
          <svg viewBox="0 0 800 280" style={{ width: '100%', height: '100%' }}>
            <defs>
              <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="rgba(255, 255, 255, 0.05)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />

            {/* Topology connections */}
            <path d="M 150,140 L 300,140" fill="none" stroke="url(#line-cyan-grad)" strokeWidth="2.5" className="map-link-dash" />
            <path d="M 300,140 L 450,140" fill="none" stroke="url(#line-cyan-grad)" strokeWidth="2.5" className="map-link-dash" />
            <path d="M 450,140 Q 525,110 600,80" fill="none" stroke="url(#line-orange-grad)" strokeWidth="2.0" className="map-link-dash" />
            <path d="M 450,140 Q 525,170 600,200" fill="none" stroke="url(#line-red-grad)" strokeWidth="2.5" className="map-link-dash" />

            <defs>
              <linearGradient id="line-red-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff0844" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ffb199" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="line-orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fda085" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="line-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#b18efd" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* LOCAL_HOST */}
            <g style={{ cursor: 'pointer' }} onClick={() => setSelectedNode('LOCAL_HOST')}>
              <circle cx="150" cy="140" r="8" fill={selectedNode === 'LOCAL_HOST' ? '#00f2fe' : '#4facfe'} opacity="0.3" />
              <circle cx="150" cy="140" r="5" fill="#00f2fe" />
              <text x="120" y="165" fill="#cbd5e1" fontSize="9" fontWeight="800" className="tech-font">LOCAL_HOST</text>
            </g>

            {/* MUMBAI_HQ */}
            <g style={{ cursor: 'pointer' }} onClick={() => setSelectedNode('MUMBAI_HQ')}>
              <circle cx="300" cy="140" r="8" fill={selectedNode === 'MUMBAI_HQ' ? '#00f2fe' : '#4facfe'} opacity="0.3" />
              <circle cx="300" cy="140" r="5" fill="#4facfe" />
              <text x="270" y="165" fill="#cbd5e1" fontSize="9" fontWeight="800" className="tech-font">MUMBAI_HQ</text>
            </g>

            {/* GATEWAY_MUM */}
            <g style={{ cursor: 'pointer' }} onClick={() => setSelectedNode('GATEWAY_MUM')}>
              <circle cx="450" cy="140" r="10" fill="#38f9d7" opacity="0.3" />
              <circle cx="450" cy="140" r="6" fill="#38f9d7" />
              <text x="415" y="165" fill="#ffffff" fontSize="9" fontWeight="800" className="tech-font">GATEWAY_MUM</text>
            </g>

            {/* WAN_LINK */}
            <g style={{ cursor: 'pointer' }} onClick={() => setSelectedNode('WAN_LINK')}>
              <circle cx="600" cy="80" r="8" fill={selectedNode === 'WAN_LINK' ? '#00f2fe' : '#4facfe'} opacity="0.3" />
              <circle cx="600" cy="80" r="5" fill="#00f2fe" />
              <text x="575" y="65" fill="#cbd5e1" fontSize="9" fontWeight="800" className="tech-font">WAN_LINK</text>
            </g>

            {/* THREAT_SRC */}
            <g style={{ cursor: 'pointer' }} onClick={() => setSelectedNode('THREAT_SRC')}>
              <circle cx="600" cy="200" r="14" fill="#ff0844" style={{ animation: 'pulse-ring 2.5s infinite' }} opacity="0.4" />
              <circle cx="600" cy="200" r="6" fill="#ff0844" />
              <text x="565" y="228" fill="#ff527b" fontSize="9" fontWeight="800" className="tech-font">THREAT_SRC</text>
            </g>
          </svg>

          {/* Interactive Bouncy Node Dialog overlay */}
          <div style={{ position: 'absolute', bottom: '15px', left: '15px', right: '15px', background: 'rgba(12, 16, 38, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--spring-transition)' }}>
            <span className={selectedNode === 'THREAT_SRC' ? 'pulse-dot-red' : 'pulse-dot-cyan'}></span>
            <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700' }} className="tech-font">
              {selectedNode ? `[${selectedNode}] - ${nodeAlertDetails[selectedNode]}` : '[SYSTEM STATUS] - Click on any topological node above to audit live network statistics.'}
            </span>
          </div>
        </div>
      </div>

      {/* GRC Compliance Radar Dials */}
      <div className="cyber-panel" style={{ gridColumn: 'span 4', height: '410px', display: 'flex', flexDirection: 'column' }}>
        <h3 className="tech-font" style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle style={{ width: '18px', height: '18px', color: '#38f9d7' }} /> COMPLIANCE COVERAGE
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.4' }}>
          Interactive standards coverage mapped against live logs.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
          {renderDial(complianceScores['SOC 2'] ?? 20, 'SOC 2 Type II', 'cyanGrad', '#00f2fe', '#4facfe')}
          {renderDial(complianceScores['ISO 27001'] ?? 25, 'ISO 27001', 'orangeGrad', '#f6d365', '#fda085')}
          {renderDial(complianceScores['GDPR'] ?? 40, 'GDPR Audit', 'greenGrad', '#43e97b', '#38f9d7')}
          {renderDial(complianceScores['HIPAA'] ?? 30, 'HIPAA Compliance', 'purpleGrad', '#b18efd', '#f1a9ff')}
        </div>

        <button 
          className="cyber-btn" 
          style={{ width: '100%', marginTop: '16px', fontSize: '0.75rem' }}
          onClick={() => setActiveTab('grc')}
        >
          Access Compliance Audit
        </button>
      </div>

      {/* Real-time Threat Event Log (Live Feed rewritten as floating wobbly card strips) */}
      <div className="cyber-panel" style={{ gridColumn: 'span 12' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="tech-font" style={{ fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity style={{ width: '18px', height: '18px', color: '#00f2fe' }} /> INCIDENT FEED CHANNELS
          </h3>
          <span className="cyber-badge cyber-badge-cyan" style={{ fontSize: '0.65rem' }}>
            Ingest active
          </span>
        </div>

        {/* Separated Floating Card Strips instead of rigid table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.06)' }}>
              No threat alerts populated. Visit the "Sandbox" tab to run vectors.
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1.5px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '20px', 
                  padding: '16px 24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  transition: 'var(--spring-transition)',
                  cursor: 'pointer'
                }}
                className="hover:scale-[1.01] hover:bg-[rgba(255,255,255,0.04)]"
              >
                {/* Time & Signature */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <span className="mono-font" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{alert.timestamp}</span>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>{alert.signature}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="mono-font">Source IP: {alert.sourceIp} ➜ Dest: {alert.destIp || '10.0.0.1'}</span>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span className={`cyber-badge ${
                    alert.severity === 'critical' ? 'cyber-badge-red' :
                    alert.severity === 'high' ? 'cyber-badge-orange' :
                    alert.severity === 'medium' ? 'cyber-badge-cyan' :
                    'cyber-badge-green'
                  }`}>
                    {alert.severity}
                  </span>
                  
                  {alert.mitreTechnique && (
                    <span style={{ color: '#b18efd', fontSize: '0.75rem', fontWeight: 'bold' }} className="tech-font">
                      {alert.mitreTechnique}
                    </span>
                  )}

                  <button 
                    className="cyber-btn"
                    style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                    onClick={() => {
                      onAnalyze(`SOURCE_IP: ${alert.sourceIp}\nTHREAT: ${alert.signature}\nMITRE: ${alert.mitreTechnique}\nFRAMEWORK_FLAG: ${alert.complianceFailure}`);
                      setActiveTab('analyzer');
                    }}
                  >
                    AI Audit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
