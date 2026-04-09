"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { QuickExpenseInput } from "@/components/mobile/QuickExpenseInput";
import { useAddExpense } from "@/hooks/mutations/useAddExpense";
import { useAddIncome } from "@/hooks/mutations/useAddIncome";
import type { CreateExpenseInput } from "@/services/expense.service";
import { AddIncomeSheet } from "@/components/mobile/AddIncomeSheet";
import type { CreateTransactionInput } from "@/services/transaction.service";

function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
        fill={filled ? "#CCFF00" : "none"}
        stroke={filled ? "#CCFF00" : "rgba(255,255,255,0.4)"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoalsIcon({ filled }: { filled: boolean }) {
  const c = filled ? "#CCFF00" : "rgba(255,255,255,0.4)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5.5" stroke={c} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2" fill={c} />
    </svg>
  );
}

function SettingsIcon({ filled }: { filled: boolean }) {
  const c = filled ? "#CCFF00" : "rgba(255,255,255,0.4)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={c} strokeWidth="1.8" strokeLinecap="round"
      />
    </svg>
  );
}

function StreaksIcon({ filled }: { filled: boolean }) {
  const c = filled ? "#CCFF00" : "rgba(255,255,255,0.4)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
        fill={filled ? "#CCFF00" : "none"}
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: "Home",     href: "/dashboard", Icon: HomeIcon },
  { label: "Streaks",  href: "/streaks",   Icon: StreaksIcon },
  { label: "Goals",    href: "/goals",    Icon: GoalsIcon },
  { label: "Settings", href: "/settings", Icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showActions, setShowActions] = useState(false);
  const [showExpenseSheet, setShowExpenseSheet] = useState(false);
  const [showIncomeSheet, setShowIncomeSheet] = useState(false);
  const { mutate: addExpense } = useAddExpense();
  const { mutate: addIncome } = useAddIncome();

  const handleExpenseAdded = (expense: CreateExpenseInput) => {
    addExpense(expense);
  };

  const handleIncomeAdded = (
    income: Omit<CreateTransactionInput, "direction">
  ) => {
    addIncome(income);
  };

  return (
    <>
      <div
        className="fixed bottom-0 inset-x-0 z-30"
        style={{
          background: "rgba(13,13,17,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center px-4 pt-2 pb-6 max-w-lg mx-auto">

          {/* Left tabs */}
          {NAV_ITEMS.slice(0, 2).map(({ label, href, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} prefetch className="flex flex-col items-center gap-1 flex-1 py-1 relative">
                <motion.div animate={{ scale: active ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                  <Icon filled={active} />
                </motion.div>
                <span className="text-[10px] font-bold" style={{ color: active ? "#CCFF00" : "rgba(255,255,255,0.35)" }}>
                  {label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1.5 w-4 h-0.5 rounded-full"
                    style={{ background: "#CCFF00" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Center FAB */}
          <div className="flex-1 flex justify-center -mt-5">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowActions(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "#CCFF00",
                boxShadow: "0 0 20px rgba(204,255,0,0.45), 0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              <motion.svg
                width="22" height="22" viewBox="0 0 24 24" fill="none"
                animate={{ rotate: showActions ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <path d="M12 5v14M5 12h14" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
              </motion.svg>
            </motion.button>
          </div>

          {/* Right tab */}
          {NAV_ITEMS.slice(2).map(({ label, href, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} prefetch className="flex flex-col items-center gap-1 flex-1 py-1 relative">
                <motion.div animate={{ scale: active ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                  <Icon filled={active} />
                </motion.div>
                <span className="text-[10px] font-bold" style={{ color: active ? "#CCFF00" : "rgba(255,255,255,0.35)" }}>
                  {label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1.5 w-4 h-0.5 rounded-full"
                    style={{ background: "#CCFF00" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showActions && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActions(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="fixed left-1/2 bottom-28 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-[28px] p-3"
              style={{
                background: "rgba(14,14,18,0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 16px 60px rgba(0,0,0,0.45)",
              }}
            >
              <button
                onClick={() => {
                  setShowActions(false);
                  setShowExpenseSheet(true);
                }}
                className="w-full rounded-[22px] px-4 py-4 flex items-center justify-between text-left"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(204,255,0,0.12) 0%, rgba(204,255,0,0.04) 100%)",
                  border: "1px solid rgba(204,255,0,0.12)",
                }}
              >
                <div>
                  <p className="text-white font-extrabold text-sm">Add Expense</p>
                  <p className="text-white/35 text-xs mt-1">Track money going out</p>
                </div>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl bg-[#CCFF00] text-black">
                  💸
                </div>
              </button>

              <button
                onClick={() => {
                  setShowActions(false);
                  setShowIncomeSheet(true);
                }}
                className="w-full rounded-[22px] px-4 py-4 flex items-center justify-between text-left mt-2.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(34,197,94,0.04) 100%)",
                  border: "1px solid rgba(134,239,172,0.12)",
                }}
              >
                <div>
                  <p className="text-white font-extrabold text-sm">Add Money</p>
                  <p className="text-white/35 text-xs mt-1">Track money coming in</p>
                </div>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl bg-[#86EFAC] text-[#052E16]">
                  ✨
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <QuickExpenseInput
        onExpenseAdded={handleExpenseAdded}
        open={showExpenseSheet}
        onClose={() => setShowExpenseSheet(false)}
      />

      <AddIncomeSheet
        open={showIncomeSheet}
        onClose={() => setShowIncomeSheet(false)}
        onIncomeAdded={handleIncomeAdded}
      />
    </>
  );
}
