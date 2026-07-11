import { useState, useEffect } from 'react';
import { SecurityEvent } from './utils/aiEngine';
import Dashboard from './components/Dashboard';
import ThreatAnalyzer from './components/ThreatAnalyzer';
import ComplianceAuditor from './components/ComplianceAuditor';
import RiskRegister from './components/RiskRegister';
import PhishingGuard from './components/PhishingGuard';
import AttackSandbox from './components/AttackSandbox';
import { Shield, ShieldAlert, Terminal, Layers, Activity, FileText, CheckSquare, Mail } from 'lucide-react';

const INITIAL_ALERTS: SecurityEvent[] = [
  {
    id: 'ALT-1082',
    timestamp: '09:42:03',
    sourceIp: '192.168.1.142',
    destIp: '10.0.0.12',
    protocol: 'HTTP',
    severity: 'high',
    signature: 'SQL Injection: UNION SELECT column query on GET /api/users/profile',
    mitreTechnique: 'T1190',
    complianceFailure: 'SOC 2 CC7.1',
    status: 'active'
  },
  {
    id: 'ALT-2041',
    timestamp: '09:43:21',
    sourceIp: '185.220.101.4',
    destIp: '10.0.0.5',
    protocol: 'SSH',
    severity: 'medium',
    signature: 'SSH Brute Force: credential guessing attempts from invalid user profiles',
    mitreTechnique: 'T1110.001',
    complianceFailure: 'ISO 27001 A.9.4.3',
    status: 'active'
  }
];

