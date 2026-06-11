'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { DashboardContext } from '../../components/DashboardContext';
import { API_BASE_URL } from '../../services/apiConfig';
import { usePrefetchDashboardData } from '../../hooks/useDashboardData';
import MetricsGuide from '../../components/MetricsGuide';

const companyStyles = {
  default: {
    logo: '/logos/logo.png',
    primaryColor: '#2563EB',
    secondaryColor: '#3B82F6',
    name: 'PROMOTER',
    bgGradient: 'from-zinc-50 to-blue-50',
  },
};

const PALETTE = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'];
const PALETTE_2 = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const hashIndex = (id, len) =>
  id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % len;

const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const calcPrevDates = (start) => {
  const d = new Date(start);
  d.setMonth(d.getMonth() - 6);
  const prevStart = d.toISOString().split('T')[0];
  const prevEndDate = new Date(start);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  return { start: prevStart, end: prevEndDate.toISOString().split('T')[0] };
};

const DATE_PRESETS = [
  { label: '7 giorni', days: 7 },
  { label: '30 giorni', days: 30 },
  { label: '90 giorni', days: 90 },
  { label: 'YoY', days: 365 },
];

const applyPreset = (preset) => {
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - preset.days);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - preset.days);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    prevStart: prevStart.toISOString().split('T')[0],
    prevEnd: prevEnd.toISOString().split('T')[0],
  };
};

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const prefetch = usePrefetchDashboardData();

  const [props, setProps] = useState([]);
  const [selectedProp, setSelectedProp] = useState('');
  const [companyData, setCompanyData] = useState({});
  const [dates, setDates] = useState({ start: '2026-01-01', end: getYesterday() });
  const [compareMode, setCompareMode] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const applyPresetDates = (preset) => {
    const { start, end } = applyPreset(preset);
    setDates({ start, end });
  };

  const prevDates = calcPrevDates(dates.start);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/properties`)
      .then((r) => r.json())
      .then((p) => {
        if (p && p.length > 0) {
          setProps(p);
          setSelectedProp(p[0].id);
          const styles = {};
          p.forEach((prop) => {
            styles[prop.id] = {
              logo: `/logos/logo.png`,
              primaryColor: PALETTE[hashIndex(prop.id, PALETTE.length)],
              secondaryColor: PALETTE_2[hashIndex(prop.id, PALETTE_2.length)],
              name: prop.name,
            };
          });
          setCompanyData(styles);
        }
      })
      .catch((err) => console.error('Errore caricamento proprietà:', err));
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://tile.openstreetmap.org';
    document.head.appendChild(preconnect);
  }, []);

  const handleMouseEnterFilters = () => {
    if (selectedProp) {
      prefetch({ selectedProp, dates, prevDates, compareMode });
    }
  };

  const currentStyle = companyData[selectedProp] || companyStyles.default;

  const ctxValue = {
    props,
    selectedProp,
    setSelectedProp,
    dates,
    setDates,
    compareMode,
    setCompareMode,
    prevDates,
    currentStyle,
  };

  return (
    <DashboardContext.Provider value={ctxValue}>
      <div className="min-h-screen p-3 md:p-8 font-sans bg-dashboard-light">

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[9999] lg:hidden">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Navigazione</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                  const href = `/dashboard/page-${num}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={num}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={() => {
                        if (selectedProp) {
                          prefetch({ selectedProp, dates, prevDates, compareMode });
                        }
                      }}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-200 ${
                        active
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black ${
                        active ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {num}
                      </span>
                      {`PAGINA ${num}`}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div
            className="sticky top-0 z-50 -mx-3 md:-mx-8 px-3 md:px-8 py-2 md:py-3 mb-4 md:mb-6 glass-strong rounded-2xl"
            onMouseEnter={handleMouseEnterFilters}
          >
            {/* Top row: logo + hamburger + desktop controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Apri menu"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {currentStyle?.logo && (
                  <img
                    src={currentStyle.logo}
                    alt={currentStyle.name}
                    className="h-8 md:h-12 w-auto object-contain shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <img src="/logos/ga.svg" alt="Google Analytics" className="h-6 md:h-8 w-auto object-contain opacity-70 shrink-0" />
              </div>

              {/* Desktop controls */}
              <div className="hidden lg:flex flex-wrap gap-4 items-center">
                <div className="flex flex-wrap gap-3 items-center glass-strong rounded-xl p-1.5">
                  <select
                    value={selectedProp}
                    onChange={(e) => setSelectedProp(e.target.value)}
                    className="px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider outline-none bg-white text-slate-700 border border-slate-200 cursor-pointer min-h-[44px]"
                  >
                    <option value="">Seleziona Account...</option>
                    {props.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <div className="flex gap-2 text-xs font-bold items-center border-l border-slate-200 pl-3 text-slate-500">
                    <input type="date" value={dates.start} onChange={(e) => setDates({ ...dates, start: e.target.value })} className="outline-none bg-transparent cursor-pointer text-slate-700 min-h-[44px]" />
                    <span>→</span>
                    <input type="date" value={dates.end} onChange={(e) => setDates({ ...dates, end: e.target.value })} className="outline-none bg-transparent cursor-pointer text-slate-700 min-h-[44px]" />
                  </div>
                  <div className="flex gap-1 items-center border-l border-slate-200 pl-3">
                    {DATE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyPresetDates(preset)}
                        className="px-3 py-2 rounded-md text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all min-h-[44px]"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setGuideOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all min-h-[44px]"
                  type="button"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Guida
                </button>

                <UserButton afterSignOutUrl="/login" />
              </div>

              {/* Mobile actions */}
              <div className="flex lg:hidden items-center gap-2">
                <button
                  onClick={() => setGuideOpen(true)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <UserButton afterSignOutUrl="/login" />
              </div>
            </div>

            {/* Mobile filters toggle */}
            <div className="lg:hidden mt-2">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white/60 border border-slate-200/60 hover:bg-white transition-colors min-h-[44px]"
                type="button"
              >
                <span>Filtri e date</span>
                <svg
                  className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {filtersOpen && (
                <div className="mt-2 space-y-3 p-3 bg-white/60 rounded-xl border border-slate-200/60">
                  <select
                    value={selectedProp}
                    onChange={(e) => setSelectedProp(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider outline-none bg-white text-slate-700 border border-slate-200 cursor-pointer"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="">Seleziona Account...</option>
                    {props.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <input
                      type="date" value={dates.start}
                      onChange={(e) => setDates({ ...dates, start: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-lg outline-none bg-white text-slate-700 border border-slate-200 cursor-pointer"
                      style={{ fontSize: '16px' }}
                    />
                    <span>→</span>
                    <input
                      type="date" value={dates.end}
                      onChange={(e) => setDates({ ...dates, end: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-lg outline-none bg-white text-slate-700 border border-slate-200 cursor-pointer"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {DATE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyPresetDates(preset)}
                        className="flex-1 px-3 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all border border-slate-200/60"
                        type="button"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <MetricsGuide open={guideOpen} onClose={() => setGuideOpen(false)} />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-wrap gap-2 mb-8 print:hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const href = `/dashboard/page-${num}`;
              const active = pathname === href;
              return (
                <Link
                  key={num}
                  href={href}
                  onMouseEnter={() => {
                    if (selectedProp) {
                      prefetch({ selectedProp, dates, prevDates, compareMode });
                    }
                  }}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                    active
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white/60 text-slate-500 border border-slate-200/60 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  {`PAGINA ${num}`}
                </Link>
              );
            })}
          </div>

          {children}
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
