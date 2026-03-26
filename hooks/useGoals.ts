"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  target_amount: number;
  current_amount: number;
  emoji: string;
  deadline: string | null;
  completed: boolean;
  createdAt: string;
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      setGoals(await res.json());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const createGoal = useCallback(async (input: {
    title: string;
    target_amount: number;
    emoji: string;
    deadline?: string;
  }): Promise<Goal | null> => {
    // Optimistic add with temp id
    const temp: Goal = {
      id: `temp-${Date.now()}`,
      userId: user?.id ?? "",
      title: input.title,
      target_amount: input.target_amount,
      current_amount: 0,
      emoji: input.emoji,
      deadline: input.deadline ?? null,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [temp, ...prev]);

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      const created: Goal = await res.json();
      setGoals((prev) => prev.map((g) => (g.id === temp.id ? created : g)));
      return created;
    } catch (err: any) {
      setGoals((prev) => prev.filter((g) => g.id !== temp.id));
      setError(err.message);
      return null;
    }
  }, [user]);

  const contribute = useCallback(async (id: string, amount: number): Promise<Goal | null> => {
    // Optimistic update
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              current_amount: Math.min(g.current_amount + amount, g.target_amount),
              completed: g.current_amount + amount >= g.target_amount,
            }
          : g
      )
    );

    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, add_amount: amount }),
      });
      if (!res.ok) throw new Error("Failed to contribute");
      const updated: Goal = await res.json();
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return updated;
    } catch (err: any) {
      // rollback
      fetchGoals();
      setError(err.message);
      return null;
    }
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      const res = await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (err: any) {
      fetchGoals(); // rollback
      setError(err.message);
    }
  }, [fetchGoals]);

  return { goals, isLoading, error, createGoal, contribute, deleteGoal, refresh: fetchGoals };
}
