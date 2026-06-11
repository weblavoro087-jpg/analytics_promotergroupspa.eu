'use client';
import { useQuery } from '@tanstack/react-query';

export function useApiQuery(url, options = {}) {
  const { queryKey, enabled, staleTime, ...rest } = options;
  return useQuery({
    queryKey: queryKey || ['api', url],
    queryFn: async () => {
      const r = await fetch(url);
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error(body?.error || `HTTP ${r.status} ${r.statusText}`);
      return body;
    },
    enabled: !!url && (enabled !== false),
    staleTime: staleTime ?? 5 * 60 * 1000,
    ...rest,
  });
}
