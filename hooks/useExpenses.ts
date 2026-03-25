"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [isOnline, setIsOnline] = useState(true); // Default to online until proven otherwise

  // Fetch expenses from API
  const fetchFromServer = useCallback(async () => {
    if (!user) return [];
    try {
      const res = await fetch('/api/expenses');
      if (!res.ok) {
        throw new Error(`Failed to fetch expenses: ${res.statusText}`);
      }
      const data = await res.json();
      return data || [];
    } catch (err: any) {
      console.error("API fetch error:", err);
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

      if (user) {
        try {
          const data = await fetchFromServer();
          setExpenses(data);
          setIsOnline(true);
        } catch (err) {
          console.warn("Falling back to localStorage");
          setExpenses(loadFromLocalStorage());
          setIsOnline(false);
          setError("Using offline mode - Server not available");
        }
      } else if (!user) {
        setExpenses([]);
        setIsLoading(false);
      } else {
        setExpenses(loadFromLocalStorage());
        setIsOnline(false);
      }

      setIsLoading(false);
    };

    loadExpenses();
  }, [user, fetchFromServer]);

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
        date: new Date().toISOString().split("T")[0],
      };

      // Optimistic update
      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);

      if (isOnline) {
        try {
          const res = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: expense.amount,
              description: expense.description,
              category: expense.category,
              bank_account: expense.bankAccount,
              raw_input: expense.rawInput,
              date: newExpense.date,
            })
          });

          if (!res.ok) {
            const errorData = await res.json();
             throw new Error(errorData.error || 'Failed to save to server');
          }
          
          const data = await res.json();

          if (data) {
            setExpenses((prev) =>
              prev.map((e) => (e.id === newExpense.id ? data : e)),
            );
          }
        } catch (err: any) {
          console.error("Failed to save to Server:", err);
          const errorMessage = err?.message || "Unknown error";

          // Save locally as fallback
          saveToLocalStorage(updatedExpenses);
          setError(`Error: ${errorMessage}. Saved locally.`);
        }
      } else {
        saveToLocalStorage(updatedExpenses);
      }

      return newExpense;
    },
    [expenses, isOnline, user, authLoading],
  );

  // Delete expense
  const deleteExpense = useCallback(
    async (id: string) => {
      const updatedExpenses = expenses.filter((e) => e.id !== id);
      setExpenses(updatedExpenses);

      if (isOnline && user) {
        try {
          const res = await fetch(`/api/expenses?id=${id}`, {
            method: 'DELETE',
          });

          if (!res.ok) throw new Error('Failed to delete from server');
        } catch (err) {
          console.error("Failed to delete from Server:", err);
        }
      } else {
        saveToLocalStorage(updatedExpenses);
      }
    },
    [expenses, isOnline, user],
  );

  // Clear all expenses (Not typically used, but keeping API surface intact)
  const clearExpenses = useCallback(async () => {
    if (!user) return;
    setExpenses([]);

    if (isOnline) {
      // To properly implement clear all we would need a clear all endpoint or delete each one
      // Since it's a dangerous op, we skip server impl for now, or just log.
      console.warn("Clear all not implemented on server yet");
    }
    saveToLocalStorage([]);
  }, [isOnline, user]);

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
    if (isOnline && user) {
      setIsLoading(true);
      try {
        const data = await fetchFromServer();
        setExpenses(data);
        setError(null);
      } catch (err) {
        setError("Failed to refresh");
      }
      setIsLoading(false);
    }
  }, [isOnline, user, fetchFromServer]);

  return {
    expenses,
    isLoading,
    error,
    isOnline: isOnline && !!user,
    addExpense,
    deleteExpense,
    clearExpenses,
    getMonthlyStats,
    getRecentExpenses,
    refresh,
  };
}

