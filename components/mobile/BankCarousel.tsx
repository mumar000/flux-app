"use client";

import { motion } from "framer-motion";
import { formatPKR } from "@/utils/expenseParser";
import type { Bank } from "@/services/bank.service";

const BANK_META: Record<string, { emoji: string; color: string }> = {
  "Meezan Bank": { emoji: "🏦", color: "#00A651" },
  HBL: { emoji: "💚", color: "#006341" },
  JazzCash: { emoji: "📱", color: "#ED1C24" },
  Easypaisa: { emoji: "💛", color: "#00A54F" },
  SadaPay: { emoji: "💜", color: "#6B21A8" },
  NayaPay: { emoji: "🔵", color: "#3B82F6" },
  UBL: { emoji: "🏛️", color: "#C41230" },
  MCB: { emoji: "🏦", color: "#0066A1" },
  Cash: { emoji: "💵", color: "#22C55E" },
};

interface BankCarouselProps {
  banks: Bank[];
  byBank: Record<string, number>;
  flowLabel: string;
  isLoading: boolean;
}

export function BankCarousel({
  banks,
  byBank,
  flowLabel,
  isLoading,
}: BankCarouselProps) {
  const entries = banks
    .map((bank) => ({
      ...bank,
      balance: Number(bank.balance ?? 0),
      netFlow: Number(byBank[bank.name] ?? 0),
    }))
    .sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow));

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
          className="mx-6 mb-4 rounded-[24px] p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(204,255,0,0.12), rgba(255,255,255,0.04))",
            border: "1px solid rgba(204,255,0,0.28)",
            boxShadow: "0 0 24px rgba(204,255,0,0.10)",
          }}
        >
          <div className="flex items-center gap-2 text-white/60 text-sm font-bold">
            <span className="text-xl">💰</span>
            Total Balance
          </div>
          <p
            className={`mt-2 text-3xl font-extrabold ${totalBalance < 0 ? "text-[#FF8B8B]" : "text-white"}`}
          >
            {formatPKR(totalBalance)}
          </p>
          <p className="mt-1 text-white/35 text-xs font-semibold">
            across {entries.length}{" "}
            {entries.length === 1 ? "account" : "accounts"}
          </p>
        </motion.div>
      )}

      {/* Pills row */}
      <div
        className="flex gap-2.5 overflow-x-auto px-6 pb-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {isLoading
          ? [1, 2, 3].map((n) => (
              <div
                key={n}
                className="shrink-0 w-36 h-[62px] rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.07)" }}
              />
            ))
          : entries.map((bank, i) => {
              const meta = BANK_META[bank.name] ?? {
                emoji: "🏦",
                color: "#CCFF00",
              };
              const flowColor = bank.netFlow >= 0 ? "#86EFAC" : "#FF8B8B";
              const flowSign = bank.netFlow >= 0 ? "↑" : "↓";

              return (
                <motion.div
                  key={bank.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                  className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: `${meta.color}10`,
                    border: `1px solid ${meta.color}25`,
                  }}
                >
                  {/* Emoji bubble */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                    style={{ background: `${meta.color}20` }}
                  >
                    {meta.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider leading-none mb-1 truncate">
                      {bank.name}
                    </span>
                    <span
                      className="text-sm font-extrabold leading-none"
                      style={{ color: bank.balance < 0 ? "#FF8B8B" : "white" }}
                    >
                      {formatPKR(bank.balance)}
                    </span>
                    {bank.netFlow !== 0 && (
                      <span
                        className="text-[10px] font-bold leading-none mt-1"
                        style={{ color: flowColor }}
                      >
                        {flowSign} {formatPKR(Math.abs(bank.netFlow))}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
      </div>
    </div>
  );
}
