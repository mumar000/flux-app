import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/queryKeys";
import { goalService } from "@/services/goal.service";

export function useGoals() {
  const { status } = useSession();

  return useQuery({
    queryKey: queryKeys.goals.list(),
    queryFn: () => goalService.getAll(),
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 2,
  });
}
