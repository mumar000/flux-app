"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { Goal } from "@/services/goal.service";
import { useContributeGoal } from "@/hooks/mutations/useContributeGoal";
import { useDeleteGoal } from "@/hooks/mutations/useDeleteGoal";

export const GOAL_COLORS = [
  "#CCFF00",
  "#FF6B6B",
  "#4ECDC4",
  "#A78BFA",
  "#FFB347",
  "#FF69B4",
  "#38BDF8",
];

const MILESTONES = [25, 50, 75, 100];
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

function formatPKR(n: number) {
  return `PKR ${Math.round(n).toLocaleString("en-PK")}`;
}

function daysLeft(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
}

// ── Animated SVG progress ring ──────────────────────────────────────────────
function ProgressRing({ pct, color, size = 84, stroke = 6 }: {
  pct: number; color: string; size?: number; stroke?: number;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
        style={{ filter: `drop-shadow(0 0 5px ${color}90)` }}
      />
    </svg>
  );
}

// ── Confetti burst on milestone ─────────────────────────────────────────────
function ConfettiBurst({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360;
        const dist = 45 + (i % 3) * 15;
        return (
          <motion.div key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? color : "#fff",
              top: "50%", left: "50%", marginTop: -4, marginLeft: -4,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * dist,
              y: Math.sin((angle * Math.PI) / 180) * dist,
              opacity: 0, scale: 0,
            }}
            transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.025 }}
          />
        );
      })}
    </div>
  );
}

// ── Contribute bottom sheet ──────────────────────────────────────────────────
function ContributeSheet({ goal, color, onClose }: {
  goal: Goal; color: string; onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const contribute = useContributeGoal();
  const remaining = goal.target_amount - goal.current_amount;

  const handleKey = (k: string) => {
    if (k === "⌫") return setValue((v) => v.slice(0, -1));
    if (k === "✓") {
      const n = parseInt(value, 10);
      if (!n || n <= 0) return;
      contribute.mutate({ id: goal.id, amount: Math.min(n, remaining) });
      onClose();
      return;
    }
    if (value.length < 7) setValue((v) => v + k);
  };

  const numStr = value ? parseInt(value, 10).toLocaleString("en-PK") : "";
  const canConfirm = parseInt(value, 10) > 0;
  const keys = ["1","2","3","4","5","6","7","8","9","⌫","0","✓"];

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 360, damping: 36 }}
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] px-5 pt-4 pb-10"
      style={{ background: "#13142A", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Handle */}
      <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

      {/* Goal header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{goal.emoji}</span>
        <div>
          <p className="text-white font-extrabold text-base">{goal.title}</p>
          <p className="text-xs font-semibold" style={{ color }}>
            {formatPKR(remaining)} to go
          </p>
        </div>
      </div>

      {/* Quick preset chips */}
      <div className="flex gap-2 mb-4">
        {QUICK_AMOUNTS.filter((a) => a <= remaining).map((a) => {
          const active = value === String(a);
          return (
            <motion.button key={a} whileTap={{ scale: 0.88 }}
              onClick={() => setValue(String(a))}
              className="flex-1 py-2.5 rounded-2xl text-xs font-extrabold"
              style={{
                background: active ? `${color}20` : "rgba(255,255,255,0.05)",
                color: active ? color : "rgba(255,255,255,0.45)",
                border: `1px solid ${active ? color + "45" : "transparent"}`,
              }}
            >
              +{a >= 1000 ? `${a / 1000}k` : a}
            </motion.button>
          );
        })}
      </div>

      {/* Amount display */}
      <div className="rounded-2xl p-4 mb-4 text-center"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Adding</p>
        <motion.p
          key={numStr}
          initial={{ scale: 1.08, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-extrabold"
          style={{ color: value ? "#fff" : "rgba(255,255,255,0.2)" }}
        >
          {value ? `PKR ${numStr}` : "PKR —"}
        </motion.p>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => {
          const isConfirm = k === "✓";
          const isBack = k === "⌫";
          return (
            <motion.button key={k} whileTap={{ scale: 0.86 }}
              onClick={() => handleKey(k)}
              className="h-14 rounded-2xl text-xl font-bold flex items-center justify-center"
              style={{
                background: isConfirm
                  ? canConfirm ? color : "rgba(255,255,255,0.05)"
                  : isBack
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(255,255,255,0.07)",
                color: isConfirm
                  ? canConfirm ? "#000" : "rgba(255,255,255,0.2)"
                  : "#fff",
                border: isConfirm && canConfirm
                  ? `1px solid ${color}50`
                  : "1px solid transparent",
                boxShadow: isConfirm && canConfirm
                  ? `0 0 16px ${color}30`
                  : "none",
              }}
            >
              {k}
            </motion.button>
          );
        })}
      </div>

      <button onClick={onClose}
        className="w-full mt-3 py-3 text-sm text-white/25 font-medium">
        Cancel
      </button>
    </motion.div>
  );
}

