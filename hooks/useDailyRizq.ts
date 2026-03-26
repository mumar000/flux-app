"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/queryKeys";

export interface DailyRizqCard {
  id: string;
  type: "insight" | "challenge" | "question" | "comparison";
  emoji: string;
  title: string;
  body: string;
  tone: string;
  date: string;
  saved: boolean;
  dismissed: boolean;
}

async function fetchDailyRizq(): Promise<DailyRizqCard> {
  const res = await fetch("/api/daily-rizq");
  if (!res.ok) throw new Error("Failed to load daily rizq");
  return res.json();
}

async function patchDailyRizq(payload: { id: string; action: "save" | "dismiss" }) {
  const res = await fetch("/api/daily-rizq", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update daily rizq");
  return res.json();
}

export function useDailyRizq() {
  const { status } = useSession();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.dailyRizq.today(),
    queryFn: fetchDailyRizq,
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 10, // 10 min — card changes once a day
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: patchDailyRizq,
    onMutate: async ({ action }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dailyRizq.today() });
      const prev = queryClient.getQueryData<DailyRizqCard>(queryKeys.dailyRizq.today());
      queryClient.setQueryData<DailyRizqCard>(queryKeys.dailyRizq.today(), (old) =>
        old ? { ...old, saved: action === "save" ? true : old.saved, dismissed: action === "dismiss" ? true : old.dismissed } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.dailyRizq.today(), ctx.prev);
    },
  });

  const saveCard = () => {
    if (!query.data) return;
    mutation.mutate({ id: query.data.id, action: "save" });
  };

  const dismissCard = () => {
    if (!query.data) return;
    mutation.mutate({ id: query.data.id, action: "dismiss" });
  };

  return {
    card: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? String(query.error) : null,
    saveCard,
    dismissCard,
  };
}
