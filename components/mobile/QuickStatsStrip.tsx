"use client";

import { motion } from "framer-motion";
import { formatPKR } from "@/utils/expenseParser";

interface QuickStatsStripProps {
  todaySpent: number;
  streakDays: number;
  topCategory: { name: string; emoji: string } | null;
  isLoading: boolean;
}

export function QuickStatsStrip({
  todaySpent,
  streakDays,
  topCategory,
  isLoading,
}: QuickStatsStripProps) {
  const chips = [
    {
      icon: "💸",
      label: "Today",
      value: isLoading ? "—" : formatPKR(todaySpent),
      sub: "spent",
    },
    {
      icon: streakDays >= 7 ? "🔥" : streakDays >= 3 ? "⚡" : "✨",
      label: "Streak",
      value: isLoading ? "—" : `${streakDays}d`,
      sub: "no impulse",
    },
    {
      icon: topCategory?.emoji ?? "📊",
      label: "Top spend",
      value: isLoading ? "—" : (topCategory?.name ?? "None"),
      sub: "this month",
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto px-6">
      {chips.map((chip, i) => (
        <motion.div
          key={chip.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 + i * 0.06, duration: 0.3 }}
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-[18px]"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span className="text-xl leading-none">{chip.icon}</span>
          <div className="min-w-0">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-wide leading-none mb-0.5">
              {chip.label}
            </p>
            <p className="text-white text-sm font-extrabold leading-none truncate max-w-[80px]">
              {chip.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
