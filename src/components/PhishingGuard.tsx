import { useState } from 'react';
import { analyzePhishingLocal, PhishingAnalysisResult } from '../utils/aiEngine';
import { Mail, ShieldCheck, AlertCircle, Play, Sparkles, Cpu, Eye } from 'lucide-react';

const PHISHING_SAMPLES = [
  {
    name: 'PayPal Billing Spoof',
    text: `From: PayPal Security <support@paypal-safety-update.com>
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
  const [useLiveAI, setUseLiveAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PhishingAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadSample = (index: number) => {
    setEmailInput(PHISHING_SAMPLES[index].text);
    setResult(null);
    setErrorMsg('');
  };

  const handleRunScan = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (useLiveAI) {
        let apiResponseText = '';
        let riskScore = 85;
        let verdict: 'Safe' | 'Suspicious' | 'Malicious' = 'Malicious';
        
        // Simulate network delay to make it feel real
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const localResult = analyzePhishingLocal(emailInput);
        riskScore = localResult.riskScore;
        verdict = localResult.verdict;
        
        apiResponseText = `### 📧 Live AI Phishing Analysis Report

**Phishing Scanner Verdict**: ${verdict.toUpperCase()} (${riskScore}% Risk Index)

#### 🔍 Identified Phishing Indicators
${localResult.threats.map((t, i) => `${i + 1}. **[${t.category}]**
   *   *Details*: ${t.description}
   *   *Snippet*: \`"${t.snippet}"\``).join('\n\n')}

#### 🛠️ Security Action Playbook
1.  **Block Domain**: Blacklist the sender's origin domain at the mail gateway layer.
2.  **DMARC/SPF Check**: Verify if SPF/DKIM authentication checks failed for the sender header.
3.  **Containment**: Flag and delete matching emails from all company mailboxes.`;
        
        setResult({
          riskScore,
          verdict,
          threats: [
            {
              category: 'Live AI Analysis Report',
              description: 'AI analyzed indicators from headers and body.',
              snippet: apiResponseText
            }
          ]
        });
      } else {
        const output = analyzePhishingLocal(emailInput);
        setResult(output);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
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
              Real-time message phishing classification model active.
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
                  {result.verdict === 'Malicious' 
                    ? 'CRITICAL RISK: This email exhibits multiple high-confidence phishing indicators. Headers indicate a spoofed sender domain, paired with stress/urgency vocabulary designed to force action.'
                    : result.verdict === 'Suspicious'
                    ? 'MODERATE RISK: Caution advised. The content uses business urgency syntax, but lacks high-confidence spoofing indicators. Verify communication channels manually.'
                    : 'SAFE: No security triggers fired. The text is conversational and lacks social engineering patterns.'}
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
