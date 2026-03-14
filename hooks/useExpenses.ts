"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  bank_account: string;
  category: string;
  created_at: string;
  raw_input: string;
  user_id?: string;
  date?: string;
}

export interface MonthlyStats {
  totalSpent: number;
  byCategory: Record<string, number>;
  byBank: Record<string, number>;
  expenses: Expense[];
}

const STORAGE_KEY = "rizqly_expenses";

export function useExpenses() {
  const { user, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useSupabase, setUseSupabase] = useState(true);

  // Check if Supabase is configured
  const isSupabaseConfigured = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && url.length > 0 && key && key.length > 0;
  };

  // Fetch expenses from Supabase
  const fetchFromSupabase = useCallback(async () => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        throw error;
      }
      return data || [];
    } catch (err: any) {
      console.error("Supabase fetch error:", err);
      console.error("Error details:", {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
      });
      throw err;
    }
  }, [user]);

  // Load from localStorage (fallback)
  const loadFromLocalStorage = (): Expense[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error("LocalStorage load error:", err);
    }
    return [];
  };

  // Save to localStorage
  const saveToLocalStorage = (expenses: Expense[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (err) {
      console.error("LocalStorage save error:", err);
    }
  };

  // Load expenses on mount and when user changes
  useEffect(() => {
    const loadExpenses = async () => {
      setIsLoading(true);
      setError(null);

      if (isSupabaseConfigured() && user) {
        try {
          const data = await fetchFromSupabase();
          setExpenses(data);
          setUseSupabase(true);
        } catch (err) {
          console.warn("Falling back to localStorage");
          setExpenses(loadFromLocalStorage());
          setUseSupabase(false);
          setError("Using offline mode - Supabase not available");
        }
      } else if (!user) {
        setExpenses([]);
        setIsLoading(false);
      } else {
        setExpenses(loadFromLocalStorage());
        setUseSupabase(false);
      }

      setIsLoading(false);
    };

    loadExpenses();
  }, [user, fetchFromSupabase]);

  // Add new expense
  const addExpense = useCallback(
    async (expense: {
      amount: number;
      description: string;
      bankAccount: string;
      category: string;
      rawInput: string;
    }) => {
      // Wait for auth to finish loading before checking user
      if (authLoading) {
        setError("Please wait, loading your session...");
        return null;
      }

      if (!user) {
        setError("You must be logged in to add expenses");
        return null;
      }

      const newExpense: Expense = {
        id: crypto.randomUUID(),
        amount: expense.amount,
        description: expense.description,
        bank_account: expense.bankAccount,
        category: expense.category,
        created_at: new Date().toISOString(),
        raw_input: expense.rawInput,
        user_id: user.id,
      };

      // Optimistic update
      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);

      if (useSupabase && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from("expenses")
            .insert({
              user_id: user.id,
              amount: expense.amount,
              description: expense.description,
              category: expense.category,
              bank_account: expense.bankAccount,
              raw_input: expense.rawInput,
              date: new Date().toISOString().split("T")[0],
            })
            .select()
            .single();

          if (error) {
            console.error("Supabase insert error:", error);
            throw error;
          }

          if (data) {
            setExpenses((prev) =>
              prev.map((e) => (e.id === newExpense.id ? data : e)),
            );
          }
        } catch (err: any) {
          console.error("Failed to save to Supabase:", err);
          const errorMessage = err?.message || "Unknown error";
          const errorDetails = err?.details || "";
          const errorHint = err?.hint || "";

          console.error("Error details:", { errorMessage, errorDetails, errorHint });

          // Save locally as fallback
          saveToLocalStorage(updatedExpenses);

          // Show user-friendly error message
          if (errorMessage.includes("relation") || errorMessage.includes("does not exist")) {
            setError("Database table not found. Please run the setup SQL in Supabase.");
          } else if (errorMessage.includes("row-level security") || errorMessage.includes("policy")) {
            setError("Permission denied. Please check database security policies.");
          } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("network")) {
            setError("Network error. Saved locally - will sync when online.");
          } else {
            setError(`Error: ${errorMessage}. Saved locally.`);
          }
        }
      } else {
        saveToLocalStorage(updatedExpenses);
      }

      return newExpense;
    },
    [expenses, useSupabase, user, authLoading],
  );

  // Delete expense
  const deleteExpense = useCallback(
    async (id: string) => {
      const updatedExpenses = expenses.filter((e) => e.id !== id);
      setExpenses(updatedExpenses);

      if (useSupabase && isSupabaseConfigured() && user) {
        try {
          const { error } = await supabase
            .from("expenses")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

          if (error) throw error;
        } catch (err) {
          console.error("Failed to delete from Supabase:", err);
        }
      } else {
        saveToLocalStorage(updatedExpenses);
      }
    },
    [expenses, useSupabase, user],
  );

  // Clear all expenses
  const clearExpenses = useCallback(async () => {
    if (!user) return;
    setExpenses([]);

    if (useSupabase && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (err) {
        console.error("Failed to clear Supabase:", err);
      }
    }
    saveToLocalStorage([]);
  }, [useSupabase, user]);

  // Get current month stats
  const getMonthlyStats = useCallback(
    (month?: Date): MonthlyStats => {
      const targetMonth = month || new Date();
      const monthStart = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        1,
      );
      const monthEnd = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const monthlyExpenses = expenses.filter((e) => {
        const date = new Date(e.created_at || e.date || "");
        return date >= monthStart && date <= monthEnd;
      });

      const totalSpent = monthlyExpenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0,
      );

      const byCategory: Record<string, number> = {};
      const byBank: Record<string, number> = {};

      monthlyExpenses.forEach((e) => {
        byCategory[e.category] =
          (byCategory[e.category] || 0) + Number(e.amount);
        byBank[e.bank_account] =
          (byBank[e.bank_account] || 0) + Number(e.amount);
      });

      return {
        totalSpent,
        byCategory,
        byBank,
        expenses: monthlyExpenses,
      };
    },
    [expenses],
  );

  // Get recent expenses (last N)
  const getRecentExpenses = useCallback(
    (count: number = 5) => {
      return expenses.slice(0, count);
    },
    [expenses],
  );

  // Refresh from server
  const refresh = useCallback(async () => {
    if (useSupabase && isSupabaseConfigured() && user) {
      setIsLoading(true);
      try {
        const data = await fetchFromSupabase();
        setExpenses(data);
        setError(null);
      } catch (err) {
        setError("Failed to refresh");
      }
      setIsLoading(false);
    }
  }, [useSupabase, user, fetchFromSupabase]);

  return {
    expenses,
    isLoading,
    error,
    isOnline: useSupabase && !!user,
    addExpense,
    deleteExpense,
    clearExpenses,
    getMonthlyStats,
    getRecentExpenses,
    refresh,
  };
}
