import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(error.message);
      setIsError(true);
    } else {
      setMessage('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#02040a', fontFamily: 'Inter, sans-serif' }}>
      <div className="cyber-panel" style={{ width: '400px', padding: '40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Shield size={48} style={{ color: 'var(--neon-cyan)', marginBottom: '15px' }} />
        <h1 className="tech-font" style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '5px' }}>CYBERSENTINEL AI</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '30px' }}>Unified Governance & Command Center</p>
        
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              placeholder="Corporate Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="cyber-input"
              style={{ width: '100%', paddingLeft: '35px' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="cyber-btn" 
            disabled={loading}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', background: 'var(--neon-cyan)', color: '#000', border: 'none' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'SECURE LOGIN via MAGIC LINK'}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '20px', padding: '10px', width: '100%', fontSize: '0.8rem', textAlign: 'center', background: isError ? 'rgba(255, 0, 85, 0.1)' : 'rgba(57, 255, 20, 0.1)', color: isError ? 'var(--neon-red)' : 'var(--neon-green)', border: `1px solid ${isError ? 'var(--neon-red)' : 'var(--neon-green)'}`, borderRadius: '4px' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
