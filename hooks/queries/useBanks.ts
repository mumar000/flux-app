import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { bankService } from "@/services/bank.service";

export function useBanks() {
  return useQuery({
    queryKey: queryKeys.banks.list(),
    queryFn: () => bankService.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}
