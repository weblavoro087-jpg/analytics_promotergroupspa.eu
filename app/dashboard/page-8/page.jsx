'use client';
import SessionQualityPage from '../../../components/SessionQualityPage';
import PageFrame from '../../../components/PageFrame';
import { useDashboard } from '../../../components/DashboardContext';

export default function Page8() {
  const { selectedProp, dates, compareMode, prevDates } = useDashboard();
  if (!selectedProp) return null;
  return (
    <PageFrame label="STAMPA PAGINA 8">
      <SessionQualityPage propertyId={selectedProp} dates={dates} compareMode={compareMode} prevDates={prevDates} />
    </PageFrame>
  );
}
