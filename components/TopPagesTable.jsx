'use client';
import React, { useMemo, useState } from 'react';
import { calcSmartDelta } from '../utils/calcDelta';
import TableSearchFilter from './TableSearchFilter';
import CsvExportButton from './CsvExportButton';
import InfoTooltip from './InfoTooltip';

const TopPagesTable = React.memo(({ topPages, prevTopPages, compareMode, dates }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const pages = topPages || [];
  const prevPages = prevTopPages || [];

  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;
    const q = searchQuery.toLowerCase();
    return pages.filter(p => p.title.toLowerCase().includes(q));
  }, [pages, searchQuery]);

  const getDelta = (title) => {
    const curr = pages.find(p => p.title === title);
    const prev = prevPages.find(p => p.title === title);
    if (!curr || !prev) return null;
    return calcSmartDelta(curr.views, prev.views);
  };

  const csvColumns = useMemo(() => [
    { label: 'Titolo Pagina', key: 'title' },
    { label: 'Visualizzazioni', key: 'views' },
  ], []);

  return (
    <div className="glass-card min-h-[400px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            Pagine più viste
            <InfoTooltip definition="Classifica delle pagine con il maggior numero di visualizzazioni uniche (utenti). Ogni riga mostra il titolo della pagina e il totale utenti che l'hanno visitata. In modalità confronto viene mostrata anche la differenza rispetto al periodo precedente." />
          </p>
          {compareMode && prevPages.length > 0 && (
            <p className="text-[10px] font-bold text-blue-400/70">Delta vs periodo precedente</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32">
            <TableSearchFilter value={searchQuery} onChange={setSearchQuery} placeholder="Cerca..." />
          </div>
          <CsvExportButton data={filteredPages} columns={csvColumns} filename={`top-pages-${dates?.start}-${dates?.end}.csv`} />
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto h-[300px]">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-500 border-b border-slate-200/50">
              <th className="pb-2 whitespace-nowrap">TITOLO PAGINA</th>
              <th className="pb-2 text-right whitespace-nowrap">VISUALIZZAZIONI</th>
              {compareMode && <th className="pb-2 text-right whitespace-nowrap">Δ</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPages.map((page, i) => {
              const delta = compareMode ? getDelta(page.title) : null;
              return (
                <tr key={i} className="hover:bg-white/60 transition-colors">
                  <td className="py-3 text-xs font-bold text-slate-700 truncate max-w-[180px] md:max-w-[200px]">{page.title}</td>
                  <td className="py-3 text-xs font-black text-blue-600 text-right">{page.views}</td>
                  {compareMode && (
                    <td className="py-3 text-right">
                      {delta && (
                        <span className={`text-[10px] font-black ${delta.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                          {delta.formatted}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {filteredPages.length === 0 && (
              <tr><td colSpan={compareMode ? 3 : 2} className="py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nessuna pagina trovata</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

TopPagesTable.displayName = 'TopPagesTable';
export default TopPagesTable;
