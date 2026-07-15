import { useState } from 'react';
import { LOG_SAMPLES, analyzeLogLocal, LogAnalysisResult } from '../utils/aiEngine';
import { analyzeLogWithGemini, OnlineEngineError } from '../utils/onlineEngine';
import { Play, HelpCircle, Code, ShieldAlert, Cpu, FileText, Sparkles } from 'lucide-react';

interface ThreatAnalyzerProps {
  initialLogText: string;
}

export default function ThreatAnalyzer({ initialLogText }: ThreatAnalyzerProps) {
  const [logInput, setLogInput] = useState(initialLogText || LOG_SAMPLES[0].text);
  const [analysisResult, setAnalysisResult] = useState<LogAnalysisResult | null>(
    initialLogText ? analyzeLogLocal(initialLogText) : null
  );
  const [needsEscalation, setNeedsEscalation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'diagnostic' | 'compliance' | 'playbook'>('diagnostic');
  const [errorMsg, setErrorMsg] = useState('');

  // Tier 3 -- BYOK online escalation
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [onlineResult, setOnlineResult] = useState<LogAnalysisResult | null>(null);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState('');

  const loadSample = (index: number) => {
    setLogInput(LOG_SAMPLES[index].text);
    setAnalysisResult(null);
    setOnlineResult(null);
    setOnlineError('');
    setErrorMsg('');
  };

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setNeedsEscalation(false);
    setOnlineResult(null);
    setOnlineError('');
    setShowKeyInput(false);
    
    try {
      // Use the powerful, instantly-available local heuristic engine
      const result = analyzeLogLocal(logInput);
      setAnalysisResult(result);
      
      // If the local engine returns "Generic Suspicious Log Activity Detected", we suggest an escalation
      if (result.detectedThreat === 'Generic Suspicious Log Activity Detected') {
        setNeedsEscalation(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async () => {
    setOnlineLoading(true);
    setOnlineError('');
    try {
      const result = await analyzeLogWithGemini(logInput);
      setOnlineResult(result);
    } catch (err: any) {
      console.error('Online escalation failed:', err);
      setOnlineError(
        err instanceof OnlineEngineError ? err.message : 'Something went wrong reaching the online model.'
      );
    } finally {
      setOnlineLoading(false);
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

            {needsEscalation && (
              <div style={{ border: '1px solid var(--neon-orange)', borderRadius: '4px', marginBottom: '20px', overflow: 'hidden' }}>
                <div style={{ color: 'var(--neon-orange)', background: 'rgba(255, 159, 0, 0.05)', padding: '10px', fontSize: '0.75rem' }}>
                  The local heuristic engine found generic anomalous activity. Escalation to an AI model is recommended.
                </div>

                {!onlineResult && (
                  <div style={{ padding: '12px', background: 'rgba(255, 159, 0, 0.02)' }}>
                    {!showKeyInput ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                          className="cyber-btn cyber-btn-secondary"
                          style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => setShowKeyInput(true)}
                        >
                          <Sparkles style={{ width: '14px', height: '14px' }} /> Get a second opinion (bring your own Gemini API key)
                        </button>

                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Your key is used only for this request, sent directly to Google, never stored or sent anywhere else.
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="password"
                            placeholder="Paste your Gemini API key"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            className="cyber-input mono-font"
                            style={{ flex: 1, fontSize: '0.75rem', background: '#050811', border: '1px solid var(--panel-border)', padding: '8px' }}
                          />
                          <button
                            className="cyber-btn cyber-btn-success"
                            style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                            onClick={handleEscalate}
                            disabled={onlineLoading || !apiKeyInput.trim()}
                          >
                            {onlineLoading ? 'Analyzing...' : 'Analyze'}
                          </button>
                        </div>
                        {onlineError && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--neon-red)' }}>{onlineError}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {onlineResult && (
              <div style={{ border: '1px solid var(--neon-cyan)', borderRadius: '4px', marginBottom: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', background: 'rgba(0, 240, 255, 0.05)', padding: '10px', fontSize: '0.75rem' }}>
                  <Sparkles style={{ width: '14px', height: '14px' }} /> ONLINE MODEL SECOND OPINION (Gemini, your API key)
                </div>
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem' }}>
                    <strong>{onlineResult.detectedThreat}</strong>
                    <span>Confidence: {onlineResult.confidence}%</span>
                    <span>MITRE: {onlineResult.mitreCode}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{onlineResult.analysisSummary}</p>
                </div>
              </div>
            )}

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
                Incident Response Playbook
              </button>
            </div>

            {/* Content Sheets */}
            <div style={{ flex: 1, fontSize: '0.85rem', lineHeight: '1.6' }}>
              
              {/* Tab 1: Diagnostics */}
              {activeSubTab === 'diagnostic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <h5 className="tech-font" style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', marginBottom: '5px' }}>EXPLANATION & SUMMARY:</h5>
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