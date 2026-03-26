"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpendingPieChart } from "@/components/mobile/SpendingPieChart";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { formatPKR, CATEGORY_EMOJIS, CATEGORY_COLORS } from "@/utils/expenseParser";
import { DailyRizqCard } from "@/components/mobile/DailyRizqCard";
import { BottomNav } from "@/components/mobile/BottomNav";

export default function BudgetPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    expenses,
    addExpense,
    deleteExpense,
    getMonthlyStats,
    isLoading,
    error,
    isOnline,
    refresh,
  } = useExpenses();
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [user, authLoading, router]);

  const monthlyStats = getMonthlyStats();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
  };

  const currentMonth = new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" });

  if (!user && !authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col relative pb-28" style={{ backgroundColor: "#0F0F11" }}>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-6 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[#8F90A6] text-xs font-extrabold tracking-widest uppercase">Rizqly</p>
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isOnline ? "#22C55E" : "#F59E0B",
                  boxShadow: isOnline ? "0 0 6px #22C55E" : "0 0 6px #F59E0B",
                }}
              />
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-0.5">{currentMonth}</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={refresh}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            🔄
          </motion.button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium">
            {error}
          </motion.div>
        )}

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
          <motion.h2 key={monthlyStats.totalSpent} initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-extrabold text-white">
            {formatPKR(monthlyStats.totalSpent)}
          </motion.h2>
          <p className="text-white/35 text-sm mt-1">
            {monthlyStats.expenses.length} transaction{monthlyStats.expenses.length !== 1 ? "s" : ""} this month
          </p>
        </motion.div>
      </motion.header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6">

        {/* Daily Rizq */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <DailyRizqCard />
        </motion.div>

        {/* Pie chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SpendingPieChart data={monthlyStats.byCategory} totalSpent={monthlyStats.totalSpent} title="Spending by Category" />
        </motion.div>

        {/* Bank breakdown */}
        {Object.keys(monthlyStats.byBank).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-[24px] p-5"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-base font-extrabold text-white mb-4">💳 By Account</h3>
            <div className="space-y-3">
              {Object.entries(monthlyStats.byBank).sort(([, a], [, b]) => b - a).map(([bank, amount], i) => {
                const pct = (amount / monthlyStats.totalSpent) * 100;
                return (
                  <motion.div key={bank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.08 }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white/70 text-sm font-medium">{bank}</span>
                      <span className="text-white text-sm font-bold">{formatPKR(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-white/08 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, delay: 0.4 + i * 0.08 }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #CCFF00, #99CC00)" }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recent transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-white">Recent Transactions</h3>
            {monthlyStats.expenses.length > 5 && (
              <button onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-[#CCFF00] text-sm font-bold">
                {showAllTransactions ? "Show Less" : "See All"}
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {(showAllTransactions ? monthlyStats.expenses : monthlyStats.expenses.slice(0, 5)).map((expense, i) => (
                <motion.div key={expense.id} layout
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -80 }} transition={{ delay: i * 0.04 }}
                  className="rounded-[16px] p-4 flex items-center justify-between group"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${CATEGORY_COLORS[expense.category] || "#8884d8"}18` }}>
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
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-extrabold text-white text-sm">-{formatPKR(Number(expense.amount))}</span>
                    <motion.button whileTap={{ scale: 0.85 }}
                      onClick={() => deleteExpense(expense.id)}
                      className="opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity text-red-400 text-sm p-1">
                      🗑️
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {monthlyStats.expenses.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-white/40 font-medium">No expenses yet this month</p>
                <p className="text-white/20 text-sm mt-1">Tap + to add your first one</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <BottomNav onExpenseAdded={(e) => addExpense(e)} />
    </div>
  );
}
