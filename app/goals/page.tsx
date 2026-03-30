"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/queries/useGoals";
import { useContributeGoal } from "@/hooks/mutations/useContributeGoal";
import { useDeleteGoal } from "@/hooks/mutations/useDeleteGoal";
import { CreateGoalModal } from "@/components/mobile/CreateGoalModal";
import { BottomNav } from "@/components/mobile/BottomNav";
import type { Goal } from "@/services/goal.service";

// ── Color palette ──────────────────────────────────────────────────────────────
const PALETTE = ["#CCFF00", "#FF6B6B", "#4ECDC4", "#A78BFA", "#FFB347", "#FF69B4", "#38BDF8"];

function getColor(i: number) { return PALETTE[i % PALETTE.length]; }

function formatPKR(n: number) { return `PKR ${Math.round(n).toLocaleString("en-PK")}`; }

function daysLeft(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

// ── Animated SVG ring ──────────────────────────────────────────────────────────
function Ring({ pct, color, size = 64, stroke = 5 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  );
}

// ── Contribute numpad sheet ────────────────────────────────────────────────────
function ContributeSheet({ goal, color, onClose }: { goal: Goal; color: string; onClose: () => void }) {
  const [value, setValue] = useState("");
  const contribute = useContributeGoal();
  const remaining = goal.target_amount - goal.current_amount;
  const presets = [500, 1000, 2000, 5000].filter(a => a <= remaining);

  const confirm = () => {
    const n = parseInt(value, 10);
    if (!n || n <= 0) return;
    contribute.mutate({ id: goal.id, amount: Math.min(n, remaining) });
    onClose();
  };

  const keys = ["1","2","3","4","5","6","7","8","9","⌫","0","✓"];

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] px-5 pt-4 pb-10"
      style={{ background: "#12132A", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{goal.emoji}</span>
        <div>
          <p className="text-white font-extrabold">{goal.title}</p>
          <p className="text-xs font-bold" style={{ color }}>{formatPKR(remaining)} remaining</p>
        </div>
      </div>

      {presets.length > 0 && (
        <div className="flex gap-2 mb-4">
          {presets.map(a => {
            const active = value === String(a);
            return (
              <motion.button key={a} whileTap={{ scale: 0.86 }} onClick={() => setValue(String(a))}
                className="flex-1 py-2.5 rounded-2xl text-xs font-extrabold"
                style={{
                  background: active ? `${color}20` : "rgba(255,255,255,0.05)",
                  color: active ? color : "rgba(255,255,255,0.4)",
                  border: `1px solid ${active ? color + "40" : "transparent"}`,
                }}>
                +{a >= 1000 ? `${a/1000}k` : a}
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl p-4 mb-4 text-center"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Adding</p>
        <motion.p key={value} initial={{ scale: 1.06 }} animate={{ scale: 1 }}
          className="text-3xl font-extrabold"
          style={{ color: value ? "#fff" : "rgba(255,255,255,0.18)" }}>
          {value ? `PKR ${parseInt(value).toLocaleString("en-PK")}` : "PKR —"}
        </motion.p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {keys.map(k => {
          const isOk = k === "✓", isBk = k === "⌫", ok = isOk && parseInt(value, 10) > 0;
          return (
            <motion.button key={k} whileTap={{ scale: 0.85 }}
              onClick={() => k === "⌫" ? setValue(v => v.slice(0,-1)) : k === "✓" ? confirm() : value.length < 7 && setValue(v => v+k)}
              className="h-14 rounded-2xl text-xl font-bold flex items-center justify-center"
              style={{
                background: isOk ? (ok ? color : "rgba(255,255,255,0.04)") : isBk ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.07)",
                color: isOk ? (ok ? "#000" : "rgba(255,255,255,0.18)") : "#fff",
                boxShadow: ok ? `0 0 18px ${color}30` : "none",
              }}>
              {k}
            </motion.button>
          );
        })}
      </div>

      <button onClick={onClose} className="w-full mt-3 py-3 text-sm text-white/25 font-medium">Cancel</button>
    </motion.div>
  );
}

// ── Full-width Goal card ───────────────────────────────────────────────────────
function GoalRow({ goal, index }: { goal: Goal; index: number }) {
  const color = getColor(index);
  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const remaining = goal.target_amount - goal.current_amount;
  const days = goal.deadline ? daysLeft(goal.deadline) : null;
  const perDay = days && days > 0 ? Math.ceil(remaining / days) : null;
  const [sheet, setSheet] = useState(false);
  const deleteGoal = useDeleteGoal();

  // Swipe left to delete
  const x = useMotionValue(0);
  const deleteReveal = useTransform(x, [-140, -55, 0], [1, 0.35, 0]);
  const cardX = useTransform(x, [-140, 0], [-20, 0]);

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -115) deleteGoal.mutate(goal.id);
  };

  return (
    <>
      <div className="relative">
        {/* Delete hint */}
        <motion.div className="absolute inset-0 rounded-[28px] flex items-center justify-end pr-6"
          style={{ opacity: deleteReveal, background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.25)" }}>
          <div className="text-center">
            <span className="text-2xl">🗑️</span>
            <p className="text-[10px] text-red-400 font-bold mt-1">DELETE</p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.45, right: 0 }}
          onDragEnd={handleDrag}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26, delay: index * 0.07 }}
          onClick={() => !goal.completed && setSheet(true)}
          className="relative rounded-[28px] overflow-hidden cursor-pointer"
          style={{
            x: cardX,
            background: goal.completed
              ? `linear-gradient(135deg, ${color}12, ${color}04)`
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${goal.completed ? color + "28" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          {/* Accent top bar */}
          <motion.div className="h-[3px] w-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}00)` }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: pct / 100 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 + index * 0.07 }}
          />

          <div className="p-5">
            {/* Row 1: emoji + title + ring */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <motion.span className="text-3xl leading-none flex-shrink-0"
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.55 }}>
                  {goal.emoji}
                </motion.span>
                <div className="min-w-0">
                  <p className="text-white font-extrabold text-base leading-tight truncate">{goal.title}</p>
                  {goal.completed ? (
                    <p className="text-xs font-bold mt-0.5" style={{ color }}>Goal reached! 🎉</p>
                  ) : days !== null ? (
                    <p className="text-xs font-bold mt-0.5" style={{ color: days < 7 ? "#FF6B6B" : "rgba(255,255,255,0.4)" }}>
                      {days === 0 ? "Due today!" : `${days} days left`}
                    </p>
                  ) : (
                    <p className="text-xs text-white/30 mt-0.5 font-medium">Tap to add savings</p>
                  )}
                </div>
              </div>

              {/* Ring + pct */}
              <div className="relative flex-shrink-0">
                <Ring pct={pct} color={color} size={68} stroke={5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[13px] font-extrabold" style={{ color: goal.completed ? color : "#fff" }}>{pct}%</p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}, ${color}70)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + index * 0.07 }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-white font-extrabold text-sm">{formatPKR(goal.current_amount)}</span>
                  <span className="text-white/30 text-xs font-medium"> saved</span>
                </div>
                <div className="text-right">
                  <span className="text-white/40 text-xs font-medium">{formatPKR(goal.target_amount)}</span>
                  {perDay && (
                    <p className="text-[10px] text-white/25 mt-0.5">{formatPKR(perDay)}/day needed</p>
                  )}
                </div>
              </div>
            </div>

            {/* Add button */}
            {!goal.completed && (
              <motion.div
                className="mt-4 flex items-center justify-center py-2.5 rounded-2xl gap-2 font-extrabold text-sm"
                style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="text-base">+</span> Add savings
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {sheet && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/65"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheet(false)} />
            <ContributeSheet goal={goal} color={color} onClose={() => setSheet(false)} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: goals = [] } = useGoals();
  const [showCreate, setShowCreate] = useState(false);

  if (!user && !authLoading) return null;

  const active = goals.filter(g => !g.completed);
  const done = goals.filter(g => g.completed);
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ backgroundColor: "#0F0F11" }}>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-10 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[#8F90A6] text-xs font-extrabold tracking-widest uppercase">Rizqly</p>
            <h1 className="text-2xl font-extrabold text-white mt-0.5">Your Goals</h1>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-extrabold"
            style={{ background: "rgba(204,255,0,0.1)", color: "#CCFF00", border: "1px solid rgba(204,255,0,0.25)" }}>
            <span className="text-base">+</span> New
          </motion.button>
        </div>

        {/* Overall stats bar — only when goals exist */}
        {goals.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="rounded-[24px] p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(204,255,0,0.09) 0%, rgba(204,255,0,0.02) 100%)",
              border: "1px solid rgba(204,255,0,0.18)",
            }}>
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-15"
              style={{ background: "radial-gradient(circle, #CCFF00, transparent 70%)" }} />

            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-0.5">Total Saved</p>
                <p className="text-2xl font-extrabold text-white">{formatPKR(totalSaved)}</p>
                <p className="text-white/35 text-xs mt-0.5">of {formatPKR(totalTarget)} across {goals.length} goal{goals.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold" style={{ color: "#CCFF00" }}>{overallPct}%</p>
                <p className="text-white/30 text-xs">overall</p>
              </div>
            </div>

            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #CCFF00, #88BB00)" }}
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 1.3, ease: "easeOut", delay: 0.2 }} />
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 space-y-4">

        {/* Empty state */}
        {goals.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-[28px] p-8 text-center mt-4 cursor-pointer"
            style={{ background: "rgba(204,255,0,0.04)", border: "1px dashed rgba(204,255,0,0.2)" }}
            onClick={() => setShowCreate(true)}>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl mb-4">🎯</motion.div>
            <p className="text-white font-extrabold text-xl mb-2">No goals yet</p>
            <p className="text-white/35 text-sm mb-6 leading-relaxed">
              Save for a trip, a gadget, anything.<br />Start with one small goal.
            </p>
            <motion.div whileTap={{ scale: 0.95 }}
              className="inline-block px-6 py-3 rounded-2xl text-black font-extrabold"
              style={{ background: "#CCFF00" }}>
              Set your first goal →
            </motion.div>
          </motion.div>
        )}

        {/* Active goals */}
        {active.length > 0 && (
          <div className="space-y-3">
            {active.length > 0 && (
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-extrabold pt-1">
                In progress · {active.length}
              </p>
            )}
            <AnimatePresence>
              {active.map((goal, i) => <GoalRow key={goal.id} goal={goal} index={i} />)}
            </AnimatePresence>
          </div>
        )}

        {/* Completed goals */}
        {done.length > 0 && (
          <div className="space-y-3 pb-4">
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-extrabold pt-2">
              Completed 🏆 · {done.length}
            </p>
            <AnimatePresence>
              {done.map((goal, i) => <GoalRow key={goal.id} goal={goal} index={active.length + i} />)}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CreateGoalModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <BottomNav />
    </div>
  );
}
