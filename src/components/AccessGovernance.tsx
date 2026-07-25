import { useState } from 'react';
import { Users, UserCheck, UserMinus, ShieldAlert, Key, CheckCircle } from 'lucide-react';

interface EmployeeAccess {
  id: string;
  name: string;
  department: string;
  role: string;
  system: string;
  accessLevel: string;
  lastReviewed: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REVOKED';
}

const MOCK_ACCESS_LIST: EmployeeAccess[] = [
  { id: 'usr-1', name: 'Sarah Jenkins', department: 'Engineering', role: 'Senior Backend Engineer', system: 'AWS Production', accessLevel: 'Admin', lastReviewed: '2025-10-01', status: 'PENDING_REVIEW' },
  { id: 'usr-2', name: 'Michael Chang', department: 'Engineering', role: 'Frontend Developer', system: 'AWS Production', accessLevel: 'Read-Only', lastReviewed: '2025-10-01', status: 'PENDING_REVIEW' },
  { id: 'usr-3', name: 'David Smith', department: 'Sales', role: 'Account Executive', system: 'GitHub (Core Repo)', accessLevel: 'Write', lastReviewed: '2025-09-15', status: 'PENDING_REVIEW' },
  { id: 'usr-4', name: 'Emily Davis', department: 'Marketing', role: 'Content Strategist', system: 'Salesforce', accessLevel: 'Admin', lastReviewed: '2025-07-20', status: 'PENDING_REVIEW' }
];

export default function AccessGovernance() {
  const [accessList, setAccessList] = useState<EmployeeAccess[]>(MOCK_ACCESS_LIST);

  const handleAction = (id: string, action: 'APPROVED' | 'REVOKED') => {
    setAccessList(prev => prev.map(user => 
      user.id === id ? { ...user, status: action, lastReviewed: new Date().toISOString().split('T')[0] } : user
    ));
  };

  const pendingCount = accessList.filter(u => u.status === 'PENDING_REVIEW').length;
  const revokedCount = accessList.filter(u => u.status === 'REVOKED').length;
  const approvedCount = accessList.filter(u => u.status === 'APPROVED').length;

  return (
    <div className="cyber-grid-container">
      <div className="cyber-panel" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="tech-font" style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ color: '#00f2fe' }} /> IDENTITY GOVERNANCE & USER ACCESS REVIEWS (UAR)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Quarterly access attestation to enforce Least Privilege and maintain SOC 2 / ISO 27001 compliance.
          </p>
        </div>
      </div>

      <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
        <div className="cyber-panel" style={{ textAlign: 'center', padding: '15px', border: pendingCount > 0 ? '1px solid var(--neon-orange)' : '' }}>
          <div className="tech-font" style={{ fontSize: '0.7rem', color: 'var(--neon-orange)' }}>PENDING REVIEWS (Q4)</div>
          <div className="tech-font" style={{ fontSize: '2rem', color: '#fff', marginTop: '10px' }}>{pendingCount}</div>
        </div>
        <div className="cyber-panel" style={{ textAlign: 'center', padding: '15px' }}>
          <div className="tech-font" style={{ fontSize: '0.7rem', color: 'var(--neon-green)' }}>APPROVED ACCESS</div>
          <div className="tech-font" style={{ fontSize: '2rem', color: '#fff', marginTop: '10px' }}>{approvedCount}</div>
        </div>
        <div className="cyber-panel" style={{ textAlign: 'center', padding: '15px' }}>
          <div className="tech-font" style={{ fontSize: '0.7rem', color: 'var(--neon-red)' }}>REVOKED</div>
          <div className="tech-font" style={{ fontSize: '2rem', color: '#fff', marginTop: '10px' }}>{revokedCount}</div>
        </div>
      </div>

      <div className="cyber-panel" style={{ gridColumn: 'span 12', minHeight: '300px' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Key size={14} /> ACTIVE ACCESS GRANTS
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>EMPLOYEE</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SYSTEM & LEVEL</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>LAST REVIEWED</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>STATUS</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ATTESTATION</th>
            </tr>
          </thead>
          <tbody>
            {accessList.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover:bg-[rgba(255,255,255,0.02)]">
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{user.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>{user.department} | {user.role}</div>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ color: '#00f2fe', fontSize: '0.85rem' }}>{user.system}</div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    marginTop: '4px',
                    color: user.accessLevel === 'Admin' ? 'var(--neon-red)' : 'var(--neon-green)',
                    background: user.accessLevel === 'Admin' ? 'rgba(255, 0, 85, 0.1)' : 'rgba(57, 255, 20, 0.1)',
                    display: 'inline-block',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {user.accessLevel}
                  </div>
                </td>
                <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {user.lastReviewed}
                </td>
                <td style={{ padding: '16px 12px' }}>
                  {user.status === 'PENDING_REVIEW' && (
                    <span className="cyber-badge cyber-badge-yellow"><ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px' }}/> PENDING</span>
                  )}
                  {user.status === 'APPROVED' && (
                    <span className="cyber-badge cyber-badge-green"><CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }}/> APPROVED</span>
                  )}
                  {user.status === 'REVOKED' && (
                    <span className="cyber-badge cyber-badge-red"><UserMinus size={12} style={{ display: 'inline', marginRight: '4px' }}/> REVOKED</span>
                  )}
                </td>
                <td style={{ padding: '16px 12px' }}>
                  {user.status === 'PENDING_REVIEW' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="cyber-btn cyber-btn-success"
                        style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                        onClick={() => handleAction(user.id, 'APPROVED')}
                      >
                        <UserCheck size={12} style={{ marginRight: '4px' }} /> Approve
                      </button>
                      <button 
                        className="cyber-btn cyber-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.7rem', color: 'var(--neon-red)', borderColor: 'rgba(255,0,85,0.3)' }}
                        onClick={() => handleAction(user.id, 'REVOKED')}
                      >
                         Revoke
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
