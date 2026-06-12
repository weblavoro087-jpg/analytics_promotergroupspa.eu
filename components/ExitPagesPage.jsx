import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/apiConfig';


const ExitPagesPage = ({ propertyId, startDate, endDate }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!propertyId || !startDate || startDate === 'undefined') return;

    fetch(`${API_BASE_URL}/api/exit-pages?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [propertyId, startDate, endDate]);

  return (
    <div className="p-6 backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300">
      <h2 className="text-[10px] font-black uppercase text-slate-400 mb-6 italic">Most Viewed Pages</h2>
      <div className="space-y-3">
  {Array.isArray(data) && data.length > 0 ? (
    data.map((item, i) => (
      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 transition-colors">
        <span className="text-[10px] font-black text-slate-600 truncate max-w-[70%] italic">{item.path}</span>
        <span className="text-[11px] font-black text-blue-600 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
           {item.views} VIEW
        </span>
      </div>
    ))
  ) : (
    <div className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">
      {data.length === 0 ? "Nessun dato disponibile" : "Caricamento..."}
    </div>
  )}
</div>
    </div>
  );
};

export default ExitPagesPage;
