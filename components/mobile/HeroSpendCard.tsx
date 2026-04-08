"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatPKR } from "@/utils/expenseParser";

interface HeroSpendCardProps {
  totalSpent: number;
  txCount: number;
  isLoading: boolean;
  month: string;
}

export function HeroSpendCard({ totalSpent, txCount, isLoading, month }: HeroSpendCardProps) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthPct = Math.round((dayOfMonth / daysInMonth) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mx-6 rounded-[28px] p-6 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(204,255,0,0.11) 0%, rgba(204,255,0,0.04) 50%, rgba(15,15,17,0.95) 100%)",
        border: "1px solid rgba(204,255,0,0.18)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Lime glow blob */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(204,255,0,0.14) 0%, transparent 68%)" }}
      />

      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/35 text-[11px] font-bold uppercase tracking-widest">
          {month}
        </span>
        <span
          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(204,255,0,0.12)", color: "#CCFF00" }}
        >
          {dayOfMonth}/{daysInMonth}
        </span>
      </div>

      {/* Amount */}
      <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1.5">
        Total Spent
      </p>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 mb-5"
          >
            <div
              className="w-48 h-12 rounded-2xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <div
              className="w-32 h-4 rounded-xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="val"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-5"
          >
            <h2
              className="text-5xl font-extrabold text-white tracking-tight leading-none mb-1.5"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatPKR(totalSpent)}
            </h2>
            <p className="text-white/30 text-sm">
              {txCount} transaction{txCount !== 1 ? "s" : ""} this month
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Month progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/25 text-[11px] font-medium">Month progress</span>
          <span className="text-white/35 text-[11px] font-extrabold">{monthPct}%</span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${monthPct}%` }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #CCFF00, #99CC00)" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
