"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Period } from "@/types/period";

interface PeriodSelectorProps {
  activePeriod: Period;
  onChange: (period: Period) => void;
}

const PERIODS: Array<{ type: Period["type"]; label: string }> = [
  { type: "this_month", label: "This Month" },
  { type: "last_month", label: "Last Month" },
  { type: "ytd", label: "Year to Date" },
  { type: "custom", label: "Custom" },
];

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function PeriodSelector({ activePeriod, onChange }: PeriodSelectorProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const defaultMonth = useMemo(() => currentMonthKey(), []);
  const [customStart, setCustomStart] = useState(
    activePeriod.type === "custom" ? activePeriod.start : defaultMonth
  );
  const [customEnd, setCustomEnd] = useState(
    activePeriod.type === "custom" ? activePeriod.end : defaultMonth
  );

  const selectPeriod = (type: Period["type"]) => {
    if (type === "custom") {
      setCustomOpen(true);
      return;
    }
    onChange({ type } as Period);
  };

  const applyCustom = () => {
    onChange({ type: "custom", start: customStart, end: customEnd });
    setCustomOpen(false);
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-6 pb-1 no-scrollbar">
        {PERIODS.map((period) => {
          const isActive = activePeriod.type === period.type;
          return (
            <motion.button
              key={period.type}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => selectPeriod(period.type)}
              className="relative flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest"
              style={{
                color: isActive ? "#CCFF00" : "rgba(255,255,255,0.40)",
                border: isActive
                  ? "1px solid rgba(204,255,0,0.40)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: isActive ? "rgba(204,255,0,0.10)" : "rgba(255,255,255,0.05)",
                boxShadow: isActive ? "0 0 12px rgba(204,255,0,0.15)" : "none",
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="period-active-highlight"
                  className="absolute inset-0 rounded-full"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10">{period.label}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {customOpen && (
          <motion.div className="fixed inset-0 z-[80]">
            <motion.button
              aria-label="Close custom period"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-[#121216] border-t border-white/10 px-6 pb-8 pt-4"
            >
              <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-white/10" />
              <p className="text-white text-lg font-extrabold">Custom Period</p>
              <p className="mt-1 text-white/35 text-sm">Pick the month range you want to review.</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="text-white/40 text-xs font-bold uppercase tracking-widest">
                  From
                  <input
                    type="month"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="mt-2 w-full rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-3 text-white outline-none focus:border-[#CCFF00]"
                  />
                </label>
                <label className="text-white/40 text-xs font-bold uppercase tracking-widest">
                  To
                  <input
                    type="month"
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="mt-2 w-full rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-3 text-white outline-none focus:border-[#CCFF00]"
                  />
                </label>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={applyCustom}
                disabled={!customStart || !customEnd}
                className="mt-6 w-full rounded-2xl bg-[#CCFF00] py-4 text-black font-extrabold uppercase tracking-wider disabled:opacity-40"
              >
                Apply Period
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
