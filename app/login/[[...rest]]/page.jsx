'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Invia la password a una mini-api per impostare il cookie sicuro
    const res = await fetch('/api/login-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '10px', fontSize: '1.5rem', color: '#111827' }}>Accesso Riservato</h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '20px' }}>Inserisci la password di Promotergroup S.p.A.</p>
        
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          style={{ width: '100%', padding: '12px', border: error ? '2px solid #ef4444' : '1px solid #d1d5db', borderRadius: '6px', marginBottom: '15px', boxSizing: 'border-box' }}
        />
        
        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '-10px', marginBottom: '15px' }}>Password errata. Riprova.</p>}
        
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Entra nel Pannello
        </button>
      </form>
    </div>
  );
}
