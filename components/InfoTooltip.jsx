'use client';
import { useState, useRef, useEffect } from 'react';

const DEFINITIONS = {
  'totalUsers': 'Utenti totali: numero di utenti unici che hanno visitato il sito nel periodo selezionato. GA4 conteggia un utente una sola volta per periodo.',
  'activeUsers': 'Utenti attivi: utenti che hanno avuto almeno una sessione coinvolta (engaged session) nel periodo. Sottoinsieme degli utenti totali, indica utenti realmente interagiti.',
  'newUsers': 'Nuovi utenti: utenti che hanno visitato il sito per la prima volta nel periodo selezionato (basato sul primo avvio del dispositivo/client).',
  'sessions': 'Sessioni: numero totale di sessioni iniziate. Una sessione raggruppa le interazioni di un utente in un arco temporale continuo.',
  'bounceRate': 'Frequenza di rimbalzo: percentuale di sessioni che non hanno generato alcuna interazione (nessun evento inviato oltre al primo page_view). In GA4 NON è più la metrica standard, sostituita da Engagement Rate.',
  'engagementRate': 'Tasso di coinvolgimento: percentuale di sessioni coinvolgenti (engaged sessions) sul totale. Una sessione è "coinvolta" se dura ≥10 secondi, ha ≥2 page_view, o ha un evento di conversione.',
  'avgDuration': 'Durata media sessione: tempo medio (in minuti:secondi) che gli utenti trascorrono sul sito per sessione. Calcolato sulla durata complessiva delle sessioni.',
  'exitRate': 'Tasso di uscita: percentuale di sessioni in cui una specifica pagina è stata l\'ultima visualizzata. NON va confuso con Bounce Rate (che misura sessioni senza interazione).',
  'conversionRate': 'Tasso di conversione: percentuale di sessioni che hanno generato almeno un evento chiave (key event) rispetto al totale delle sessioni.',
  'keyEvents': 'Eventi chiave: numero totale di eventi marcati come "key event" in GA4 (es. acquisti, registrazioni, invio form). Misura le azioni di valore.',
  'revenue': 'Ricavi totali: somma dei ricavi generati dalle transazioni e-commerce o dagli eventi di acquisto tracciati in GA4.',
  'sessionsPerUser': 'Sessioni per utente: rapporto medio tra numero di sessioni e utenti unici. Indica la frequenza di ritorno degli utenti.',
  'avgEngagementTime': 'Tempo di coinvolgimento medio: tempo medio per utente in cui il sito era in primo piano e l\'utente stava interagendo. Più accurato della semplice durata sessione.',
  'retention': 'Retention: percentuale di utenti che ritornano al sito dopo la prima visita. Misurata a intervalli (giorno 1, giorno 7, giorno 30).',
  'returningUsers': 'Utenti di ritorno: utenti che hanno già visitato il sito in precedenza e tornano nel periodo corrente.',
  'stickiness': 'Stickiness score: rapporto tra utenti attivi giornalieri (DAU) e utenti attivi mensili (MAU). Più alto è, più gli utenti sono fedeli e usano il sito quotidianamente.',
  'churn': 'Tasso di abbandono: percentuale di utenti che smettono di interagire con il sito in un dato periodo. Complementare alla retention.',
  'engagementTime': 'Tempo di coinvolgimento: tempo totale in cui il sito web è stato in primo piano nel browser dell\'utente, escludendo i periodi di inattività. Metrica GA4 più accurata della durata sessione tradizionale.',
  'pageViews': 'Visualizzazioni di pagina: numero totale di pagine visualizzate. Include visualizzazioni ripetute della stessa pagina.',
  'uniquePageViews': 'Visualizzazioni uniche: numero di sessioni in cui una specifica pagina è stata visualizzata almeno una volta. Ogni sessione conta al massimo 1 per pagina.',
  'scrollDepth': 'Profondità di scorrimento: percentuale di utenti che hanno raggiunto determinate profondità di scroll (25%, 50%, 75%, 100%) sulla pagina.',
  'eventsPerSession': 'Eventi per sessione: numero medio di eventi GA4 inviati per ogni sessione. Indica il livello di interazione complessivo.',
  'sources': 'Sorgenti di traffico: origine del traffico (es. google, facebook, direct, email). Mostra da dove arrivano gli utenti.',
  'medium': 'Mezzo (Medium): categoria del traffico (es. organic, cpc, referral, email, social). Classifica il tipo di canale.',
  'campaign': 'Campagna: nome della campagna di marketing associata al traffico (da parametri UTM).',
  'channelGrouping': 'Raggruppamento canale: classificazione automatica di GA4 che aggrega sorgente+mezzo in macro-categorie (Search, Social, Direct, Referral, etc.).',
  'deviceCategory': 'Categoria dispositivo: tipologia di dispositivo usato (desktop, mobile, tablet).',
  'city': 'Città: città di origine dell\'utente (basata sull\'indirizzo IP, approssimativa).',
  'country': 'Paese: paese di origine dell\'utente.',
  'eventCount': 'Conteggio eventi: numero totale di occorrenze di un evento GA4 specifico (es. page_view, session_start, purchase).',
  'avgSessionDuration': 'Durata media sessione: tempo medio calcolato tra il primo e l\'ultimo evento di ogni sessione.',
  'engagedSessions': 'Sessioni coinvolgenti: sessioni che durano ≥10 secondi, hanno ≥2 page_view, o hanno un evento di conversione.',
  'exitPages': 'Pagine di uscita: pagine in cui gli utenti terminano la sessione. Alti tassi di uscita possono indicare contenuti o UX problematici.',
  'landingPages': 'Pagine di atterraggio: pagine attraverso cui gli utenti entrano nel sito. Le prime impressioni sono critiche per l\'engagement.',
  'freemium': 'Modello freemium: strategia che offre funzionalità base gratuite e funzionalità premium a pagamento.',
  'activation': 'Attivazione: momento in cui l\'utente sperimenta per la prima volta il valore del prodotto (es. completamento onboarding, primo risultato utile).',
  'pagePath': 'Percorso pagina: URL relativo della pagina visitata (es. /prodotti, /chi-siamo).',
};

export default function InfoTooltip({ term, definition, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const text = definition || DEFINITIONS[term];
  if (!text) return null;

  return (
    <span ref={ref} className={`relative inline-flex items-center ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-black
          text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer
          border border-slate-300 hover:border-blue-300"
        aria-label={`Info su ${term}`}
        type="button"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl p-3 text-left">
            <p className="text-[10px] leading-relaxed text-slate-700 font-medium whitespace-pre-line">{text}</p>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white/95" />
        </div>
      )}
    </span>
  );
}
