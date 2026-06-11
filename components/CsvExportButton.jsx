'use client';
import React from 'react';

function convertToCsv(data, columns) {
  const header = columns.map(c => `"${c.label}"`).join(';');
  const rows = data.map(row =>
    columns.map(c => {
      let val = c.accessor ? c.accessor(row) : row[c.key];
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(';')
  );
  return [header, ...rows].join('\r\n');
}

function downloadCsv(csv, filename) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CsvExportButton = React.memo(({ data, columns, filename }) => {
  const handleExport = () => {
    if (!data || data.length === 0) return;
    const csv = convertToCsv(data, columns);
    downloadCsv(csv, filename || 'export.csv');
  };

  return (
    <button
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider
        bg-emerald-50 text-emerald-600 border border-emerald-200
        hover:bg-emerald-100 hover:text-emerald-700
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-all flex items-center gap-1.5"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      CSV
    </button>
  );
});

CsvExportButton.displayName = 'CsvExportButton';
export default CsvExportButton;