// ── Main GoalCard ────────────────────────────────────────────────────────────
interface GoalCardProps {
  goal: Goal;
  colorIndex: number;
}

export function GoalCard({ goal, colorIndex }: GoalCardProps) {
  const color = GOAL_COLORS[colorIndex % GOAL_COLORS.length];
  const [showSheet, setShowSheet] = useState(false);
  const [burst, setBurst] = useState(false);
  const prevPct = useRef(0);
  const deleteGoal = useDeleteGoal();

  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const remaining = goal.target_amount - goal.current_amount;
  const days = goal.deadline ? daysLeft(goal.deadline) : null;
  const perDay = days && days > 0 ? Math.ceil(remaining / days) : null;

  // Fire confetti when crossing a milestone
  useEffect(() => {
    const crossed = MILESTONES.some((m) => prevPct.current < m && pct >= m);
    if (crossed) { setBurst(true); setTimeout(() => setBurst(false), 800); }
    prevPct.current = pct;
  }, [pct]);

  // Swipe-left to delete
  const x = useMotionValue(0);
  const deleteReveal = useTransform(x, [-130, -50, 0], [1, 0.4, 0]);
  const cardScale = useTransform(x, [-130, 0], [0.94, 1]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -110) deleteGoal.mutate(goal.id);
  };

  return (
    <>
      <div className="relative flex-shrink-0 w-[178px]">
        {/* Delete reveal layer */}
        <motion.div
          className="absolute inset-0 rounded-[24px] flex items-center justify-end pr-5"
          style={{
            opacity: deleteReveal,
            background: "rgba(255,59,48,0.15)",
            border: "1px solid rgba(255,59,48,0.3)",
          }}
        >
          <span className="text-xl">🗑️</span>
        </motion.div>

        {/* Card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.5, right: 0 }}
          onDragEnd={handleDragEnd}
          onClick={() => !goal.completed && setShowSheet(true)}
          className="relative rounded-[24px] p-4 overflow-hidden cursor-pointer"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          style={{
            x, scale: cardScale,
            background: goal.completed
              ? `linear-gradient(145deg, ${color}14, ${color}05)`
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${goal.completed ? color + "30" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          <ConfettiBurst color={color} active={burst} />

          {/* Completed tick */}
          {goal.completed && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="absolute top-3 right-3 text-base"
            >
              ✅
            </motion.div>
          )}

          {/* Emoji */}
          <motion.p
            className="text-[32px] mb-3 leading-none"
            animate={burst ? { scale: [1, 1.45, 1], rotate: [0, -12, 12, 0] } : {}}
            transition={{ duration: 0.55 }}
          >
            {goal.emoji}
          </motion.p>

          {/* Title */}
          <p className="text-white text-[13px] font-extrabold leading-snug mb-3 line-clamp-2">
            {goal.title}
          </p>

          {/* Ring + pct */}
          <div className="relative flex items-center justify-center mb-3">
            <ProgressRing pct={pct} color={color} size={80} stroke={5} />
            <div className="absolute text-center">
              <p className="text-[13px] font-extrabold"
                style={{ color: goal.completed ? color : "white" }}>
                {pct}%
              </p>
            </div>
          </div>

          {/* Amounts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-white/35 text-[10px] font-semibold uppercase tracking-wider">Saved</span>
              <span className="text-white text-[11px] font-bold">{formatPKR(goal.current_amount)}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}90)` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
              />
            </div>
            <p className="text-white/30 text-[10px] text-right">{formatPKR(goal.target_amount)} goal</p>
          </div>

          {/* Deadline / hint */}
          {!goal.completed && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {days !== null ? (
                <>
                  <p className="text-[11px] font-bold"
                    style={{ color: days < 7 ? "#FF6B6B" : color }}>
                    {days === 0 ? "Due today!" : `${days}d left`}
                  </p>
                  {perDay && (
                    <p className="text-[10px] text-white/25 mt-0.5">
                      {formatPKR(perDay)}/day needed
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-white/25">Tap to add savings</p>
              )}
            </div>
          )}

          {/* Pulsing + button */}
          {!goal.completed && (
            <motion.div
              className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center text-[15px] font-black"
              style={{
                background: `${color}18`,
                border: `1px solid ${color}40`,
                color,
              }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              +
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Backdrop + sheet */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/65"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
            />
            <ContributeSheet goal={goal} color={color} onClose={() => setShowSheet(false)} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
