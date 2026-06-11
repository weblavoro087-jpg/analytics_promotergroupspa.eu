'use client';
import DeviceReportPage from '../../../components/DeviceReportPage';
import PageFrame from '../../../components/PageFrame';
import { useDashboard } from '../../../components/DashboardContext';
import { useDashboardKPI } from '../../../hooks/useDashboardData';

export default function Page5() {
  const { selectedProp, dates, compareMode, prevDates } = useDashboard();
  const { data } = useDashboardKPI(selectedProp, dates, compareMode, prevDates);

  if (!selectedProp) return null;
  return (
    <PageFrame label="STAMPA PAGINA 5">
      <DeviceReportPage propertyId={selectedProp} dates={dates} compareMode={compareMode} prevDates={prevDates} kpiData={data?.kpi} prevKpiData={data?.prevKpi} />
    </PageFrame>
  );
}
