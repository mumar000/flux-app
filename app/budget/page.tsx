"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useExpensesQuery } from "@/hooks/queries/useExpenses";
import { useDeleteExpense } from "@/hooks/mutations/useDeleteExpense";
import { expenseService, type Expense } from "@/services/expense.service";
import { SpendingPieChart } from "@/components/mobile/SpendingPieChart";
import { DailyRizqCard } from "@/components/mobile/DailyRizqCard";
import { BottomNav } from "@/components/mobile/BottomNav";
import { formatPKR, CATEGORY_EMOJIS, CATEGORY_COLORS } from "@/utils/expenseParser";

interface SwipeableExpenseRowProps {
  expense: Expense;
  index: number;
  onDelete: (id: string) => void;
  formatDate: (s: string) => string;
}

function SwipeableExpenseRow({ expense, index, onDelete, formatDate }: SwipeableExpenseRowProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -40, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-100, -40, 0], [1.1, 0.85, 0.6]);
  const cardOpacity = useTransform(x, [-200, -120, 0], [0, 0.3, 1]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -80) {
      animate(x, -500, { duration: 0.25, ease: "easeIn" }).then(() => {
        onDelete(expense.id);
      });
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  };

  return (
    <motion.div
      key={expense.id}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative overflow-hidden rounded-[16px]"
    >
      {/* Red delete background */}
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

      {/* Swipeable card */}
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
            style={{ background: `${CATEGORY_COLORS[expense.category] || "#8884d8"}18` }}
          >
            {CATEGORY_EMOJIS[expense.category] || "📦"}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{expense.description}</p>
            <div className="flex items-center gap-1.5 text-xs text-white/35 mt-0.5">
              <span>{expense.bank_account}</span>
              <span>·</span>
              <span>{formatDate(expense.created_at)}</span>
            </div>
          </div>
        </div>
        <span className="font-extrabold text-white text-sm flex-shrink-0">
          -{formatPKR(Number(expense.amount))}
        </span>
      </motion.div>
    </motion.div>
  );
}

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-[16px] ${className ?? ""}`}
      style={{ background: "rgba(255,255,255,0.05)", ...style }}
    />
  );
}

export default function BudgetPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data: expenses = [], isLoading, refetch } = useExpensesQuery();
  const deleteExpense = useDeleteExpense();

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [user, authLoading, router]);

  const monthlyStats = useMemo(
    () => expenseService.getMonthlyStats(expenses),
    [expenses]
  );

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

  const visibleExpenses = showAll ? monthlyStats.expenses : monthlyStats.expenses.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ backgroundColor: "#0F0F11" }}>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-6 pt-10 pb-4">
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

        {/* Total spent card */}
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
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Total Spent</p>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skel-amount" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-40 h-10 rounded-2xl mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="w-28 h-4 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
              </motion.div>
            ) : (
              <motion.div key="real-amount" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-4xl font-extrabold text-white">{formatPKR(monthlyStats.totalSpent)}</h2>
                <p className="text-white/35 text-sm mt-1">
                  {monthlyStats.expenses.length} transaction{monthlyStats.expenses.length !== 1 ? "s" : ""} this month
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6">

        {/* Daily Rizq — always reserve space */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <DailyRizqCard />
        </motion.div>

        {/* Pie chart — skeleton while loading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
                <SpendingPieChart data={monthlyStats.byCategory} totalSpent={monthlyStats.totalSpent} title="Spending by Category" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bank breakdown */}
        <AnimatePresence>
          {!isLoading && Object.keys(monthlyStats.byBank).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-[24px] p-5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-base font-extrabold text-white mb-4">💳 By Account</h3>
              <div className="space-y-3">
                {Object.entries(monthlyStats.byBank).sort(([, a], [, b]) => b - a).map(([bank, amount], i) => {
                  const pct = (amount / monthlyStats.totalSpent) * 100;
                  return (
                    <motion.div key={bank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/70 text-sm font-medium">{bank}</span>
                        <span className="text-white text-sm font-bold">{formatPKR(amount)}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, delay: i * 0.08 }}
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #CCFF00, #99CC00)" }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-white">Recent Transactions</h3>
            {!isLoading && monthlyStats.expenses.length > 5 && (
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
                : visibleExpenses.map((expense, i) => (
                    <SwipeableExpenseRow
                      key={expense.id}
                      expense={expense}
                      index={i}
                      onDelete={(id) => deleteExpense.mutate(id)}
                      formatDate={formatDate}
                    />
                  ))}
            </AnimatePresence>

            {!isLoading && monthlyStats.expenses.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-white/40 font-medium">No expenses yet this month</p>
                <p className="text-white/20 text-sm mt-1">Tap + to add your first one</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
