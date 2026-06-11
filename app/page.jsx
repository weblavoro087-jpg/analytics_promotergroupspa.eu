import { redirect } from 'next/navigation';

export default function Home() {
  // Riorbita l'utente alla cartella principale della dashboard
  redirect('/dashboard');
}
