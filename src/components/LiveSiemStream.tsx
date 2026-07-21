import { useState, useEffect, useRef } from 'react';
import { Activity, Pause, Play } from 'lucide-react';

export interface NetworkLog {
  id: string;
  timestamp: string;
  source: string;
  event: string;
  severity: string;
  details: string;
  lat?: number;
  lng?: number;
}

export default function LiveSiemStream() {
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;

    // Connect to WebSocket SIEM feed
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `${protocol}//${window.location.host}/siem`
      : 'ws://localhost:4000/siem';
      
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'SIEM_LOG') {
          setLogs(prev => {
            const newLogs = [...prev, message.data];
            if (newLogs.length > 50) newLogs.shift();
            return newLogs;
          });
        }
      } catch (err) {
        console.error('Failed to parse SIEM WS message', err);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from SIEM WS stream');
    };

    return () => {
      ws.close();
    };
  }, [isPaused]);

  useEffect(() => {
    if (containerRef.current && !isPaused) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  return (
    <div className="cyber-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 className="tech-font" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Activity style={{ width: '16px', height: '16px' }} /> LIVE SIEM LOG STREAM (WEBSOCKET)
        </h3>
        <button 
          className="cyber-btn"
          style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? <Play style={{ width: '12px', height: '12px' }} /> : <Pause style={{ width: '12px', height: '12px' }} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          background: '#03050a', 
          border: '1px solid rgba(0, 240, 255, 0.1)', 
          borderRadius: '4px',
          padding: '10px'
        }}
      >
        {logs.map(log => (
          <div key={log.id} style={{ 
            fontSize: '0.75rem', 
            fontFamily: 'monospace',
            padding: '6px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            color: log.severity === 'critical' ? 'var(--neon-red)' : log.severity === 'warning' ? 'var(--neon-orange)' : 'var(--text-muted)'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>[{log.timestamp}]</span>{' '}
            <span style={{ color: log.severity === 'critical' ? 'var(--neon-red)' : 'var(--neon-cyan)' }}>{log.source}</span>{' '}
            <span>{log.event}</span> - {log.details}
          </div>
        ))}
        {logs.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '20px' }}>
            Connecting to SIEM WebSocket Server...
          </div>
        )}
      </div>
    </div>
  );
}
