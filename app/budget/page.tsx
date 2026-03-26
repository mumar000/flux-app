"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpendingPieChart } from "@/components/mobile/SpendingPieChart";
import { QuickExpenseInput } from "@/components/mobile/QuickExpenseInput";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  formatPKR,
  CATEGORY_EMOJIS,
  CATEGORY_COLORS,
} from "@/utils/expenseParser";
import { DailyRizqCard } from "@/components/mobile/DailyRizqCard";
import { GoalsSection } from "@/components/mobile/GoalsSection";

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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  const monthlyStats = getMonthlyStats();

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
  };

  // Get current month name
  const currentMonth = new Date().toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  });

  const handleExpenseAdded = async (expense: {
    amount: number;
    description: string;
    bankAccount: string;
    category: string;
    rawInput: string;
  }) => {
    await addExpense(expense);
  };

  // Show loading while auth or expenses are loading
  if (isLoading || authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0F0F11" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-4xl"
        >
          💫
        </motion.div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex flex-col relative pb-24"
      style={{ backgroundColor: "#0F0F11" }}
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-8 pb-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[#8F90A6] text-sm font-bold tracking-widest uppercase">
                Rizqly
              </p>
              {/* Online/Offline indicator */}
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: isOnline ? "#22C55E" : "#F59E0B",
                  boxShadow: isOnline ? "0 0 8px #22C55E" : "0 0 8px #F59E0B",
                }}
                title={isOnline ? "Connected to database" : "Offline mode"}
              />
            </div>
            <h1 className="text-2xl font-bold text-white">{currentMonth}</h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refresh}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              🔄
            </motion.button>
            <Link href="/settings">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                ⚙️
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs"
          >
            {error}
          </motion.div>
        )}

        {/* Total Spent Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 p-6 rounded-[24px] relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(204, 255, 0, 0.1) 0%, rgba(204, 255, 0, 0.03) 100%)",
            border: "1px solid rgba(204, 255, 0, 0.2)",
          }}
        >
          {/* Decorative elements */}
          <div
            className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, #CCFF00 0%, transparent 70%)",
            }}
          />

          <p className="text-white/50 text-sm uppercase tracking-wider mb-1">
            Total Spent This Month
          </p>
          <motion.h2
            key={monthlyStats.totalSpent}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold text-white"
          >
            {formatPKR(monthlyStats.totalSpent)}
          </motion.h2>
          <p className="text-white/40 text-sm mt-1">
            {monthlyStats.expenses.length} transaction
            {monthlyStats.expenses.length !== 1 ? "s" : ""}
          </p>
        </motion.div>
      </motion.header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6">
        {/* Daily Rizq Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <DailyRizqCard />
        </motion.div>

        {/* Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GoalsSection />
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SpendingPieChart
            data={monthlyStats.byCategory}
            totalSpent={monthlyStats.totalSpent}
            title="Spending by Category"
          />
        </motion.div>

        {/* Bank Account Breakdown */}
        {Object.keys(monthlyStats.byBank).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-[24px] p-5"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              💳 By Account
            </h3>
            <div className="space-y-3">
              {Object.entries(monthlyStats.byBank)
                .sort(([, a], [, b]) => b - a)
                .map(([bank, amount], index) => {
                  const percentage = (amount / monthlyStats.totalSpent) * 100;
                  return (
                    <motion.div
                      key={bank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/80">{bank}</span>
                        <span className="text-white font-medium">
                          {formatPKR(amount)}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{
                            duration: 0.8,
                            delay: 0.5 + index * 0.1,
                          }}
                          className="h-full rounded-full"
                          style={{
                            background:
                              "linear-gradient(90deg, #CCFF00, #99CC00)",
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Recent Transactions
            </h3>
            {monthlyStats.expenses.length > 5 && (
              <button
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-[#CCFF00] text-sm font-medium"
              >
                {showAllTransactions ? "Show Less" : "See All"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {(showAllTransactions
                ? monthlyStats.expenses
                : monthlyStats.expenses.slice(0, 5)
              ).map((expense, index) => (
                <motion.div
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-[16px] p-4 flex items-center justify-between group"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-[14px] flex items-center justify-center text-2xl"
                      style={{
                        background: `${CATEGORY_COLORS[expense.category] || "#8884d8"}20`,
                      }}
                    >
                      {CATEGORY_EMOJIS[expense.category] || "📦"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        {expense.description}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-white/40">
                        <span>{expense.bank_account}</span>
                        <span>•</span>
                        <span>{formatDate(expense.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">
                      -{formatPKR(Number(expense.amount))}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteExpense(expense.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 p-1"
                    >
                      🗑️
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {monthlyStats.expenses.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-white/40">No expenses yet this month!</p>
                <p className="text-white/20 text-sm mt-2">
                  Tap the + button to add your first expense
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Swipe Expense Input (FAB) */}
      <QuickExpenseInput onExpenseAdded={handleExpenseAdded} />
    </div>
  );
}
