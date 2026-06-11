import { redirect } from 'next/navigation';

export default function Home() {
  // Spinge l'utente direttamente sulla pagina 1 della dashboard
  redirect('/dashboard/page-1');
}
