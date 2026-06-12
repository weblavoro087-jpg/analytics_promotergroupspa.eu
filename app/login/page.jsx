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
    <div className="min-h-screen flex items-center justify-center p-4 font-sans bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 sm:p-10 rounded-xl shadow-lg"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2.5">Accesso Riservato</h2>
        <p className="text-sm text-gray-500 mb-6">Inserisci la password di Promotergroup S.p.A.</p>

        <input
          type="password"
          placeholder="Password del pannello"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          className={`w-full px-3 py-3 rounded-lg mb-4 outline-none border ${error ? 'border-2 border-red-500' : 'border-gray-300'}`}
        />

        {error && <p className="text-sm font-medium text-red-500 -mt-2 mb-4">Password errata. Riprova.</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[0.95rem] transition-colors"
        >
          Entra nel Pannello
        </button>
      </form>
    </div>
  );
}
