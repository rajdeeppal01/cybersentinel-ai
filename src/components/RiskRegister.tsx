import React, { useState } from 'react';
import { Shield, ShieldAlert, Sparkles, X, Plus, LayoutGrid } from 'lucide-react';

interface RiskItem {
  id: string;
  name: string;
  category: 'Infrastructure' | 'Software' | 'Process' | 'Compliance';
  likelihood: number; // 1-5
  impact: number; // 1-5
  score: number; // likelihood * impact (1-25)
  status: 'Inherent' | 'Mitigating' | 'Controlled';
  mitigation: {
    steps: string[];
    cost: string;
    effort: 'Low' | 'Medium' | 'High';
    residualScore: number;
    controls: string;
  };
}

const INITIAL_RISKS: RiskItem[] = [
  {
    id: 'RSK-01',
    name: 'Unpatched Apache Log4j dependencies on public web app server',
    category: 'Software',
    likelihood: 4,
    impact: 5,
    score: 20,
    status: 'Inherent',
    mitigation: {
      steps: [
        'Run scanning audits on Java applications to locate Log4j dependency usages.',
        'Configure Log4j2.formatMsgNoLookups=true system parameters.',
        'Upgrade dependency frameworks to Log4j version 2.17.1 or higher.'
      ],
      cost: 'Negligible (Developer time only)',
      effort: 'Low',
      residualScore: 4,
      controls: 'NIST PR.IP-12 / SOC 2 CC7.1'
    }
  },
  {
    id: 'RSK-02',
    name: 'Single-Factor Password authentication allowed for legacy Remote VPN access',
    category: 'Infrastructure',
    likelihood: 5,
    impact: 4,
    score: 20,
    status: 'Inherent',
    mitigation: {
      steps: [
        'Enforce Multi-Factor Authentication (MFA) on all remote gateway access.',
        'Apply strong IP geofencing restrictions for administrator accounts.',
        'Configure access audits to alert on off-hour connection logins.'
      ],
      cost: 'Low ($2-$5 per user/month SaaS license)',
      effort: 'Medium',
      residualScore: 5,
      controls: 'SOC 2 CC6.1 / ISO 27001 A.9.4.2'
    }
  },
  {
    id: 'RSK-03',
    name: 'Critical client database stored on local servers without air-gapped backups',
    category: 'Process',
    likelihood: 3,
    impact: 5,
    score: 15,
    status: 'Inherent',
    mitigation: {
      steps: [
        'Set up automated, nightly encrypted backups to isolated cloud buckets.',
        'Set up air-gapped write-once read-many (WORM) parameters for archive objects.',
        'Run quarterly restoration verification testing.'
      ],
      cost: 'Medium ($100-$300/month backup storage infrastructure costs)',
      effort: 'Medium',
      residualScore: 3,
      controls: 'ISO 27001 A.12.3.1 / SOC 2 CC8.1'
    }
  },
  {
    id: 'RSK-04',
    name: 'Lack of formal developer secure coding training (OWASP Top 10)',
    category: 'Compliance',
    likelihood: 4,
    impact: 3,
    score: 12,
    status: 'Inherent',
    mitigation: {
      steps: [
        'Implement mandatory secure code training modules for engineering staff annually.',
        'Set up static code scanning tools (SAST) in CI/CD pipeline triggers.',
        'Perform mandatory peer security reviews on external gateway query code.'
      ],
      cost: 'Medium (E-learning course licenses)',
      effort: 'High',
      residualScore: 6,
      controls: 'ISO 27001 A.8.28 / GDPR Article 32'
    }
  }
];

