'use client';
import EventsPage from '../../../components/EventsPage';
import PageFrame from '../../../components/PageFrame';
import { useDashboard } from '../../../components/DashboardContext';

export default function Page6() {
  const { selectedProp, dates, compareMode, prevDates } = useDashboard();
  if (!selectedProp) return null;
  return (
    <PageFrame label="STAMPA PAGINA 6">
      <EventsPage propertyId={selectedProp} dates={dates} compareMode={compareMode} prevDates={prevDates} />
    </PageFrame>
  );
}
