import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { goalService } from "@/services/goal.service";

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.list(),
    queryFn: () => goalService.getAll(),
    staleTime: 1000 * 60 * 2,
  });
}
