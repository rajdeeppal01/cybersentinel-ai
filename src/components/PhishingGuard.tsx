import { useState } from 'react';
import { analyzePhishingLocal, PhishingAnalysisResult } from '../utils/aiEngine';
import { analyzeEmailWithLLM, LoadProgress } from '../utils/webllmEngine';
import { analyzeEmailWithGemini, analyzePhishingWithBackend, OnlineEngineError } from '../utils/onlineEngine';
import { analyzeEmailForensics, EmailForensicsResult } from '../utils/emailForensics';
import { Mail, ShieldCheck, AlertCircle, Play, Sparkles, Cpu, Eye, Search } from 'lucide-react';

const PHISHING_SAMPLES = [
  {
    name: 'PayPal Billing Spoof',
    text: `From: PayPal Security <support@paypal-safety-update.com>
Reply-To: recovery@secure-paypal-billing.net
Subject: URGENT: Your PayPal Account has been temporarily suspended!

Dear Customer,
We detected suspicious activity on your credit card. For your safety, we suspended your profile.
You must immediately verify your identity within 24 hours or your accounts will be locked permanently.

Please click here to update your security parameters:
http://paypal-verification-portal.com/update/login.php

Thanks,
PayPal Security Team`
  },
  {
    name: 'Urgent Wire Transfer Request',
    text: `From: CEO <executive-office@company-corp.com>
Subject: Urgent: Confidential Wire Transfer Request Today

Hi Operations Team,
I need you to process an urgent wire transfer of $45,000 for a confidential acquisition that is closing today.
Please send the funds to the account details attached below as soon as possible. Do not discuss this with other team members due to NDA restrictions.

Thanks,
Chief Executive Officer`
  },
  {
    name: 'Standard Safe Email',
    text: `From: HR Operations <hr@company.com>
Reply-To: hr@company.com
Message-ID: <a1b2c3d4@company.com>
Subject: Schedule for Annual Company Picnic next Friday

Hi Team,
Just a quick reminder that our annual company picnic is scheduled for next Friday at Central Park.
Please fill out the food preference form on the intranet portal.
Looking forward to seeing everyone there!

Best regards,
HR Team`
  }
];

