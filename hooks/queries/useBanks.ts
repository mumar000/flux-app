import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/queryKeys";
import { bankService } from "@/services/bank.service";

export function useBanks() {
  const { status } = useSession();

  return useQuery({
    queryKey: queryKeys.banks.list(),
    queryFn: () => bankService.getAll(),
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5,
  });
}