export default function App() {
  const [view, setView] = useState<'landing' | 'hub'>(() => {
    return (localStorage.getItem('cs_view') as 'landing' | 'hub') || 'landing';
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('cs_active_tab') || 'dashboard';
  });
  const [alerts, setAlerts] = useState<SecurityEvent[]>(INITIAL_ALERTS);
  const [analyzerLogText, setAnalyzerLogText] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [complianceScores, setComplianceScores] = useState<Record<string, number>>({
    'SOC 2': 20,
    'ISO 27001': 25,
    'GDPR': 40,
    'HIPAA': 30
  });

  useEffect(() => {
    localStorage.setItem('cs_view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('cs_active_tab', activeTab);
  }, [activeTab]);

  // Clock update
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerAlert = (newAlert: SecurityEvent) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleAnalyzeLogFromFeed = (logText: string) => {
    setAnalyzerLogText(logText);
  };

  const handleUpdateComplianceScore = (framework: string, score: number) => {
    setComplianceScores(prev => ({
      ...prev,
      [framework]: score
    }));
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('npx run cyber-sentinel-ai');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', background: '#030408' }}>
      
      {/* Global Animated Rising Liquid Smoke Waves Backdrop (Shared across Landing & Hub) */}
      <div className="smoke-fluid-wrapper">
        {/* Wave 1: Purple Backing */}
        <svg viewBox="0 0 1440 500" preserveAspectRatio="none" className="wave-layer-1">
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#b18efd" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#006ce9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#030408" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 0,500 L 0,250 Q 350,130 720,280 T 1440,190 L 1440,500 Z" fill="url(#wave-grad-1)" />
        </svg>

        {/* Wave 2: Intense Blue Middle */}
        <svg viewBox="0 0 1440 500" preserveAspectRatio="none" className="wave-layer-2">
          <defs>
            <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#006ce9" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#030408" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#030408" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 0,500 L 0,210 Q 400,290 800,170 T 1440,230 L 1440,500 Z" fill="url(#wave-grad-2)" />
        </svg>

        {/* Wave 3: Bright Cyan Front */}
        <svg viewBox="0 0 1440 500" preserveAspectRatio="none" className="wave-layer-3">
          <defs>
            <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#006ce9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#030408" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 0,500 L 0,180 Q 360,80 720,220 T 1440,120 L 1440,500 Z" fill="url(#wave-grad-3)" />
        </svg>
      </div>

      {view === 'landing' ? (
        /* View: Landing Page (Skiper7 style) */
        <div className="landing-container" style={{ background: 'transparent' }}>
          
          {/* Floating Capsule Header */}
          <header className="cyber-header" style={{ width: '100%', maxWidth: '900px', marginTop: '10px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)' }}>
            <div className="cyber-title">
              <Shield className="pulse-dot-cyan" style={{ color: 'var(--neon-cyan)', width: '22px', height: '22px' }} />
              <span>CYBERSENTINEL <span style={{ color: 'var(--neon-red)' }}>AI</span></span>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
              {/* Removed navigation links per user request */}
            </div>
            <button className="cyber-btn" style={{ padding: '8px 18px', fontSize: '0.75rem' }} onClick={() => setView('hub')}>
              Go to Hub
            </button>
          </header>

          {/* Main Landing Hero Content */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, zIndex: 10, maxWidth: '800px', textAlign: 'center', padding: '0 20px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '4px', color: '#fda085', textTransform: 'uppercase', marginBottom: '15px' }}>
              SEC-GRC PORTAL & FRAMEWORK
            </span>
            <h1 className="tech-font" style={{ fontSize: '4.8rem', fontWeight: 900, lineHeight: 0.95, color: '#fff', letterSpacing: '-2px', textTransform: 'uppercase', marginBottom: '24px' }}>
              CYBER-SOC<br />
              SEC-GRC PORTAL
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '540px', lineHeight: '1.6', marginBottom: '32px' }}>
              Audit compliance regulations, trace malicious attack flows, score phishing threats, and trigger exploit simulations powered by a dynamic cloud-based AI heuristics engine.
            </p>

            {/* Terminal input & start button */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div 
                style={{ 
                  background: 'rgba(0,0,0,0.6)', 
                  border: '1.5px solid rgba(255,255,255,0.06)', 
                  borderRadius: '16px', 
                  padding: '12px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.8rem'
                }}
              >
                <span style={{ color: '#00f2fe' }}>npx</span>
                <span style={{ color: '#fff' }}>run cyber-sentinel-ai</span>
                <button 
                  onClick={handleCopyCommand}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}
                  title="Copy command"
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <button 
                className="cyber-btn"
                style={{ 
                  background: '#006ce9', 
                  borderColor: '#006ce9', 
                  padding: '12px 24px', 
                  fontSize: '0.85rem',
                  color: '#fff',
                  boxShadow: '0 20px 40px rgba(0, 108, 233, 0.3)' 
                }}
                onClick={() => setView('hub')}
              >
                Quick Start
              </button>
            </div>
          </div>

          {/* Dummy footer node */}
        </div>
      ) : (
        /* View: Main Workspace Hub (Console) */
        <div className="cyber-container">
          
          {/* Premium Cyber SOC Header */}
          <header className="cyber-header">
            <div className="cyber-title" style={{ cursor: 'pointer' }} onClick={() => setView('landing')} title="Return to Landing Portal">
              <Shield className="pulse-dot-cyan" style={{ color: 'var(--neon-cyan)', width: '28px', height: '28px' }} />
              <span>CYBERSENTINEL <span style={{ color: 'var(--neon-red)' }}>AI</span></span>
            </div>

            {/* Tab Controls Bar */}
            <nav className="cyber-tabs">
              <button 
                className={`cyber-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers style={{ width: '14px', height: '14px' }} /> Overview
                </span>
              </button>
              <button 
                className={`cyber-tab ${activeTab === 'analyzer' ? 'active' : ''}`}
                onClick={() => setActiveTab('analyzer')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText style={{ width: '14px', height: '14px' }} /> Threat Analyzer
                </span>
              </button>
              <button 
                className={`cyber-tab ${activeTab === 'phishing' ? 'active' : ''}`}
                onClick={() => setActiveTab('phishing')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail style={{ width: '14px', height: '14px' }} /> Phishing Guard
                </span>
              </button>
              <button 
                className={`cyber-tab ${activeTab === 'grc' ? 'active' : ''}`}
                onClick={() => setActiveTab('grc')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare style={{ width: '14px', height: '14px' }} /> GRC Auditor
                </span>
              </button>
              <button 
                className={`cyber-tab ${activeTab === 'risks' ? 'active' : ''}`}
                onClick={() => setActiveTab('risks')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert style={{ width: '14px', height: '14px' }} /> Risk Ledger
                </span>
              </button>
              <button 
                className={`cyber-tab ${activeTab === 'sandbox' ? 'active' : ''}`}
                onClick={() => setActiveTab('sandbox')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal style={{ width: '14px', height: '14px' }} /> Sandbox
                </span>
              </button>
            </nav>

            {/* Live HUD Clocks and Status */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.7rem' }}>
                <span className="tech-font" style={{ color: 'var(--neon-green)', fontWeight: 'bold', letterSpacing: '0.5px' }}>SYSTEM SHIELD ACTIVE</span>
                <span className="mono-font" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{currentTime}</span>
              </div>
            </div>
          </header>

          {/* Main App Content Viewport */}
          <main style={{ flex: 1, position: 'relative' }} className="fade-in">
            <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
              <Dashboard 
                alerts={alerts} 
                onAnalyze={handleAnalyzeLogFromFeed} 
                setActiveTab={setActiveTab} 
                complianceScores={complianceScores}
              />
            </div>
            
            <div style={{ display: activeTab === 'analyzer' ? 'block' : 'none' }}>
              <ThreatAnalyzer initialLogText={analyzerLogText} />
            </div>

            <div style={{ display: activeTab === 'phishing' ? 'block' : 'none' }}>
              <PhishingGuard />
            </div>

            <div style={{ display: activeTab === 'grc' ? 'block' : 'none' }}>
              <ComplianceAuditor 
                complianceScores={complianceScores}
                onUpdateScore={handleUpdateComplianceScore}
              />
            </div>

            <div style={{ display: activeTab === 'risks' ? 'block' : 'none' }}>
              <RiskRegister />
            </div>

            <div style={{ display: activeTab === 'sandbox' ? 'block' : 'none' }}>
              <AttackSandbox onTriggerAlert={handleTriggerAlert} />
            </div>
          </main>

          {/* Ticker SOC Footer */}
          <footer style={{ borderTop: '1px solid var(--panel-border)', padding: '10px 30px', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-secondary)', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <Activity style={{ color: 'var(--neon-cyan)', width: '12px', height: '12px' }} />
              <span className="tech-font">SEC-LOG CONSOLE STREAM: ONLINE</span>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span>CYBERSENTINEL SOC CORE v1.0.0</span>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
