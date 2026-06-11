'use client';
import TimeAnalysisPage from '../../../components/TimeAnalysisPage';
import PageFrame from '../../../components/PageFrame';
import { useDashboard } from '../../../components/DashboardContext';

export default function Page9() {
  const { selectedProp, dates, compareMode, prevDates } = useDashboard();
  if (!selectedProp) return null;
  return (
    <PageFrame label="STAMPA PAGINA 9">
      <TimeAnalysisPage propertyId={selectedProp} dates={dates} compareMode={compareMode} prevDates={prevDates} />
    </PageFrame>
  );
}
