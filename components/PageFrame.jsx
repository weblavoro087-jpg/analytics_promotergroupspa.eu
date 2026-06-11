'use client';
import PrintPageButton from './PrintPageButton';
import { useDashboard } from './DashboardContext';

export default function PageFrame({ label, children }) {
  const { currentStyle, compareMode, prevDates } = useDashboard();
  return (
    <div className="dashboard-page space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end no-print">
        <PrintPageButton currentStyle={currentStyle} label={label} />
      </div>
      {compareMode && (
        <div className="bg-amber-50/80 backdrop-blur-lg rounded-xl px-4 py-2.5 text-xs font-bold text-amber-700 border border-amber-200/60 shadow-sm">
          <span className="text-amber-500">⟳</span> Confronto con periodo precedente: {prevDates.start} → {prevDates.end}
        </div>
      )}
      {children}
    </div>
  );
}
