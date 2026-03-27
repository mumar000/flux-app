import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { streakService } from "@/services/streak.service";
import type { UpdateStreakSettingsInput } from "@/types/streak";

export function useUpdateStreakSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStreakSettingsInput) =>
      streakService.updateSettings(input),

    onSuccess: (data) => {
      // Write the fresh server response directly into the cache so the
      // UI reflects the new dailyBudget and recomputed streak counts
      // without waiting for a background refetch.
      queryClient.setQueryData(queryKeys.streaks.current(), data);
    },

    onError: () => {
      // Invalidate so the next read pulls a fresh copy from the server,
      // discarding any stale optimistic state.
      queryClient.invalidateQueries({ queryKey: queryKeys.streaks.all });
    },
  });
}
