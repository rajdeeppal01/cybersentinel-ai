import React, { useState } from 'react';
import { ShieldAlert, LogIn } from 'lucide-react';

export const Login = ({ onLogin }: { onLogin: (token: string, role: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('role', data.role);
        onLogin(data.accessToken, data.role);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to authentication server.');
    }
  };

  const handleSetup = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/setup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert('Admin created: ' + data.email + ' / password: admin123');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Setup failed');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div className="cyber-panel glow-border" style={{ width: '400px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <ShieldAlert style={{ width: '40px', height: '40px', color: 'var(--neon-cyan)', marginBottom: '10px' }} />
          <h1 className="tech-font" style={{ fontSize: '1.5rem', margin: 0, textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}>CYBERSENTINEL AI</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '5px' }}>SECURE ACCESS GATEWAY</p>
        </div>

        {error && (
          <div style={{ color: 'var(--neon-red)', background: 'rgba(255, 94, 98, 0.1)', padding: '10px', borderRadius: '4px', border: '1px solid var(--neon-red)', fontSize: '0.8rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>USER IDENTIFICATION</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="cyber-input mono-font" 
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
              placeholder="operator@cybersentinel.local"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>ACCESS KEY</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="cyber-input mono-font" 
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button type="submit" className="cyber-button tech-font" style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <LogIn size={16} /> INITIATE UPLINK
          </button>
        </form>

        <div style={{ borderTop: '1px solid rgba(0, 240, 255, 0.1)', paddingTop: '15px', marginTop: '5px', textAlign: 'center' }}>
          <button onClick={handleSetup} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}>
            First time? Run system setup.
          </button>
        </div>
      </div>
    </div>
  );
};
