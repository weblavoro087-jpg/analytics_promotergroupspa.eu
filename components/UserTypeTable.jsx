'use client';
import React from 'react';
import { calcSmartDelta } from '../utils/calcDelta';
import InfoTooltip from './InfoTooltip';

const UserTypeTable = React.memo(({ data, prevData, compareMode }) => {
  const getPrevValue = (type, key) => {
    const row = (prevData || []).find(r => r.type === type);
    return row ? row[key] : null;
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200/50">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          Utenti per Tipologia
          <InfoTooltip definition="Utenti nuovi vs di ritorno. Un nuovo utente visita il sito per la prima volta; un utente di ritorno ha già avuto almeno una sessione in precedenza. Il rapporto aiuta a capire la fidelizzazione e l'efficacia dell'acquisizione." />
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
              <th className="px-4 md:px-6 py-4 whitespace-nowrap">Nuovo/di ritorno</th>
              <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Totale utenti</th>
              {compareMode && <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Δ utenti</th>}
              <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Sessioni</th>
              {compareMode && <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Δ sessioni</th>}
              <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Rimbalzo</th>
              <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Durata media</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data || []).map((row, i) => {
              const prevUsers = compareMode ? getPrevValue(row.type, 'users') : null;
              const prevSessions = compareMode ? getPrevValue(row.type, 'sessions') : null;
              const deltaUsers = prevUsers !== null ? calcSmartDelta(row.users, prevUsers) : null;
              const deltaSessions = prevSessions !== null ? calcSmartDelta(row.sessions, prevSessions) : null;

              return (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 md:px-6 py-4 text-xs font-bold text-slate-700 uppercase whitespace-nowrap">{row.type}</td>
                  <td className="px-4 md:px-6 py-4 text-xs font-black text-slate-900 text-right">{row.users}</td>
                  {compareMode && (
                    <td className="px-4 md:px-6 py-4 text-right">
                      {deltaUsers && (
                        <span className={`text-[10px] font-black ${deltaUsers.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {deltaUsers.formatted}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-4 md:px-6 py-4 text-xs font-medium text-slate-600 text-right">{row.sessions}</td>
                  {compareMode && (
                    <td className="px-4 md:px-6 py-4 text-right">
                      {deltaSessions && (
                        <span className={`text-[10px] font-black ${deltaSessions.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {deltaSessions.formatted}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-4 md:px-6 py-4 text-xs font-medium text-slate-600 text-right">{row.bounceRate}</td>
                  <td className="px-4 md:px-6 py-4 text-xs font-medium text-slate-600 text-right">{row.avgDuration}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

UserTypeTable.displayName = 'UserTypeTable';
export default UserTypeTable;
