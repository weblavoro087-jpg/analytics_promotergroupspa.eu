'use client';
import TrafficReportPage from '../../../components/TrafficReportPage';
import PageFrame from '../../../components/PageFrame';
import { useDashboard } from '../../../components/DashboardContext';

export default function Page3() {
  const { selectedProp, dates, compareMode, prevDates } = useDashboard();
  if (!selectedProp) return null;
  return (
    <PageFrame label="STAMPA PAGINA 3">
      <TrafficReportPage propertyId={selectedProp} dates={dates} compareMode={compareMode} prevDates={prevDates} />
    </PageFrame>
  );
}
