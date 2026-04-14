"use client";

import { motion } from "framer-motion";
import { formatPKR } from "@/utils/expenseParser";
import type { Bank } from "@/services/bank.service";

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
  banks: Bank[];
  byBank: Record<string, number>;
  flowLabel: string;
  isLoading: boolean;
}

export function BankCarousel({ banks, byBank, flowLabel, isLoading }: BankCarouselProps) {
  const entries = banks
    .map((bank) => ({
      ...bank,
      balance: Number(bank.balance ?? 0),
      netFlow: Number(byBank[bank.name] ?? 0),
    }))
    .sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow));

  const maxNet = Math.max(...entries.map((bank) => Math.abs(bank.netFlow)), 1);
  const totalBalance = entries.reduce((sum, bank) => sum + bank.balance, 0);

  if (!isLoading && entries.length === 0) return null;

  return (
    <div>
      <p className="px-6 mb-3 text-[11px] font-extrabold uppercase tracking-widest text-white/40">
        💳 Accounts
      </p>
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-3 rounded-[24px] p-5"
          style={{
            background: "linear-gradient(135deg, rgba(204,255,0,0.12), rgba(255,255,255,0.04))",
            border: "1px solid rgba(204,255,0,0.28)",
            boxShadow: "0 0 24px rgba(204,255,0,0.10)",
          }}
        >
          <div className="flex items-center gap-2 text-white/60 text-sm font-bold">
            <span className="text-xl">💰</span>
            Total Balance
          </div>
          <p className={`mt-2 text-3xl font-extrabold ${totalBalance < 0 ? "text-[#FF8B8B]" : "text-white"}`}>
            {formatPKR(totalBalance)}
          </p>
          <p className="mt-1 text-white/35 text-xs font-semibold">
            across {entries.length} {entries.length === 1 ? "account" : "accounts"}
          </p>
        </motion.div>
      )}
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
          : entries.map((bank, i) => {
              const meta = BANK_META[bank.name] ?? { emoji: "🏦", color: "#CCFF00" };
              const pct = Math.round((Math.abs(bank.netFlow) / maxNet) * 100);
              const flowColor = bank.netFlow >= 0 ? "#86EFAC" : "#FF8B8B";

              return (
                <motion.div
                  key={bank.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="flex-shrink-0 w-64 rounded-[20px] p-4 relative overflow-hidden"
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

                  <div className="relative flex items-center justify-between gap-3">
                    <div className="text-2xl">{meta.emoji}</div>
                    <p className="text-white/70 text-xs font-extrabold truncate text-right">
                      {bank.name}
                    </p>
                  </div>
                  <div className="relative mt-6">
                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
                      Balance
                    </p>
                    <p className={`mt-1 font-extrabold text-2xl leading-none ${bank.balance < 0 ? "text-[#FF8B8B]" : "text-white"}`}>
                      {formatPKR(bank.balance)}
                    </p>
                  </div>

                  <div
                    className="mt-5 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: i * 0.06 + 0.15, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: flowColor }}
                    />
                  </div>
                  <p className="mt-2 text-white/40 text-[11px] font-bold">
                    {bank.netFlow >= 0 ? "+" : "-"}
                    {formatPKR(Math.abs(bank.netFlow))} {flowLabel}
                  </p>
                </motion.div>
              );
            })}
      </div>
    </div>
  );
}
