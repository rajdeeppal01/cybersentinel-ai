import { useState } from 'react';
import { Cloud, ShieldAlert, CheckCircle, Server, Database, HardDrive, RefreshCcw } from 'lucide-react';

export interface CloudResource {
  id: string;
  provider: 'AWS' | 'Azure' | 'GCP';
  resourceName: string;
  type: string;
  issue: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'REMEDIATED' | 'ACCEPTED_RISK';
  mappedControl: string;
  justification?: string;
}

export const MOCK_RESOURCES: CloudResource[] = [
  {
    id: 'res-aws-s3-1',
    provider: 'AWS',
    resourceName: 'customer-data-backups-2026',
    type: 'S3 Bucket',
    issue: 'Public Read Access is enabled globally.',
    severity: 'HIGH',
    status: 'OPEN',
    mappedControl: 'SOC 2 CC6.1, ISO 27001 A.9.4.1'
  },
  {
    id: 'res-aws-rds-1',
    provider: 'AWS',
    resourceName: 'prod-transaction-db',
    type: 'RDS Instance',
    issue: 'Storage encryption is not enabled at rest.',
    severity: 'HIGH',
    status: 'OPEN',
    mappedControl: 'SOC 2 CC6.1, HIPAA § 164.312(a)(2)(iv)'
  },
  {
    id: 'res-azure-vm-1',
    provider: 'Azure',
    resourceName: 'jump-server-vm-01',
    type: 'Virtual Machine',
    issue: 'Port 22 (SSH) open to 0.0.0.0/0.',
    severity: 'MEDIUM',
    status: 'OPEN',
    mappedControl: 'SOC 2 CC6.6, ISO 27001 A.13.1.1'
  },
  {
    id: 'res-gcp-iam-1',
    provider: 'GCP',
    resourceName: 'service-account-data-pipeline',
    type: 'IAM Service Account',
    issue: 'Service account has overly permissive Owner role.',
    severity: 'HIGH',
    status: 'REMEDIATED',
    mappedControl: 'ISO 27001 A.9.2.2, DPDPA Section 8'
  }
];

export default function CloudPosture({ resources, onRemediate, onAcceptRisk }: { resources: CloudResource[], onRemediate: (id: string) => void, onAcceptRisk: (id: string, justification: string) => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState<string | null>(null);
  const [justification, setJustification] = useState('');

  const triggerScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // We could add more mock resources here to simulate a scan finding new things
    }, 2000);
  };

  const handleAcceptRisk = () => {
    if (showAcceptModal && justification.trim()) {
      onAcceptRisk(showAcceptModal, justification);
      setShowAcceptModal(null);
      setJustification('');
    }
  };

  return (
    <div className="cyber-grid-container">
      {/* Header Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="tech-font" style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cloud style={{ color: '#00f2fe' }} /> CLOUD SECURITY POSTURE MANAGEMENT (CSPM)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Continuous monitoring and compliance mapping for multi-cloud environments (AWS, Azure, GCP).
          </p>
        </div>
        <button 
          className="cyber-btn"
          style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={triggerScan}
          disabled={isScanning}
        >
          <RefreshCcw className={isScanning ? "spin" : ""} size={14} />
          {isScanning ? 'SCANNING CLOUD ACCOUNTS...' : 'TRIGGER FULL SCAN'}
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
        {[
          { label: 'TOTAL ASSETS MONITORED', value: '4,102' },
          { label: 'OPEN MISCONFIGURATIONS', value: resources.filter(r => r.status === 'OPEN').length },
          { label: 'AUTO-REMEDIATED', value: resources.filter(r => r.status === 'REMEDIATED').length },
          { label: 'ACCEPTED RISKS', value: resources.filter(r => r.status === 'ACCEPTED_RISK').length }
        ].map((metric, i) => (
          <div key={i} className="cyber-panel" style={{ textAlign: 'center', padding: '15px' }}>
            <div className="tech-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{metric.label}</div>
            <div className="tech-font" style={{ fontSize: '2rem', color: '#00f2fe', marginTop: '10px' }}>{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Findings Table */}
      <div className="cyber-panel" style={{ gridColumn: 'span 12', minHeight: '300px' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '15px' }}>
          IDENTIFIED MISCONFIGURATIONS & GRC MAPPINGS
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PROVIDER</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>RESOURCE</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ISSUE</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GRC CONTROL MAPPING</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>STATUS</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((res) => (
              <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover:bg-[rgba(255,255,255,0.02)]">
                <td style={{ padding: '16px 12px', color: '#fff', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {res.provider === 'AWS' ? <Server size={14} color="#ff9900" /> : 
                     res.provider === 'Azure' ? <Database size={14} color="#00a4ef" /> :
                     <HardDrive size={14} color="#4285f4" />}
                    {res.provider}
                  </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{res.resourceName}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>{res.type}</div>
                </td>
                <td style={{ padding: '16px 12px', color: '#fff', fontSize: '0.85rem' }}>
                  {res.issue}
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#b18efd', background: 'rgba(177, 142, 253, 0.1)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    {res.mappedControl}
                  </div>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <span className={`cyber-badge ${res.status === 'OPEN' ? 'cyber-badge-red' : res.status === 'ACCEPTED_RISK' ? 'cyber-badge-yellow' : 'cyber-badge-green'}`}>
                    {res.status === 'OPEN' ? <ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px' }}/> : <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }}/>}
                    {res.status === 'ACCEPTED_RISK' ? 'ACCEPTED' : res.status}
                  </span>
                  {res.status === 'ACCEPTED_RISK' && res.justification && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '150px' }}>
                      Reason: {res.justification}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 12px' }}>
                  {res.status === 'OPEN' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="cyber-btn"
                        style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                        onClick={() => onRemediate(res.id)}
                      >
                        Remediate
                      </button>
                      <button 
                        className="cyber-btn cyber-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                        onClick={() => setShowAcceptModal(res.id)}
                      >
                        Accept Risk
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Accept Risk Modal */}
      {showAcceptModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="cyber-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 className="tech-font" style={{ color: 'var(--neon-yellow)' }}>ACCEPT RISK (EXCEPTION)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Provide a business justification for accepting this cloud misconfiguration. This will be logged for audit purposes.
            </p>
            <textarea
              className="cyber-input mono-font"
              style={{ minHeight: '100px', fontSize: '0.8rem', padding: '10px' }}
              placeholder="e.g. This bucket is intentionally public as it serves static website images."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="cyber-btn cyber-btn-secondary" onClick={() => setShowAcceptModal(null)}>Cancel</button>
              <button className="cyber-btn cyber-btn-success" onClick={handleAcceptRisk} disabled={!justification.trim()}>Log Exception</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
