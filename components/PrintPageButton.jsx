import React from 'react'

const PrintPageButton = ({ currentStyle, label }) => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2 glass rounded-xl hover:bg-white/10 transition-all no-print text-slate-300 hover:text-white"
      style={{ borderColor: (currentStyle?.primaryColor || '#3B82F6') + '40' }}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      <span className="text-[10px] font-black uppercase tracking-widest">{label || 'STAMPA PAGINA'}</span>
    </button>
  )
}

export default PrintPageButton
