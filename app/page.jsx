'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Controlla se l'utente possiede già il cookie di sblocco della password
    const hasCookie = document.cookie.split('; ').find(row => row.startsWith('site_authenticated='));
    
    if (hasCookie) {
      // Se è già autenticato, lo manda direttamente ai grafici
      router.push('/dashboard/page-1');
    } else {
      // Altrimenti lo scorta alla pagina per inserire la password aziendale
      router.push('/login');
    }
  }, [router]);

  // Schermata di caricamento transitoria elegante
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      fontFamily: 'sans-serif', 
      backgroundColor: '#f9fafb',
      color: '#6b7280' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#111827', marginBottom: '8px' }}>Promotergroup KPI</h2>
        <p>Inizializzazione del pannello di analisi in corso...</p>
      </div>
    </div>
  );
}
