'use client';
import { createContext, useContext } from 'react';

// Stato condiviso della dashboard (proprietà selezionata, date, confronto, dati KPI).
// Vive nel layout /dashboard così da persistere durante la navigazione tra page-1..9.
export const DashboardContext = createContext(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard deve essere usato dentro <DashboardContext.Provider>');
  return ctx;
};
