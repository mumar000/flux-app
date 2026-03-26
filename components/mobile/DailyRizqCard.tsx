"use client";

import { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  PanInfo,
} from "framer-motion";
import { useDailyRizq } from "@/hooks/useDailyRizq";

const TYPE_CONFIG: Record<
  string,
  { color: string; gradient: string; label: string; icon: string }
> = {
  insight: {
    color: "#CCFF00",
    gradient: "linear-gradient(135deg, rgba(204, 255, 0, 0.12) 0%, rgba(204, 255, 0, 0.03) 100%)",
    label: "INSIGHT",
    icon: "🔍",
  },
  challenge: {
    color: "#FF6B6B",
    gradient: "linear-gradient(135deg, rgba(255, 107, 107, 0.12) 0%, rgba(255, 107, 107, 0.03) 100%)",
    label: "CHALLENGE",
    icon: "⚡",
  },
  question: {
    color: "#4ECDC4",
    gradient: "linear-gradient(135deg, rgba(78, 205, 196, 0.12) 0%, rgba(78, 205, 196, 0.03) 100%)",
    label: "REFLECTION",
    icon: "💭",
  },
  comparison: {
    color: "#A78BFA",
    gradient: "linear-gradient(135deg, rgba(167, 139, 250, 0.12) 0%, rgba(167, 139, 250, 0.03) 100%)",
    label: "COMPARISON",
    icon: "📊",
  },
};

export function DailyRizqCard() {
  const { card, isLoading, error, saveCard, dismissCard } = useDailyRizq();
  const [exited, setExited] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const cardOpacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.6, 1, 1, 1, 0.6]
  );

  // Swipe action overlays
  const saveOverlay = useTransform(x, [0, 60, 140], [0, 0.3, 1]);
  const dismissOverlay = useTransform(x, [-140, -60, 0], [1, 0.3, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExited(true);
      saveCard();
    } else if (info.offset.x < -100) {
      setExited(true);
      dismissCard();
    }
  };

  // During SSR or when disabled: isLoading=false, card=null — render nothing
  if (error || (!isLoading && !card)) return null;

  // Already interacted — don't show on refresh (only when card is loaded)
  if (card && (card.saved || card.dismissed || exited)) {
    if (!saveFlash) return null;
  }

  const config = card ? (TYPE_CONFIG[card.type] || TYPE_CONFIG.insight) : TYPE_CONFIG.insight;

  return (
    <div className="relative">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <span className="text-xs font-bold text-white/30 uppercase tracking-widest">
          Today&apos;s Rizq
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Skeleton */}
        {isLoading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-[28px] p-6 overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              minHeight: "220px",
            }}
          >
            {/* Badge + emoji row */}
            <div className="flex items-center justify-between mb-5">
              <div className="w-24 h-6 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
            {/* Title */}
            <div className="w-3/4 h-5 rounded-xl mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="w-1/2 h-5 rounded-xl mb-4 animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            {/* Body lines */}
            <div className="space-y-2">
              <div className="w-full h-3.5 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="w-full h-3.5 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="w-2/3 h-3.5 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* Save confirmation */}
        {saveFlash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-[28px] p-8 text-center relative overflow-hidden"
            style={{
              background: config.gradient,
              border: `1px solid ${config.color}25`,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="text-5xl mb-3"
            >
              ✅
            </motion.div>
            <p className="text-base font-semibold text-white">
              Saved to reflections
            </p>
            <p className="text-xs text-white/40 mt-1">
              Come back tomorrow for a new card
            </p>
          </motion.div>
        )}

        {/* Main card */}
        {!exited && !saveFlash && (
          <div className="relative" key="card">
            {/* Swipe action backgrounds */}
            <motion.div
              className="absolute inset-0 rounded-[28px] z-0 flex items-center justify-end pr-8"
              style={{
                opacity: saveOverlay,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(204, 255, 0, 0.08) 100%)",
                border: "1px solid rgba(204, 255, 0, 0.2)",
              }}
            >
              <div className="text-center">
                <span className="text-3xl">💾</span>
                <p className="text-xs text-[#CCFF00] font-bold mt-1">SAVE</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute inset-0 rounded-[28px] z-0 flex items-center justify-start pl-8"
              style={{
                opacity: dismissOverlay,
                background:
                  "linear-gradient(270deg, transparent 0%, rgba(255, 107, 107, 0.08) 100%)",
                border: "1px solid rgba(255, 107, 107, 0.2)",
              }}
            >
              <div className="text-center">
                <span className="text-3xl">👋</span>
                <p className="text-xs text-[#FF6B6B] font-bold mt-1">SKIP</p>
              </div>
            </motion.div>

            {/* Draggable card */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              style={{
                x,
                rotate,
                opacity: cardOpacity,
              }}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                x: card.saved ? 400 : -400,
                opacity: 0,
                rotate: card.saved ? 12 : -12,
                transition: { duration: 0.4, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              whileTap={{ scale: 0.97, cursor: "grabbing" }}
              className="relative z-10 rounded-[28px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
            >
              {/* Card background with gradient */}
              <div
                className="relative p-6"
                style={{
                  background: config.gradient,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: `${config.color}20`,
                }}
              >
                {/* Decorative glow */}
                <div
                  className="absolute -right-16 -top-16 w-48 h-48 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${config.color}15 0%, transparent 70%)`,
                  }}
                />
                <div
                  className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${config.color}08 0%, transparent 70%)`,
                  }}
                />

                {/* Top row: badge + emoji */}
                <div className="flex items-center justify-between mb-5 relative">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{
                      background: `${config.color}12`,
                      border: `1px solid ${config.color}25`,
                    }}
                  >
                    <span className="text-xs">{config.icon}</span>
                    <span
                      className="text-[10px] font-extrabold tracking-[0.15em]"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <motion.span
                    className="text-4xl"
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 12,
                      delay: 0.2,
                    }}
                  >
                    {card.emoji}
                  </motion.span>
                </div>

                {/* Title */}
                <motion.h4
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-extrabold mb-3 leading-tight relative"
                  style={{ color: config.color }}
                >
                  {card.title}
                </motion.h4>

                {/* Body */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[15px] leading-[1.7] text-white/75 relative"
                >
                  {card.body}
                </motion.p>

                {/* Divider */}
                <div
                  className="mt-6 mb-4 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${config.color}20, transparent)`,
                  }}
                />

                {/* Actions */}
                <div className="flex items-center justify-between relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setExited(true);
                      dismissCard();
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm text-white/35 hover:text-white/55 transition-colors"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <span className="text-base">👋</span>
                    <span className="font-medium">Skip</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setSaveFlash(true);
                      saveCard();
                      setTimeout(() => {
                        setSaveFlash(false);
                        setExited(true);
                      }, 1200);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
                    style={{
                      background: `${config.color}15`,
                      color: config.color,
                      border: `1px solid ${config.color}30`,
                      boxShadow: `0 0 20px ${config.color}10`,
                    }}
                  >
                    <span className="text-base">💾</span>
                    <span>Save</span>
                  </motion.button>
                </div>

                {/* Swipe hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-white/15 text-[11px] mt-4 font-medium tracking-wide"
                >
                  ← swipe to skip &nbsp;·&nbsp; swipe to save →
                </motion.p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
