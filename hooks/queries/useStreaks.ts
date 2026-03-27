import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/queryKeys";
import { streakService } from "@/services/streak.service";

export function useStreaks() {
  const { status } = useSession();

  return useQuery({
    queryKey: queryKeys.streaks.current(),
    queryFn: () => streakService.get(),
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
