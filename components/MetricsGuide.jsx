'use client';
import { useState } from 'react';

const SECTIONS = [
  {
    label: 'KPI Principali',
    id: 'kpi',
    items: [
      { term: 'Utenti Totali (Total Users)', def: 'Numero di utenti unici che hanno avviato almeno una sessione nel periodo. GA4 identifica l\'utente tramite un identificatore anonimo (Client ID) memorizzato nel browser.' },
      { term: 'Utenti Attivi (Active Users)', def: 'Utenti che hanno avuto almeno una sessione coinvolta, cioè con interazioni significative. Metrica chiave per valutare il traffico di qualità.' },
      { term: 'Nuovi Utenti (New Users)', def: 'Utenti che interagiscono per la prima volta con il sito. Identificati dall\'assenza di un Client ID preesistente sul dispositivo.' },
      { term: 'Sessioni (Sessions)', def: 'Una sessione raggruppa tutte le interazioni di un utente in un arco temporale continuo. In GA4 una sessione termina dopo 30 minuti di inattività.' },
      { term: 'Frequenza di Rimbalzo (Bounce Rate)', def: 'Percentuale di sessioni che NON hanno generato interazioni. In GA4, a differenza di Universal Analytics, il bounce è definito come sessione con 0 engagement (nessun evento inviato oltre al page_view iniziale).' },
      { term: 'Tasso di Coinvolgimento (Engagement Rate)', def: 'Percentuale di sessioni coinvolgenti sul totale. È la metrica complementare al Bounce Rate in GA4 (Engagement Rate = 1 - Bounce Rate). Sessioni coinvolgenti = durata ≥10s, ≥2 page_view o evento di conversione.' },
      { term: 'Durata Media Sessione', def: 'Tempo medio trascorso dagli utenti in una sessione. Calcolato come differenza tra il timestamp dell\'ultimo e del primo evento della sessione.' },
      { term: 'Tasso di Conversione', def: 'Percentuale di sessioni che hanno innescato almeno un evento chiave (key event). Misura l\'efficacia del sito nel trasformare visite in azioni di valore.' },
    ],
  },
  {
    label: 'Traffico e Acquisizione',
    id: 'traffic',
    items: [
      { term: 'Sorgente (Source)', def: 'Origine del traffico (es. google, facebook, newsletter). Indica da dove proviene l\'utente prima di arrivare al sito.' },
      { term: 'Mezzo (Medium)', def: 'Categoria del canale di traffico (es. organic — ricerca gratis, cpc — a pagamento, referral — link esterno, email, social).' },
      { term: 'Raggruppamento Canale', def: 'Classificazione automatica GA4 che aggrega source/medium in macro-gruppi: Organic Search, Paid Search, Social, Direct, Email, Referral, etc.' },
      { term: 'Utenti per Canale', def: 'Distribuzione degli utenti per canale di acquisizione. Mostra quali canali portano più visitatori e come si comportano.' },
      { term: 'Confronto Periodi (Compare Mode)', def: 'Modalità che confronta i dati del periodo selezionato con lo stesso periodo precedente (es. 7gg vs 7gg prima). Mostra variazioni assolute e percentuali.' },
    ],
  },
  {
    label: 'Pagine e Contenuti',
    id: 'pages',
    items: [
      { term: 'Pagine di Atterraggio (Landing Pages)', def: 'Pagine attraverso cui gli utenti entrano nel sito. Sono critiche perché determinano la prima impressione e influenzano il tasso di rimbalzo.' },
      { term: 'Tasso di Uscita (Exit Rate)', def: 'Percentuale di sessioni in cui una specifica pagina è stata l\'ultima visualizzata. Alto exit rate su pagine chiave (es. checkout, contatti) può indicare problemi UX.' },
      { term: 'Visualizzazioni di Pagina (Page Views)', def: 'Numero totale di volte che una pagina è stata visualizzata. Include visite ripetute nella stessa sessione.' },
      { term: 'Tempo Medio sulla Pagina', def: 'Tempo medio che gli utenti trascorrono su una specifica pagina prima di navigare altrove.' },
    ],
  },
  {
    label: 'Eventi e Conversioni',
    id: 'events',
    items: [
      { term: 'Eventi (Events)', def: 'Ogni interazione tracciata in GA4 è un evento. Esempi: page_view, scroll, click, purchase. Gli eventi sono la base di tutto il tracciamento GA4.' },
      { term: 'Eventi Chiave (Key Events)', def: 'Eventi marcati dall\'utente come importanti (es. acquisto completato, registrazione). Sostituiscono le "conversioni" di Universal Analytics.' },
      { term: 'Eventi per Sessione', def: 'Numero medio di eventi inviati per sessione. Indica il livello di interazione e coinvolgimento degli utenti con il sito.' },
      { term: 'Valore Evento (Event Value)', def: 'Valore monetario associato a un evento (es. valore dell\'acquisto, valore del lead). Utilizzato per calcolare il ROI delle campagne.' },
    ],
  },
  {
    label: 'Utenti e Fidelizzazione',
    id: 'retention',
    items: [
      { term: 'Retention (Fidelizzazione)', def: 'Percentuale di utenti che tornano al sito dopo la prima visita. Misurata a 1, 3, 7, 14, 30 giorni. Più alta è, più il prodotto/servizio è coinvolgente.' },
      { term: 'Nuovi vs Di Ritorno', def: 'Rapporto tra nuovi visitatori e visitatori che hanno già visitato il sito in passato. Un buon rapporto indica un sano mix di acquisizione e retention.' },
      { term: 'Stickiness Score', def: 'Rapporto tra Utenti Attivi Giornalieri (DAU) e Utenti Attivi Mensili (MAU). Un punteggio >40% indica alta fedeltà. Si calcola come: (DAU / MAU) × 100.' },
      { term: 'Engagement Medio', def: 'Tempo medio di coinvolgimento per utente. Include solo i periodi in cui il sito era in primo piano e l\'utente stava interagendo attivamente.' },
    ],
  },
  {
    label: 'Geografico e Dispositivi',
    id: 'geo',
    items: [
      { term: 'Città / Paese', def: 'Localizzazione geografica approssimativa dell\'utente basata sull\'indirizzo IP. Utile per campagne localizzate e analisi di mercato.' },
      { term: 'Categoria Dispositivo', def: 'Tipologia di dispositivo utilizzato: desktop, mobile, tablet. Fondamentale per ottimizzare l\'esperienza utente per ogni device.' },
      { term: 'Browser / OS', def: 'Browser e sistema operativo utilizzati dagli utenti. Aiuta a identificare problemi di compatibilità e a prioritizzare gli sforzi di sviluppo.' },
      { term: 'Mappa di Calore (Heatmap)', def: 'Rappresentazione visiva della concentrazione di utenti sulla mappa geografica. I cerchi più grandi indicano maggiore densità di traffico.' },
    ],
  },
  {
    label: 'Analisi Temporale',
    id: 'time',
    items: [
      { term: 'Traffico per Ora', def: 'Distribuzione delle sessioni nelle 24 ore. Identifica i picchi di traffico e i momenti migliori per pubblicare contenuti o lanciare campagne.' },
      { term: 'Giorni della Settimana', def: 'Andamento del traffico nei diversi giorni della settimana. Utile per confrontare weekend vs giorni feriali.' },
      { term: 'Delta Orario (Compare Mode)', def: 'Variazione del traffico tra due periodi, analizzata ora per ora. Evidenzia cambiamenti nei pattern di navigazione degli utenti.' },
      { term: 'Giorni Critici', def: 'Giorni con le maggiori variazioni di traffico rispetto al periodo precedente. Segnala anomalie positive o negative da approfondire.' },
    ],
  },
  {
    label: 'Qualità Sessione',
    id: 'quality',
    items: [
      { term: 'Sessioni Coinvolgenti', def: 'Sessioni che rispettano almeno uno di questi criteri: durata ≥10 secondi, almeno 2 page_view, o un evento di conversione. Misurano la qualità reale del traffico.' },
      { term: 'Tasso di Coinvolgimento per Sorgente', def: 'Percentuale di sessioni coinvolgenti suddivisa per sorgente di traffico. Identifica quali canali portano traffico di qualità vs traffico superficiale.' },
      { term: 'Durata Media vs Coinvolgimento', def: 'Correlazione tra tempo speso sul sito e qualità dell\'interazione. Sessioni lunghe ma con basso coinvolgimento possono indicare pagine lente o contenuti poco pertinenti.' },
    ],
  },
];

export default function MetricsGuide({ open, onClose }) {
  const [activeSection, setActiveSection] = useState('kpi');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-12 md:pt-20">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 shrink-0">
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Guida alle Metriche</h2>
            <p className="text-[9px] text-slate-500 font-bold mt-0.5">Glossario GA4 — tutti gli indicatori del dashboard spiegati</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar nav — orizzontale su mobile, verticale da md in su */}
          <div className="flex md:flex-col md:w-48 shrink-0 border-b md:border-b-0 md:border-r border-slate-200/60 overflow-x-auto md:overflow-y-auto bg-slate-50/40 p-3 gap-1 md:gap-0">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`shrink-0 md:w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap md:whitespace-normal md:mb-1 ${
                  activeSection === sec.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'
                }`}
                type="button"
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {SECTIONS.find(s => s.id === activeSection)?.items.map((item, i) => (
              <div key={i} className="mb-5 last:mb-0">
                <p className="text-[11px] font-black text-slate-800 mb-1">{item.term}</p>
                <p className="text-[10px] leading-relaxed text-slate-600">{item.def}</p>
                {i < (SECTIONS.find(s => s.id === activeSection)?.items.length || 0) - 1 && (
                  <div className="mt-4 border-t border-slate-100" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
