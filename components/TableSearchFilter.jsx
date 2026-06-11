'use client';
import React from 'react';

const TableSearchFilter = React.memo(({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Filtra...'}
        className="w-full pl-9 pr-8 py-2.5 rounded-lg text-sm md:text-[11px] font-medium
          bg-white border border-slate-200 text-slate-700
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
          transition-all min-h-[44px]"
        style={{ fontSize: '16px' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7
            flex items-center justify-center rounded-full
            text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

TableSearchFilter.displayName = 'TableSearchFilter';
export default TableSearchFilter;
