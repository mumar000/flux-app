import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/queryKeys";
import { comparisonService } from "@/services/comparison.service";

export function useComparisonItems() {
  const { status } = useSession();

  return useQuery({
    queryKey: queryKeys.comparisons.list(),
    queryFn: () => comparisonService.getAll(),
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5, // 5 min — items rarely change
  });
}
