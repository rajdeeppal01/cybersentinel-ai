import { useState } from 'react';
import { HelpCircle, Send, Cpu, CheckCircle2, ShieldCheck, Database, FileText, Paperclip, ExternalLink } from 'lucide-react';

const MOCK_POLICIES = [
  { id: 'pol-1', name: 'Information Security Policy (ISO 27001)', icon: <ShieldCheck size={14} /> },
  { id: 'pol-2', name: 'Data Encryption Standard (SOC 2)', icon: <Database size={14} /> },
  { id: 'pol-3', name: 'Access Control Policy (DPDPA)', icon: <FileText size={14} /> }
];

export default function QuestionnaireAI() {
  const [question, setQuestion] = useState('How does your organization ensure that customer data is encrypted at rest and in transit?');
  const [selectedPolicy, setSelectedPolicy] = useState('pol-2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [evidence, setEvidence] = useState<{name: string, type: string}[]>([]);

  const generateResponse = () => {
    if (!question.trim()) return;
    setIsGenerating(true);
    setResponse('');
    
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setResponse(`Based on our internal Data Encryption Standard (SOC 2), all customer data is encrypted at rest using AES-256 encryption managed via AWS KMS. Data in transit is secured using TLS 1.2 or higher for all external and internal communications. These encryption standards are reviewed annually and enforced automatically via our Cloud Security Posture Management (CSPM) tools. (Mapped to: SOC 2 CC6.1)`);
      setEvidence([
        { name: 'AWS_KMS_Config_Export.json', type: 'JSON' },
        { name: 'SOC2_PenTest_Report_Q3.pdf', type: 'PDF' }
      ]);
    }, 1500);
  };

  return (
    <div className="cyber-grid-container">
      {/* Header Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="tech-font" style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle style={{ color: '#00f2fe' }} /> AI QUESTIONNAIRE AUTOMATION
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Instantly generate audit-ready responses to customer security questionnaires based on your internal policies.
          </p>
        </div>
      </div>

      {/* Input Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '5px' }}>
          CUSTOMER QUESTION
        </h3>
        
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Select Reference Policy Database:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_POLICIES.map((pol) => (
              <div 
                key={pol.id}
                onClick={() => setSelectedPolicy(pol.id)}
                style={{ 
                  padding: '10px', 
                  background: selectedPolicy === pol.id ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedPolicy === pol.id ? 'var(--neon-cyan)' : 'transparent'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: selectedPolicy === pol.id ? '#fff' : 'var(--text-muted)'
                }}
              >
                {pol.icon}
                {pol.name}
                {selectedPolicy === pol.id && <CheckCircle2 size={14} style={{ marginLeft: 'auto', color: 'var(--neon-cyan)' }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Paste Questionnaire Item:</label>
          <textarea
            className="cyber-input mono-font"
            style={{ flex: 1, minHeight: '150px', fontSize: '0.8rem', resize: 'none', background: '#050811', border: '1px solid var(--panel-border)', lineHeight: '1.4' }}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Do you perform annual penetration testing?"
          />
        </div>

        <button 
          className="cyber-btn cyber-btn-success"
          style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
          onClick={generateResponse}
          disabled={isGenerating || !question.trim()}
        >
          {isGenerating ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu className="spin" style={{ width: '16px', height: '16px' }} /> Analyzing Policies...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send style={{ width: '16px', height: '16px' }} /> Generate Response
            </span>
          )}
        </button>
      </div>

      {/* Output Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} /> AI DRAFTED RESPONSE
        </h3>

        <div style={{ flex: 1, background: '#03050a', border: '1px solid rgba(0, 240, 255, 0.1)', borderRadius: '4px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          {!response && !isGenerating && (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
               Paste a question on the left and click Generate Response.
             </div>
          )}

          {isGenerating && (
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-cyan)', gap: '10px' }}>
               <Cpu size={32} className="spin" />
               <span className="tech-font" style={{ fontSize: '0.8rem' }}>Querying internal policy database...</span>
             </div>
          )}

          {response && !isGenerating && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {response}
              </div>
              <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid var(--neon-green)', padding: '12px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--neon-green)' }}>
                <strong>Confidence: High</strong> — This response directly references controls mapped in the <em>Data Encryption Standard (SOC 2)</em> policy document.
              </div>
              
              {evidence.length > 0 && (
                <div style={{ marginTop: '5px' }}>
                  <h4 className="tech-font" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={12} /> ATTACHED EVIDENCE ARTIFACTS
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {evidence.map((file, idx) => (
                      <div key={idx} style={{ 
                        background: 'rgba(0, 240, 255, 0.05)', 
                        border: '1px solid rgba(0, 240, 255, 0.2)', 
                        padding: '8px 12px', 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontSize: '0.7rem',
                        color: 'var(--neon-cyan)',
                        cursor: 'pointer'
                      }}>
                        <FileText size={14} />
                        {file.name}
                        <ExternalLink size={12} style={{ marginLeft: '4px', opacity: 0.7 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '20px' }}>
                 <button className="cyber-btn cyber-btn-secondary" style={{ flex: 1 }} onClick={() => navigator.clipboard.writeText(response)}>
                   Copy to Clipboard
                 </button>
                 <button className="cyber-btn" style={{ flex: 1 }}>
                   Mark as Reviewed
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
