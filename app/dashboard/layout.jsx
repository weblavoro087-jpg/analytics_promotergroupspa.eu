'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 🚀 Rimosso UserButton da qui
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Apri menu"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{currentStyle.name}</span>
                </div>
              </div>
              
              {/* Desktop Nav Links / Right Actions */}
              <div className="flex items-center gap-3">
                {/* 🔒 Se nel codice interrotto era presente il tag <UserButton />, è stato del tutto rimosso per evitare errori */}
              </div>
            </div>
          </div>

          {/* Main Content Render */}
          <main className="mt-4">{children}</main>

        </div>
      </div>
    </DashboardContext.Provider>
  );
}
