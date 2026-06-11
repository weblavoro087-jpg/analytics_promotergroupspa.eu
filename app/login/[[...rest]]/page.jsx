'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Invia la password alla mini-api per impostare il cookie sicuro
    const res = await fetch('/api/login-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      // 🚀 CORRETTO: Spinge l'utente sulla pagina reale evitando il 404
      router.push('/dashboard/page-1');
      router.refresh();
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '10px', fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Accesso Riservato</h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '25px' }}>Inserisci la password di Promotergroup S.p.A.</p>
        
        <input 
          type="password" 
          placeholder="Password del pannello" 
          value={password} 
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          style={{ width: '100%', padding: '12px', border: error ? '2px solid #ef4444' : '1px solid #d1d5db', borderRadius: '8px', marginBottom: '15px', boxSizing: 'border-box', outline: 'none' }}
        />
        
        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '-10px', marginBottom: '15px', fontWeight: '500' }}>Password errata. Riprova.</p>}
        
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', transition: 'background 0.2s' }}>
          Entra nel Pannello
        </button>
      </form>
    </div>
  );
}
