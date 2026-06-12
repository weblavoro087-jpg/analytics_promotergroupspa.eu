'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Megaphone, Globe, MapPin, Smartphone,
  Target, Repeat, Gauge, Clock, Menu, X, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { DashboardContext } from '../../components/DashboardContext';
import { API_BASE_URL } from '../../services/apiConfig';
import { usePrefetchDashboardData } from '../../hooks/useDashboardData';

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

// Voci di navigazione: nomi reali + icone Lucide (al posto di "Pagina 1-9")
const MENU = [
  { num: 1, name: 'Panoramica', Icon: LayoutDashboard },
  { num: 2, name: 'Acquisizione', Icon: Megaphone },
  { num: 3, name: 'Traffico / Pagine', Icon: Globe },
  { num: 4, name: 'Geografia', Icon: MapPin },
  { num: 5, name: 'Dispositivi', Icon: Smartphone },
  { num: 6, name: 'Performance & Conversioni', Icon: Target },
  { num: 7, name: 'Fidelizzazione', Icon: Repeat },
  { num: 8, name: 'Qualità Sessioni', Icon: Gauge },
  { num: 9, name: 'Analisi Temporale', Icon: Clock },
];

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

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const prefetch = usePrefetchDashboardData();

  const [props, setProps] = useState([]);
  const [selectedProp, setSelectedProp] = useState('');
  const [companyData, setCompanyData] = useState({});
  const [dates, setDates] = useState({ start: '2026-01-01', end: getYesterday() });
  const [compareMode, setCompareMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const hasCookie = document.cookie.split('; ').find(row => row.startsWith('site_authenticated='));
    if (!hasCookie) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;
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
  }, [isAuthorized]);

  if (!isAuthorized) {
    return <div className="min-h-screen bg-zinc-50" />;
  }

  const prevDates = calcPrevDates(dates.start);
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

  // Lista voci riutilizzata da sidebar desktop e drawer mobile
  const renderNav = ({ compact = false, onNavigate } = {}) =>
    MENU.map(({ num, name, Icon }) => {
      const href = `/dashboard/page-${num}`;
      const active = pathname === href;
      return (
        <Link
          key={num}
          href={href}
          title={compact ? name : undefined}
          onClick={onNavigate}
          onMouseEnter={() => {
            if (selectedProp) prefetch({ selectedProp, dates, prevDates, compareMode });
          }}
          className={`flex items-center gap-3 rounded-xl font-bold text-xs transition-all duration-150 ${
            compact ? 'justify-center px-0 py-3' : 'px-3 py-2.5'
          } ${
            active
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2.2} />
          {!compact && <span className="truncate">{name}</span>}
        </Link>
      );
    });

  return (
    <DashboardContext.Provider value={ctxValue}>
      <div className="min-h-screen flex font-sans bg-zinc-50">

        {/* ── Sidebar fissa (desktop) ── */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen bg-white/90 backdrop-blur-md border-r border-slate-200 transition-all duration-300 ${
            collapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className={`flex items-center gap-2 border-b border-slate-200/60 h-[68px] ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
            <img src="/logos/logo.png" alt="Promotergroup" className="h-8 w-auto object-contain shrink-0" />
            {!collapsed && (
              <>
                <span className="h-6 w-px bg-slate-200 shrink-0" />
                <img src="/logos/ga.svg" alt="Google Analytics" className="h-7 w-auto object-contain shrink-0" />
              </>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {renderNav({ compact: collapsed })}
          </nav>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2 m-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title={collapsed ? 'Espandi menu' : 'Comprimi menu'}
          >
            {collapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <><PanelLeftClose className="w-[18px] h-[18px]" /> Comprimi</>}
          </button>
        </aside>

        {/* ── Drawer (mobile) ── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[9999] lg:hidden">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200 flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60">
                <img src="/logos/logo.png" alt="Promotergroup" className="h-7 w-auto object-contain" />
                <button onClick={() => setMobileMenuOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {renderNav({ onNavigate: () => setMobileMenuOpen(false) })}
              </nav>
            </div>
          </div>
        )}

        {/* ── Colonna principale ── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Top header con hamburger (mobile), proprietà e filtro data */}
          <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm px-3 md:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Hamburger + loghi (solo mobile) */}
            <div className="flex items-center gap-2 lg:hidden">
              <button onClick={() => setMobileMenuOpen(true)} className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100">
                <Menu className="w-5 h-5" />
              </button>
              <img src="/logos/logo.png" alt="Promotergroup" className="h-7 w-auto object-contain shrink-0" />
              <span className="h-6 w-px bg-slate-200 shrink-0" />
              <img src="/logos/ga.svg" alt="Google Analytics" className="h-6 w-auto object-contain shrink-0" />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:ml-auto">
              {/* Dropdown Proprietà */}
              {props.length > 0 && (
                <select
                  value={selectedProp}
                  onChange={(e) => setSelectedProp(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
                >
                  {props.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              {/* Filtro Data */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">Periodo</span>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Da</label>
                  <input
                    type="date"
                    value={dates.start}
                    max={dates.end}
                    onChange={(e) => setDates((d) => ({ ...d, start: e.target.value }))}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">A</label>
                  <input
                    type="date"
                    value={dates.end}
                    min={dates.start}
                    max={getYesterday()}
                    onChange={(e) => setDates((d) => ({ ...d, end: e.target.value }))}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer focus:border-blue-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCompareMode((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    compareMode
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  ⟳ Confronto
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-3 md:p-6">{children}</main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
