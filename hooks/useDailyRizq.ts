"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

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

export function useDailyRizq() {
  const { user } = useAuth();
  const [card, setCard] = useState<DailyRizqCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's card
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchCard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/daily-rizq");
        if (!res.ok) throw new Error("Failed to load daily rizq");
        const data = await res.json();
        setCard(data);
      } catch (err: any) {
        console.error("Daily Rizq fetch error:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCard();
  }, [user]);

  // Save card to reflections
  const saveCard = useCallback(async () => {
    if (!card) return;
    setCard((prev) => (prev ? { ...prev, saved: true } : prev));
    try {
      await fetch("/api/daily-rizq", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, action: "save" }),
      });
    } catch (err) {
      console.error("Failed to save card:", err);
      setCard((prev) => (prev ? { ...prev, saved: false } : prev));
    }
  }, [card]);

  // Dismiss card (swipe away)
  const dismissCard = useCallback(async () => {
    if (!card) return;
    setCard((prev) => (prev ? { ...prev, dismissed: true } : prev));
    try {
      await fetch("/api/daily-rizq", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, action: "dismiss" }),
      });
    } catch (err) {
      console.error("Failed to dismiss card:", err);
    }
  }, [card]);

  return {
    card,
    isLoading,
    error,
    saveCard,
    dismissCard,
  };
}
