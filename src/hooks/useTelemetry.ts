import { useQuery } from '@tanstack/react-query';
import { fetchLiveZoneTelemetry } from '../lib/liveZoneTelemetry';
import { Zone } from '../lib/zones';

export function useLiveZoneTelemetry(zone: Zone) {
  return useQuery({
    queryKey: ['zoneTelemetry', zone.name],
    queryFn: () => fetchLiveZoneTelemetry(zone),
    enabled: !!zone,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });
}
