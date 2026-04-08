"use client";

import { motion } from "framer-motion";
import { formatPKR } from "@/utils/expenseParser";

const BANK_META: Record<string, { emoji: string; color: string }> = {
  "Meezan Bank": { emoji: "🏦", color: "#00A651" },
  "HBL":         { emoji: "💚", color: "#006341" },
  "JazzCash":    { emoji: "📱", color: "#ED1C24" },
  "Easypaisa":   { emoji: "💛", color: "#00A54F" },
  "SadaPay":     { emoji: "💜", color: "#6B21A8" },
  "NayaPay":     { emoji: "🔵", color: "#3B82F6" },
  "UBL":         { emoji: "🏛️", color: "#C41230" },
  "MCB":         { emoji: "🏦", color: "#0066A1" },
  "Cash":        { emoji: "💵", color: "#22C55E" },
};

interface BankCarouselProps {
  byBank: Record<string, number>;
  totalSpent: number;
  isLoading: boolean;
}

export function BankCarousel({ byBank, totalSpent, isLoading }: BankCarouselProps) {
  const entries = Object.entries(byBank).sort(([, a], [, b]) => b - a);

  if (!isLoading && entries.length === 0) return null;

  return (
    <div>
      <p className="px-6 mb-3 text-[11px] font-extrabold uppercase tracking-widest text-white/40">
        💳 By Account
      </p>
      <div
        className="flex gap-3 overflow-x-auto px-6 pb-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {isLoading
          ? [1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex-shrink-0 w-36 h-32 rounded-[20px] animate-pulse"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  scrollSnapAlign: "start",
                }}
              />
            ))
          : entries.map(([bank, amount], i) => {
              const meta = BANK_META[bank] ?? { emoji: "🏦", color: "#CCFF00" };
              const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;

              return (
                <motion.div
                  key={bank}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="flex-shrink-0 w-36 rounded-[20px] p-4 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${meta.color}18 0%, rgba(255,255,255,0.02) 100%)`,
                    border: `1px solid ${meta.color}28`,
                    scrollSnapAlign: "start",
                  }}
                >
                  {/* Glow */}
                  <div
                    className="absolute -right-4 -top-4 w-16 h-16 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${meta.color}20 0%, transparent 70%)`,
                    }}
                  />

                  <div className="text-2xl mb-2">{meta.emoji}</div>
                  <p className="text-white/55 text-[11px] font-bold truncate leading-none mb-1">
                    {bank}
                  </p>
                  <p className="text-white font-extrabold text-[17px] leading-none mb-3">
                    {formatPKR(amount)}
                  </p>

                  {/* Progress bar */}
                  <div
                    className="h-1 rounded-full overflow-hidden mb-1"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: i * 0.06 + 0.15, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: meta.color }}
                    />
                  </div>
                  <p className="text-white/20 text-[10px] font-medium">{pct}% of total</p>
                </motion.div>
              );
            })}
      </div>
    </div>
  );
}
