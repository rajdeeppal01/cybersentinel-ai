import React, { useState, useEffect } from 'react';
import { Activity, Search, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

interface ThreatLog {
  id: string;
  sourceIp: string;
  destIp: string;
  severity: string;
  detectedThreat: string;
  confidence: number;
  mitreCode: string;
  mitreName: string;
  analysisSummary: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
}

export default function IncidentResponse() {
  const [logs, setLogs] = useState<ThreatLog[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<ThreatLog | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('OPEN');

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    // In a real app we'd also subscribe to WebSocket here for real-time updates
  }, []);

  const handleUpdate = async () => {
    if (!selectedLog) return;
    try {
      const res = await fetch(`http://localhost:4000/api/logs/${selectedLog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolutionNotes: notes })
      });
      if (res.ok) {
        fetchLogs();
        setSelectedLog(null);
      }
    } catch (err) {
      console.error('Failed to update log', err);
    }
  };

  const filteredLogs = logs.filter(l => filter === 'ALL' || l.status === filter);

  return (
    <div className="cyber-grid-container" style={{ position: 'relative' }}>
      
      {/* Header Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="tech-font" style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert style={{ color: '#ff0844' }} /> INCIDENT RESPONSE CENTER
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Manage, triage, and resolve historical threats processed by the LangChain Autonomous Agent.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map(f => (
            <button 
              key={f}
              className={`cyber-btn ${filter === f ? 'active' : ''}`}
              style={{ 
                padding: '8px 16px', 
                fontSize: '0.75rem',
                background: filter === f ? 'var(--grad-cyan)' : 'transparent',
                color: filter === f ? '#06070d' : 'var(--text-muted)'
              }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table Panel */}
      <div className="cyber-panel" style={{ gridColumn: 'span 12', minHeight: '400px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TIMESTAMP</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SEVERITY</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>THREAT</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SOURCE IP</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>STATUS</th>
              <th className="tech-font" style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover:bg-[rgba(255,255,255,0.02)]">
                <td className="mono-font" style={{ padding: '16px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <span className={`cyber-badge ${
                    log.severity === 'CRITICAL' ? 'cyber-badge-red' : 
                    log.severity === 'HIGH' ? 'cyber-badge-orange' : 'cyber-badge-cyan'
                  }`}>
                    {log.severity}
                  </span>
                </td>
                <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
                  {log.detectedThreat}
                  <div style={{ fontSize: '0.7rem', color: '#b18efd', marginTop: '4px' }}>{log.mitreCode} - {log.mitreName}</div>
                </td>
                <td className="mono-font" style={{ padding: '16px 12px', fontSize: '0.8rem', color: '#fff' }}>
                  {log.sourceIp}
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <span style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                    color: log.status === 'OPEN' ? '#ff0844' : log.status === 'INVESTIGATING' ? '#fda085' : '#43e97b'
                  }}>
                    {log.status === 'OPEN' && <Activity size={14} />}
                    {log.status === 'INVESTIGATING' && <Clock size={14} />}
                    {log.status === 'RESOLVED' && <CheckCircle size={14} />}
                    {log.status}
                  </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <button 
                    className="cyber-btn"
                    style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                    onClick={() => {
                      setSelectedLog(log);
                      setStatus(log.status);
                      setNotes(log.resolutionNotes || '');
                    }}
                  >
                    Triage
                  </button>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No threats found matching the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Triage Modal */}
      {selectedLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(6,7,13,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="cyber-panel" style={{ width: '600px', maxWidth: '90%', animation: 'float 4s ease-in-out infinite' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="tech-font" style={{ color: '#fff', fontSize: '1.2rem' }}>INCIDENT TRIAGE</h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>AI ANALYSIS SUMMARY</div>
              <p style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.5' }}>{selectedLog.analysisSummary}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>UPDATE STATUS</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', outline: 'none' }}
              >
                <option value="OPEN">OPEN - Needs Attention</option>
                <option value="INVESTIGATING">INVESTIGATING - Analysis in Progress</option>
                <option value="RESOLVED">RESOLVED - Threat Mitigated</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>RESOLUTION NOTES</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Enter investigation details or mitigation steps taken..."
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="cyber-btn" 
                style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }}
                onClick={() => setSelectedLog(null)}
              >
                Cancel
              </button>
              <button 
                className="cyber-btn"
                style={{ background: 'var(--grad-cyan)', color: '#000' }}
                onClick={handleUpdate}
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