export default function RiskRegister() {
  const [risks, setRisks] = useState<RiskItem[]>(INITIAL_RISKS);
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  
  // Custom new risk input fields
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'Infrastructure' | 'Software' | 'Process' | 'Compliance'>('Infrastructure');
  const [newLikelihood, setNewLikelihood] = useState(3);
  const [newImpact, setNewImpact] = useState(3);

  const handleMitigate = (id: string) => {
    setRisks(prev => prev.map(risk => {
      if (risk.id === id) {
        return { 
          ...risk, 
          status: risk.status === 'Controlled' ? 'Inherent' : 'Controlled',
          score: risk.status === 'Controlled' ? risk.likelihood * risk.impact : risk.mitigation.residualScore
        };
      }
      return risk;
    }));
    if (selectedRisk && selectedRisk.id === id) {
      setSelectedRisk(prev => prev ? {
        ...prev,
        status: prev.status === 'Controlled' ? 'Inherent' : 'Controlled',
        score: prev.status === 'Controlled' ? prev.likelihood * prev.impact : prev.mitigation.residualScore
      } : null);
    }
  };

  const handleAddRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const likelihood = Number(newLikelihood);
    const impact = Number(newImpact);

    const newRisk: RiskItem = {
      id: `RSK-0${risks.length + 1}`,
      name: newName,
      category: newCategory,
      likelihood,
      impact,
      score: likelihood * impact,
      status: 'Inherent',
      mitigation: {
        steps: [
          'Document asset mapping structure and audit credentials.',
          'Define access restrictions and network isolation strategies.',
          'Conduct testing protocols at defined intervals.'
        ],
        cost: 'TBD upon operational deployment',
        effort: 'Medium',
        residualScore: Math.ceil((likelihood * impact) * 0.25),
        controls: 'NIST CSF v2.0 Controls'
      }
    };

    setRisks(prev => [...prev, newRisk]);
    setNewName('');
    setShowAddForm(false);
  };

  // Determine threat level color
  const getScoreColor = (score: number) => {
    if (score >= 15) return '#ff0844'; // critical red
    if (score >= 9) return '#fda085';  // high orange
    if (score >= 4) return '#00f2fe';  // medium cyan
    return '#38f9d7';                  // low green
  };

  return (
    <div className="cyber-grid-container">
      
      {/* 5x5 Likelihood / Impact Heat Map Grid */}
      <div className="cyber-panel" style={{ gridColumn: 'span 5', height: '450px', display: 'flex', flexDirection: 'column' }}>
        <h3 className="tech-font" style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <LayoutGrid style={{ width: '18px', height: '18px', color: '#4facfe' }} /> RISK DISTRIBUTION MATRIX
        </h3>

        {/* Matrix Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          <div style={{ display: 'flex', flex: 1 }}>
            {/* Y Axis Label */}
            <div className="tech-font" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '12px', fontWeight: 'bold' }}>
              IMPACT → (1 - 5)
            </div>

            {/* 5x5 Grid cells with premium rounded blocks */}
            <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(5, 1fr)', gap: '6px' }}>
              {[5, 4, 3, 2, 1].map((rowImpact) => (
                <div key={rowImpact} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((colLikelihood) => {
                    const cellScore = rowImpact * colLikelihood;
                    
                    // Filter risks falling into this matrix cell
                    const risksInCell = risks.filter(r => 
                      (r.status === 'Inherent' && r.likelihood === colLikelihood && r.impact === rowImpact) ||
                      (r.status === 'Controlled' && Math.ceil(r.score / rowImpact) === colLikelihood && Math.round(r.score / colLikelihood) === rowImpact)
                    );

                    // Cell backgrounds with organic transparency
                    let bg = 'rgba(67, 233, 123, 0.05)';
                    if (cellScore >= 15) bg = 'rgba(255, 8, 68, 0.15)';
                    else if (cellScore >= 9) bg = 'rgba(254, 160, 133, 0.1)';
                    else if (cellScore >= 4) bg = 'rgba(0, 242, 254, 0.08)';

                    return (
                      <div 
                        key={colLikelihood} 
                        style={{ 
                          background: bg, 
                          border: '1px solid rgba(255,255,255,0.03)', 
                          borderRadius: '8px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          position: 'relative',
                          transition: 'all 0.3s'
                        }}
                      >
                        {/* Cell index guide */}
                        <span style={{ position: 'absolute', top: '3px', left: '6px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', fontWeight: 'bold' }}>
                          {colLikelihood},{rowImpact}
                        </span>

                        {/* Dot indicator representing active risks */}
                        {risksInCell.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', padding: '10px' }}>
                            {risksInCell.map(r => (
                              <button
                                key={r.id}
                                style={{ 
                                  width: '14px', 
                                  height: '14px', 
                                  borderRadius: '50%', 
                                  background: getScoreColor(r.score), 
                                  border: '2px solid #ffffff', 
                                  cursor: 'pointer',
                                  boxShadow: '0 0 8px rgba(0, 0, 0, 0.5)',
                                  transform: 'scale(1)',
                                  transition: 'transform 0.2s'
                                }}
                                className="hover:scale-125"
                                title={`${r.id}: ${r.name}`}
                                onClick={() => setSelectedRisk(r)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* X Axis Label */}
          <div className="tech-font" style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px', marginLeft: '30px', fontWeight: 'bold' }}>
            LIKELIHOOD → (1 - 5)
          </div>
        </div>
      </div>

      {/* Corporate Risk Ledger */}
      <div className="cyber-panel" style={{ gridColumn: 'span 7', height: '450px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="tech-font" style={{ fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <ShieldAlert style={{ width: '18px', height: '18px', color: '#ff527b' }} /> RISKS LEDGER
          </h3>
          <button 
            className="cyber-btn cyber-btn-success"
            style={{ padding: '8px 16px', fontSize: '0.75rem' }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus style={{ width: '14px', height: '14px' }} /> Register Risk
          </button>
        </div>

        {/* Add Risk form Overlay */}
        {showAddForm && (
          <form onSubmit={handleAddRisk} style={{ background: 'rgba(7, 9, 21, 0.85)', border: '1px solid rgba(0,242,254,0.2)', padding: '20px', borderRadius: '14px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 className="tech-font" style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>REGISTER COMPLIANCE RISK</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text"
                placeholder="Risk Description (e.g. Lack of database encryption)..."
                className="cyber-input"
                style={{ fontSize: '0.75rem', flex: 2 }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <select 
                className="cyber-select" 
                style={{ fontSize: '0.75rem', flex: 1 }}
                value={newCategory}
                onChange={(e: any) => setNewCategory(e.target.value)}
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Software">Software</option>
                <option value="Process">Process</option>
                <option value="Compliance">Compliance</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.75rem' }}>
                <span>Likelihood (1-5):</span>
                <input type="number" min="1" max="5" className="cyber-input" style={{ width: '60px', padding: '6px' }} value={newLikelihood} onChange={(e) => setNewLikelihood(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.75rem' }}>
                <span>Impact (1-5):</span>
                <input type="number" min="1" max="5" className="cyber-input" style={{ width: '60px', padding: '6px' }} value={newImpact} onChange={(e) => setNewImpact(Number(e.target.value))} />
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                <button type="button" className="cyber-btn cyber-btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="cyber-btn cyber-btn-success" style={{ padding: '6px 12px' }}>Confirm Add</button>
              </div>
            </div>
          </form>
        )}

        {/* Ledger Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', padding: '10px' }} className="tech-font">ID</th>
                <th style={{ textAlign: 'left', padding: '10px' }} className="tech-font">RISK IDENTIFICATION</th>
                <th style={{ textAlign: 'center', padding: '10px' }} className="tech-font">SCORE</th>
                <th style={{ textAlign: 'center', padding: '10px' }} className="tech-font">STATUS</th>
                <th style={{ textAlign: 'center', padding: '10px' }} className="tech-font">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((risk) => (
                <tr key={risk.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: selectedRisk?.id === risk.id ? 'rgba(0, 242, 254, 0.03)' : 'transparent' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold' }} className="mono-font">{risk.id}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{risk.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>Category: {risk.category}</div>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <span 
                      className="tech-font" 
                      style={{ 
                        fontWeight: '800', 
                        color: getScoreColor(risk.score)
                      }}
                    >
                      {risk.score}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <span className={`cyber-badge ${risk.status === 'Controlled' ? 'cyber-badge-green' : 'cyber-badge-red'}`}>
                      {risk.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <button 
                      className="cyber-btn"
                      style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                      onClick={() => setSelectedRisk(risk)}
                    >
                      Remediate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Risk Mitigation Details Modal Card */}
      {selectedRisk && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 8, 17, 0.65)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="cyber-panel fade-in" style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(0, 242, 254, 0.25)', boxShadow: '0 30px 70px -10px rgba(0,0,0,0.8)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield style={{ color: '#00f2fe', width: '20px', height: '20px' }} />
                <h3 className="tech-font" style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>MITIGATION COMPLIANCE BLUEPRINT [{selectedRisk.id}]</h3>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSelectedRisk(null)}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div>
              <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RISK ITEM:</strong>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '4px', color: '#fff' }}>{selectedRisk.name}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>INHERENT RISK INDEX</div>
                <div className="tech-font" style={{ fontSize: '1.25rem', fontWeight: '800', color: getScoreColor(selectedRisk.likelihood * selectedRisk.impact), marginTop: '4px' }}>
                  Score: {selectedRisk.likelihood * selectedRisk.impact}
                </div>
              </div>
              <div style={{ background: 'rgba(67, 233, 123, 0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(67, 233, 123, 0.15)' }}>
                <div style={{ fontSize: '0.7rem', color: '#38f9d7', fontWeight: 'bold' }}>RESIDUAL RISK INDEX</div>
                <div className="tech-font" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#38f9d7', marginTop: '4px' }}>
                  Score: {selectedRisk.mitigation.residualScore}
                </div>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: '0.75rem', color: '#38f9d7', display: 'flex', alignItems: 'center', gap: '6px' }} className="tech-font">
                <Sparkles style={{ width: '14px', height: '14px' }} /> PRE-ENGINEERED MITIGATION PLAN:
              </strong>
              <ol style={{ listStyle: 'none', paddingLeft: 0, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                {selectedRisk.mitigation.steps.map((step, index) => (
                  <li key={index} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #00f2fe', color: 'var(--text-secondary)' }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Estimated Cost:</strong> <span style={{ color: '#fff', fontWeight: '500' }}>{selectedRisk.mitigation.cost}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Compliance Mapping:</strong> <span style={{ color: '#00f2fe', fontWeight: '600' }} className="tech-font">{selectedRisk.mitigation.controls}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="cyber-btn cyber-btn-secondary" 
                onClick={() => setSelectedRisk(null)}
              >
                Close Blueprint
              </button>
              <button 
                className={`cyber-btn ${selectedRisk.status === 'Controlled' ? 'cyber-btn-danger' : 'cyber-btn-success'}`}
                onClick={() => handleMitigate(selectedRisk.id)}
              >
                {selectedRisk.status === 'Controlled' ? 'De-activate Controls' : 'Deploy Countermeasures'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
