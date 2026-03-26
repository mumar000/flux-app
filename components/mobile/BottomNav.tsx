"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { QuickExpenseInput } from "@/components/mobile/QuickExpenseInput";
import { useExpenses } from "@/hooks/useExpenses";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
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
      <circle cx="12" cy="12" r="2" fill={filled ? "#CCFF00" : c} />
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
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Home",     href: "/budget",   icon: HomeIcon },
  { label: "Goals",    href: "/goals",    icon: GoalsIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

interface BottomNavProps {
  onExpenseAdded?: (expense: {
    amount: number;
    description: string;
    bankAccount: string;
    category: string;
    rawInput: string;
  }) => void;
}

export function BottomNav({ onExpenseAdded }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const { addExpense } = useExpenses();

  const handleExpenseAdded = async (expense: {
    amount: number; description: string;
    bankAccount: string; category: string; rawInput: string;
  }) => {
    await addExpense(expense);
    onExpenseAdded?.(expense);
  };

  return (
    <>
      {/* Nav bar */}
      <div
        className="fixed bottom-0 inset-x-0 z-30"
        style={{
          background: "rgba(13, 13, 17, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center justify-around px-4 pt-2 pb-6 max-w-lg mx-auto relative">

          {/* Left two tabs */}
          {NAV_ITEMS.slice(0, 2).map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center gap-1 flex-1 py-1 relative"
              >
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <item.icon filled={active} />
                </motion.div>
                <span
                  className="text-[10px] font-bold tracking-wide"
                  style={{ color: active ? "#CCFF00" : "rgba(255,255,255,0.35)" }}
                >
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                    style={{ background: "#CCFF00" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}

          {/* Center FAB */}
          <div className="flex-1 flex justify-center -mt-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAdd(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
              style={{
                background: "#CCFF00",
                boxShadow: "0 0 24px rgba(204,255,0,0.4), 0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              <motion.div
                animate={{ rotate: showAdd ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <PlusIcon />
              </motion.div>
            </motion.button>
          </div>

          {/* Right tab */}
          {NAV_ITEMS.slice(2).map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center gap-1 flex-1 py-1 relative"
              >
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <item.icon filled={active} />
                </motion.div>
                <span
                  className="text-[10px] font-bold tracking-wide"
                  style={{ color: active ? "#CCFF00" : "rgba(255,255,255,0.35)" }}
                >
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-1.5 w-1 h-1 rounded-full"
                    style={{ background: "#CCFF00" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick add expense sheet — controlled externally by BottomNav FAB */}
      <QuickExpenseInput
        onExpenseAdded={handleExpenseAdded}
        open={showAdd}
        onClose={() => setShowAdd(false)}
      />
    </>
  );
}
