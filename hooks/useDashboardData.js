import { useQuery, useQueryClient } from '@tanstack/react-query';

function buildUrl(propertyId, startDate, endDate, prevStartDate, prevEndDate) {
  const params = new URLSearchParams({ propertyId, startDate, endDate });
  if (prevStartDate && prevEndDate) {
    params.set('prevStartDate', prevStartDate);
    params.set('prevEndDate', prevEndDate);
  }
  return `/api/dashboard-data?${params.toString()}`;
}

function getQueryKey(propertyId, startDate, endDate, prevStartDate, prevEndDate) {
  return ['dashboard-data', propertyId, startDate, endDate, prevStartDate, prevEndDate];
}

function isEnabled(propertyId, startDate, endDate) {
  return !!propertyId && !!startDate && !!endDate;
}

export function useDashboardData({ selectedProp, dates, prevDates, compareMode }) {
  const propertyId = selectedProp;
  const startDate = dates?.start;
  const endDate = dates?.end;
  const prevStartDate = compareMode && prevDates ? prevDates.start : null;
  const prevEndDate = compareMode && prevDates ? prevDates.end : null;

  const queryKey = getQueryKey(propertyId, startDate, endDate, prevStartDate, prevEndDate);

  const queryFn = async () => {
    const url = buildUrl(propertyId, startDate, endDate, prevStartDate, prevEndDate);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: isEnabled(propertyId, startDate, endDate),
    placeholderData: (prev) => prev,
    select: (data) => ({
      current: data?.current ?? null,
      previous: data?.previous ?? null,
    }),
  });
}

export function useDashboardKPI(propertyId, dates, compareMode, prevDates) {
  const startDate = dates?.start;
  const endDate = dates?.end;
  const prevStartDate = compareMode && prevDates ? prevDates.start : null;
  const prevEndDate = compareMode && prevDates ? prevDates.end : null;

  const queryKey = getQueryKey(propertyId, startDate, endDate, prevStartDate, prevEndDate);

  const queryFn = async () => {
    const url = buildUrl(propertyId, startDate, endDate, prevStartDate, prevEndDate);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: isEnabled(propertyId, startDate, endDate),
    placeholderData: (prev) => prev,
    select: (data) => ({
      kpi: data?.current?.kpi ?? null,
      prevKpi: data?.previous?.kpi ?? null,
    }),
  });
}

export function useDashboardChart(propertyId, dates, compareMode, prevDates) {
  const startDate = dates?.start;
  const endDate = dates?.end;
  const prevStartDate = compareMode && prevDates ? prevDates.start : null;
  const prevEndDate = compareMode && prevDates ? prevDates.end : null;

  const queryKey = getQueryKey(propertyId, startDate, endDate, prevStartDate, prevEndDate);

  const queryFn = async () => {
    const url = buildUrl(propertyId, startDate, endDate, prevStartDate, prevEndDate);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: isEnabled(propertyId, startDate, endDate),
    placeholderData: (prev) => prev,
    select: (data) => ({
      chart: data?.current?.chart ?? [],
      prevChart: data?.previous?.chart ?? [],
    }),
  });
}

export function useDashboardUserTypes(propertyId, dates, compareMode, prevDates) {
  const startDate = dates?.start;
  const endDate = dates?.end;
  const prevStartDate = compareMode && prevDates ? prevDates.start : null;
  const prevEndDate = compareMode && prevDates ? prevDates.end : null;

  const queryKey = getQueryKey(propertyId, startDate, endDate, prevStartDate, prevEndDate);

  const queryFn = async () => {
    const url = buildUrl(propertyId, startDate, endDate, prevStartDate, prevEndDate);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: isEnabled(propertyId, startDate, endDate),
    placeholderData: (prev) => prev,
    select: (data) => ({
      userTypes: data?.current?.userTypes ?? [],
      prevUserTypes: data?.previous?.userTypes ?? [],
    }),
  });
}

export function useDashboardTopPages(propertyId, dates, compareMode, prevDates) {
  const startDate = dates?.start;
  const endDate = dates?.end;
  const prevStartDate = compareMode && prevDates ? prevDates.start : null;
  const prevEndDate = compareMode && prevDates ? prevDates.end : null;

  const queryKey = getQueryKey(propertyId, startDate, endDate, prevStartDate, prevEndDate);

  const queryFn = async () => {
    const url = buildUrl(propertyId, startDate, endDate, prevStartDate, prevEndDate);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: isEnabled(propertyId, startDate, endDate),
    placeholderData: (prev) => prev,
    select: (data) => ({
      topPages: data?.current?.topPages ?? [],
      prevTopPages: data?.previous?.topPages ?? [],
    }),
  });
}

export function usePrefetchDashboardData() {
  const queryClient = useQueryClient();

  return ({ selectedProp, dates, prevDates, compareMode }) => {
    const propertyId = selectedProp;
    const startDate = dates?.start;
    const endDate = dates?.end;
    const prevStartDate = compareMode && prevDates ? prevDates.start : null;
    const prevEndDate = compareMode && prevDates ? prevDates.end : null;

    if (!isEnabled(propertyId, startDate, endDate)) return;

    const queryKey = getQueryKey(propertyId, startDate, endDate, prevStartDate, prevEndDate);
    const url = buildUrl(propertyId, startDate, endDate, prevStartDate, prevEndDate);

    queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}
