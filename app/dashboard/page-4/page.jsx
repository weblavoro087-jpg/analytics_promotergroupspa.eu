'use client';
import GeoBehaviorPage from '../../../components/GeoBehaviorPage';
import PageFrame from '../../../components/PageFrame';
import { useDashboard } from '../../../components/DashboardContext';

export default function Page4() {
  const { selectedProp, dates, compareMode, prevDates } = useDashboard();
  if (!selectedProp) return null;
  return (
    <PageFrame label="STAMPA PAGINA 4">
      <GeoBehaviorPage propertyId={selectedProp} dates={dates} compareMode={compareMode} prevDates={prevDates} />
    </PageFrame>
  );
}
