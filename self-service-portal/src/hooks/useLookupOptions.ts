import { useQuery } from '@tanstack/react-query'
import { listLookupOptions, type LookupOption } from '@/api/endpoints/lookups'

export function useLookupOptions(catalog: string, fallback: LookupOption[] = []) {
  const query = useQuery({
    queryKey: ['lookups', catalog],
    queryFn: () => listLookupOptions(catalog),
    staleTime: 5 * 60 * 1000,
  })

  return {
    ...query,
    options: query.data?.length ? query.data : fallback,
  }
}