export default function PhishingGuard() {
  const [emailInput, setEmailInput] = useState(PHISHING_SAMPLES[0].text);
  const [useLocalLLM, setUseLocalLLM] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadProgress | null>(null);
  const [result, setResult] = useState<PhishingAnalysisResult | null>(null);
  const [forensics, setForensics] = useState<EmailForensicsResult | null>(null);
  const [needsEscalation, setNeedsEscalation] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);

  // Tier 3 -- BYOK online escalation
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [onlineResult, setOnlineResult] = useState<PhishingAnalysisResult | null>(null);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState('');

  const loadSample = (index: number) => {
    setEmailInput(PHISHING_SAMPLES[index].text);
    setResult(null);
    setForensics(null);
    setNeedsEscalation(false);
    setOnlineResult(null);
    setOnlineError('');
    setErrorMsg('');
    setUsedFallback(false);
  };

  const handleRunScan = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setNeedsEscalation(false);
    setOnlineResult(null);
    setOnlineError('');
    setOnlineError('');
    setShowKeyInput(false);
    setUsedFallback(false);

    // Forensics are deterministic, real checks -- always run regardless of AI mode
    const forensicsResult = analyzeEmailForensics(emailInput);
    setForensics(forensicsResult);

    try {
      if (useLocalLLM) {
        try {
          const output = await analyzeEmailWithLLM(emailInput, (p) => setLoadStatus(p));
          setResult(output);
          setNeedsEscalation(output.needsEscalation ?? false);
        } catch (llmErr) {
          console.error('WebLLM phishing analysis failed:', llmErr);
          setErrorMsg('On-device model had trouble with this input, falling back to server backend.');
          try {
            const output = await analyzePhishingWithBackend(emailInput);
            setResult(output);
            setUsedFallback(true);
          } catch (backendErr: any) {
            console.error('Backend fallback also failed:', backendErr);
            setErrorMsg(`On-device model failed, AND server fallback also failed: ${backendErr?.message || String(backendErr)}`);
            setResult(analyzePhishingLocal(emailInput));
          }
        } finally {
          setLoadStatus(null);
        }
      } else {
        const output = await analyzePhishingWithBackend(emailInput);
        setResult(output);
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
      const output = await analyzeEmailWithGemini(emailInput, apiKeyInput);
      setOnlineResult(output);
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
      
      {/* Input controls panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail style={{ width: '16px', height: '16px' }} /> SUSPICIOUS EMAIL INPUT
        </h3>

        {/* Presets */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Load Sample Email Body/Headers:</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {PHISHING_SAMPLES.map((sample, idx) => (
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

        {/* On-Device LLM Toggle */}
        <div style={{ background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', padding: '12px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="tech-font" style={{ fontSize: '0.75rem', color: '#fff' }}>ON-DEVICE AI ANALYSIS</span>
            <input 
              type="checkbox" 
              checked={useLocalLLM} 
              onChange={(e) => setUseLocalLLM(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
          </div>
          {useLocalLLM && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
              Runs a small language model directly in your browser (first run downloads the model, then it's cached).
            </span>
          )}
          {loadStatus && (
            <span style={{ fontSize: '0.65rem', color: 'var(--neon-cyan)', display: 'block', marginTop: '6px' }}>
              {loadStatus.text} ({Math.round(loadStatus.progress * 100)}%)
            </span>
          )}
        </div>

        {/* Email content textarea */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Copy-Paste Email Header & Text:</label>
          <textarea
            className="cyber-input mono-font"
            style={{ flex: 1, minHeight: '220px', fontSize: '0.75rem', resize: 'none', background: '#050811', border: '1px solid var(--panel-border)', lineHeight: '1.4' }}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
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
          onClick={handleRunScan}
          disabled={isLoading}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu style={{ animation: 'spin 2s linear infinite', width: '16px', height: '16px' }} /> Scanning Content...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play style={{ width: '16px', height: '16px' }} /> Execute AI Email Scan
            </span>
          )}
        </button>
      </div>

      {/* Security Analysis Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck style={{ width: '16px', height: '16px' }} /> PHISHING THREAT DIAGNOSTICS
        </h3>

        {!result ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px', minHeight: '300px' }}>
            <AlertCircle style={{ width: '48px', height: '48px', strokeWidth: '1.2', color: 'rgba(0, 240, 255, 0.4)' }} />
            <p className="tech-font" style={{ fontSize: '0.8rem' }}>AWAITING THREAT ANALYSIS... CLICK 'EXECUTE AI EMAIL SCAN'</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {usedFallback && (
              <div style={{ background: 'rgba(255, 159, 0, 0.05)', border: '1px solid var(--neon-orange)', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--neon-orange)' }}>
                ⚠️ <strong>Note:</strong> The local on-device AI failed to initialize. This analysis was dynamically generated by the secure Vercel Cloud Backend instead.
              </div>
            )}

            {/* Header & URL Forensics -- concrete, checkable facts, independent of any AI verdict */}
            {forensics && (
              <div style={{ border: '1px solid var(--neon-green)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', color: 'var(--neon-green)', background: 'rgba(57, 255, 20, 0.05)', padding: '10px', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search style={{ width: '14px', height: '14px' }} /> HEADER & URL FORENSICS (deterministic, not AI-generated)
                  </span>
                  <strong>{forensics.forensicScore}/100</strong>
                </div>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {forensics.flags.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No header or URL red flags detected.</span>
                  ) : (
                    forensics.flags.map((flag, idx) => (
                      <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-primary)', display: 'flex', gap: '6px' }}>
                        <span style={{ color: 'var(--neon-orange)' }}>▸</span> {flag}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {needsEscalation && (
              <div style={{ border: '1px solid var(--neon-orange)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ color: 'var(--neon-orange)', background: 'rgba(255, 159, 0, 0.05)', padding: '10px', fontSize: '0.75rem' }}>
                  On-device model wasn't fully confident on this one.
                </div>

                {!onlineResult && (
                  <div style={{ padding: '12px', background: 'rgba(255, 159, 0, 0.02)' }}>
                    {!showKeyInput ? (
                      <button
                        className="cyber-btn cyber-btn-secondary"
                        style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setShowKeyInput(true)}
                      >
                        <Sparkles style={{ width: '14px', height: '14px' }} /> Get a second opinion (bring your own Gemini API key)
                      </button>
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
              <div style={{ border: '1px solid var(--neon-cyan)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', background: 'rgba(0, 240, 255, 0.05)', padding: '10px', fontSize: '0.75rem' }}>
                  <Sparkles style={{ width: '14px', height: '14px' }} /> ONLINE MODEL SECOND OPINION (Gemini, your API key)
                </div>
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem' }}>
                    <strong>{onlineResult.verdict}</strong>
                    <span>Risk Score: {onlineResult.riskScore}%</span>
                  </div>
                  {onlineResult.threats.map((t, idx) => (
                    <p key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <strong>{t.category}:</strong> {t.description}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Risk Index Dial Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', padding: '15px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(0, 240, 255, 0.1)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '5px' }} className="tech-font">RISK ESTIMATION INDEX</span>
                <span className="tech-font" style={{ fontSize: '2.4rem', fontWeight: 'bold', color: result.riskScore > 60 ? 'var(--neon-red)' : result.riskScore > 20 ? 'var(--neon-orange)' : 'var(--neon-green)' }}>
                  {result.riskScore}%
                </span>
                <span className={`cyber-badge ${
                  result.verdict === 'Malicious' ? 'cyber-badge-red' :
                  result.verdict === 'Suspicious' ? 'cyber-badge-orange' :
                  'cyber-badge-green'
                }`} style={{ marginTop: '5px' }}>
                  {result.verdict}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--neon-cyan)', marginBottom: '5px' }} className="tech-font">AI ANALYSIS THREAT VERDICT:</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {result.riskScore >= 70
                    ? 'HIGH RISK: This email exhibits high-confidence phishing indicators. Treat with strong suspicion and verify through a separate, trusted channel before acting on anything it requests.'
                    : result.riskScore >= 30
                    ? 'MODERATE RISK: Some suspicious characteristics present, but not conclusive. Verify communication channels manually before acting on this email.'
                    : 'LOW RISK: Few or no phishing indicators detected. Still worth a quick sanity check if anything about it feels off.'}
                </p>
              </div>
            </div>

            {/* List of threats flagged */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '5px' }}>
              <h4 className="tech-font" style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye style={{ width: '14px', height: '14px' }} /> FLAGGED INDICATORS OF COMPROMISE ({result.threats.length})
              </h4>

              {result.threats.length === 0 ? (
                <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid var(--neon-green)', padding: '15px', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--neon-green)' }}>
                  🛡️ No phishing indicators identified. The email is assessed safe for delivery.
                </div>
              ) : (
                result.threats.map((threat, idx) => (
                  <div 
                    key={idx} 
                    style={{ background: '#070b15', border: '1px solid rgba(0,240,255,0.08)', borderRadius: '4px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong className="tech-font" style={{ fontSize: '0.75rem', color: 'var(--neon-orange)' }}>
                        {threat.category}
                      </strong>
                      <span className="cyber-badge cyber-badge-orange" style={{ fontSize: '0.6rem' }}>
                        social eng indicator
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {threat.description}
                    </p>
                    <div style={{ marginTop: '5px' }}>
                      <strong style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '5px' }} className="tech-font">
                        <Sparkles style={{ width: '12px', height: '12px' }} /> INTERCEPTED BODY SNIPPET:
                      </strong>
                      <pre className="mono-font" style={{ background: '#050811', borderLeft: '3px solid var(--neon-orange)', padding: '8px', borderRadius: '2px', fontSize: '0.7rem', color: '#ffedd5', marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                        {threat.snippet}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}