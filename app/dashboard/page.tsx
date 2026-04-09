"use client";

import React, { useState, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions, useTransactionStats } from "@/hooks/queries/useTransactions";
import { useDeleteTransaction } from "@/hooks/mutations/useDeleteTransaction";
import { type Transaction } from "@/services/transaction.service";
import { SpendingPieChart } from "@/components/mobile/SpendingPieChart";
import { DailyRizqCard } from "@/components/mobile/DailyRizqCard";
import { SpendStreakCard } from "@/components/mobile/SpendStreakCard";
import { BottomNav } from "@/components/mobile/BottomNav";
import { formatPKR, CATEGORY_EMOJIS, CATEGORY_COLORS } from "@/utils/expenseParser";

const INCOME_EMOJIS: Record<string, string> = {
  Salary: "💼",
  "Freelance / Gig": "🧠",
  Transfer: "🔄",
  "Cash Deposit": "🏦",
  Refund: "↩️",
  Gift: "🎁",
  "Paid Back": "🤝",
  Other: "✨",
};

const INCOME_COLORS: Record<string, string> = {
  Salary: "#22C55E",
  "Freelance / Gig": "#06B6D4",
  Transfer: "#38BDF8",
  "Cash Deposit": "#84CC16",
  Refund: "#F59E0B",
  Gift: "#EC4899",
  "Paid Back": "#A78BFA",
  Other: "#94A3B8",
};

interface SwipeableTransactionRowProps {
  transaction: Transaction;
  index: number;
  onDelete: (id: string) => void;
  formatDate: (s: string) => string;
}

function SwipeableTransactionRow({ transaction, index, onDelete, formatDate }: SwipeableTransactionRowProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -40, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-100, -40, 0], [1.1, 0.85, 0.6]);
  const cardOpacity = useTransform(x, [-200, -120, 0], [0, 0.3, 1]);
  const isIncome = transaction.direction === "income";
  const categoryColor = isIncome
    ? INCOME_COLORS[transaction.category] || "#22C55E"
    : CATEGORY_COLORS[transaction.category] || "#8884d8";
  const categoryEmoji = isIncome
    ? INCOME_EMOJIS[transaction.category] || "✨"
    : CATEGORY_EMOJIS[transaction.category] || "📦";

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -80) {
      animate(x, -500, { duration: 0.25, ease: "easeIn" }).then(() => {
        onDelete(transaction.id);
      });
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  };

  return (
    <motion.div
      key={transaction.id}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative overflow-hidden rounded-[16px]"
    >
      <motion.div
        style={{
          opacity: deleteOpacity,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,59,48,0.15) 30%, rgba(255,59,48,0.95) 100%)",
        }}
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-[16px]"
      >
        <motion.div style={{ scale: deleteScale }} className="flex flex-col items-center gap-1">
          <span className="text-2xl">🗑️</span>
          <span className="text-white text-[10px] font-bold tracking-wide">DELETE</span>
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{
          x,
          opacity: cardOpacity,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
        }}
        className="relative p-4 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${categoryColor}18` }}
          >
            {categoryEmoji}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{transaction.description}</p>
            <div className="flex items-center gap-1.5 text-xs text-white/35 mt-0.5">
              <span>{transaction.bank_account}</span>
              <span>·</span>
              <span>{formatDate(transaction.created_at)}</span>
            </div>
          </div>
        </div>
        <span className={`font-extrabold text-sm flex-shrink-0 ${isIncome ? "text-[#86EFAC]" : "text-white"}`}>
          {isIncome ? "+" : "-"}
          {formatPKR(Number(transaction.amount))}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const { data: transactions = [], isLoading: transactionsLoading, refetch } = useTransactions({
    month: currentMonthKey,
  });
  const { data: transactionStats } = useTransactionStats(currentMonthKey);
  const deleteTransaction = useDeleteTransaction();

  const isLoading = transactionsLoading;
  const [showAll, setShowAll] = useState(false);

  const expenseBreakdown = useMemo(() => {
    const expensesOnly = transactions.filter((t) => t.direction === "expense");
    const byCategory: Record<string, number> = {};
    expensesOnly.forEach((expense) => {
      byCategory[expense.category] = (byCategory[expense.category] ?? 0) + Number(expense.amount);
    });
    return byCategory;
  }, [transactions]);

  const formatDate = (s: string) => {
    const diffMs = Date.now() - new Date(s).getTime();
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(diffMs / 3600000);
    const d = Math.floor(diffMs / 86400000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return new Date(s).toLocaleDateString("en-PK", { month: "short", day: "numeric" });
  };

  const currentMonth = new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" });

  if (!user && !authLoading) return null;

  const visibleTransactions = showAll ? transactions : transactions.slice(0, 5);
  const totalIncome = transactionStats?.totalIncome ?? 0;
  const totalExpenses = transactionStats?.totalExpenses ?? 0;
  const netFlow = transactionStats?.netFlow ?? 0;
  const byBank = transactionStats?.byBank ?? {};

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ backgroundColor: "#0F0F11" }}>

      {/* Header */}
      <header className="px-6 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#8F90A6] text-xs font-extrabold tracking-widest uppercase">Rizqly</p>
            <h1 className="text-2xl font-extrabold text-white mt-0.5">{currentMonth}</h1>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => refetch()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            🔄
          </motion.button>
        </div>

        {/* Net flow card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="mt-5 p-6 rounded-[24px] relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(204,255,0,0.1) 0%, rgba(204,255,0,0.03) 100%)",
            border: "1px solid rgba(204,255,0,0.2)",
          }}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #CCFF00 0%, transparent 70%)" }} />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Net Flow</p>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skel-amount" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-40 h-10 rounded-2xl mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="w-28 h-4 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
              </motion.div>
            ) : (
              <motion.div key="real-amount" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className={`text-4xl font-extrabold ${netFlow >= 0 ? "text-white" : "text-[#FF8B8B]"}`}>
                  {netFlow >= 0 ? "+" : "-"}{formatPKR(Math.abs(netFlow))}
                </h2>
                <p className="text-white/35 text-sm mt-1">
                  {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} this month
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span className="text-[#86EFAC]">In {formatPKR(totalIncome)}</span>
                  <span className="text-white/20">•</span>
                  <span className="text-white/65">Out {formatPKR(totalExpenses)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6">

        <div>
          <DailyRizqCard />
        </div>

        <div>
          <SpendStreakCard />
        </div>

        <div>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skel-chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-[24px] p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-36 h-5 rounded-xl mb-5 animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 rounded-full animate-pulse flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="flex-1 space-y-3">
                    {[80, 60, 70, 50].map((w, i) => (
                      <div key={i} className="h-3.5 rounded-lg animate-pulse" style={{ width: `${w}%`, background: "rgba(255,255,255,0.05)" }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="real-chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SpendingPieChart data={expenseBreakdown} totalSpent={totalExpenses} title="Expenses by Category" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bank breakdown */}
        <AnimatePresence>
          {!isLoading && Object.keys(byBank).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-[24px] p-5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-base font-extrabold text-white mb-4">💳 Net by Account</h3>
              <div className="space-y-3">
                {Object.entries(byBank).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)).map(([bank, amount], i) => {
                  const denominator = Math.max(Math.abs(netFlow), totalIncome, totalExpenses, 1);
                  const pct = (Math.abs(amount) / denominator) * 100;
                  return (
                    <motion.div key={bank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/70 text-sm font-medium">{bank}</span>
                        <span className={`text-sm font-bold ${amount >= 0 ? "text-[#86EFAC]" : "text-white"}`}>
                          {amount >= 0 ? "+" : "-"}{formatPKR(Math.abs(amount))}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, delay: i * 0.08 }}
                          className="h-full rounded-full"
                          style={{ background: amount >= 0 ? "linear-gradient(90deg, #86EFAC, #22C55E)" : "linear-gradient(90deg, #CCFF00, #99CC00)" }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions */}
        <div className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-white">Recent Transactions</h3>
            {!isLoading && transactions.length > 5 && (
              <button onClick={() => setShowAll(!showAll)} className="text-[#CCFF00] text-sm font-bold">
                {showAll ? "Show Less" : "See All"}
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {isLoading
                ? [1, 2, 3].map((n) => (
                    <motion.div key={`skel-tx-${n}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="rounded-[16px] p-4 flex items-center gap-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="w-11 h-11 rounded-[14px] flex-shrink-0 animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
                      <div className="flex-1 space-y-2">
                        <div className="w-3/5 h-3.5 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
                        <div className="w-2/5 h-3 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                      </div>
                      <div className="w-16 h-4 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                    </motion.div>
                  ))
                : visibleTransactions.map((transaction, i) => (
                    <SwipeableTransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      index={i}
                      onDelete={(id) => deleteTransaction.mutate(id)}
                      formatDate={formatDate}
                    />
                  ))}
            </AnimatePresence>

            {!isLoading && transactions.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-white/40 font-medium">No transactions yet this month</p>
                <p className="text-white/20 text-sm mt-1">Tap + to add income or expense</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
