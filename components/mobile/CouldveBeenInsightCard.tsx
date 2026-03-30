"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ComparisonInsight } from "@/services/comparison.service";

// ---------------------------------------------------------------------------
// Accent colours per insight type
// ---------------------------------------------------------------------------
const TYPE_ACCENT: Record<string, string> = {
  goal: "#CCFF00",
  reference: "#4ECDC4",
  habit: "#A78BFA",
};

const TYPE_BG: Record<string, string> = {
  goal: "rgba(204,255,0,0.06)",
  reference: "rgba(78,205,196,0.06)",
  habit: "rgba(167,139,250,0.06)",
};

// ---------------------------------------------------------------------------
// Single insight row
// ---------------------------------------------------------------------------
interface InsightRowProps {
  insight: ComparisonInsight;
  index: number;
}

function InsightRow({ insight, index }: InsightRowProps) {
  const accent = TYPE_ACCENT[insight.type] ?? "#CCFF00";
  const bg = TYPE_BG[insight.type] ?? "rgba(204,255,0,0.06)";

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 340,
        damping: 28,
        delay: 0.1 + index * 0.08,
      }}
      className="flex items-start gap-3 rounded-2xl p-3"
      style={{ background: bg, border: `1px solid ${accent}20` }}
    >
      <span className="text-xl leading-none flex-shrink-0 mt-0.5">
        {insight.emoji}
      </span>
      <p className="text-[13px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
        {insight.message}
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Setup nudge — shown when user has no comparison items configured
// ---------------------------------------------------------------------------
function SetupNudge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl p-3 text-center"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px dashed rgba(255,255,255,0.1)",
      }}
    >
      <p className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
        Add comparison items in Settings to see what this could've bought you 💡
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading shimmer
// ---------------------------------------------------------------------------
function InsightSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-[52px] rounded-2xl animate-pulse"
          style={{ background: "rgba(255,255,255,0.05)", animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface CouldveBeenInsightCardProps {
  /** The logged expense amount in PKR */
  amount: number;
  /** Loading state while insights are being fetched */
  isLoading: boolean;
  /** Insights returned by the calculate endpoint */
  insights: ComparisonInsight[];
  /** Whether the user has any comparison items configured */
  hasComparisonItems: boolean;
  /** Called when user taps close / card auto-dismisses */
  onDismiss: () => void;
}

export function CouldveBeenInsightCard({
  amount,
  isLoading,
  insights,
  hasComparisonItems,
  onDismiss,
}: CouldveBeenInsightCardProps) {
  const formattedAmount = `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
  const hasInsights = insights.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="rounded-[24px] overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(204,255,0,0.04) 0%, rgba(15,15,17,0) 50%, rgba(78,205,196,0.04) 100%), rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            initial={{ rotate: -15, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.05 }}
            className="text-lg"
          >
            💭
          </motion.span>
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              That could've been
            </p>
            <p className="text-white font-extrabold text-[15px] leading-tight">
              {formattedAmount}
            </p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onDismiss}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.07)" }}
          aria-label="Dismiss"
        >
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.40)" }}>
            ✕
          </span>
        </motion.button>
      </div>

      {/* Divider */}
      <div className="mx-4" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

      {/* Content */}
      <div className="px-4 pb-4 pt-3 space-y-2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InsightSkeleton />
            </motion.div>
          ) : hasInsights ? (
            <motion.div key="insights" className="space-y-2">
              {insights.map((insight, i) => (
                <InsightRow key={`${insight.type}-${i}`} insight={insight} index={i} />
              ))}
            </motion.div>
          ) : !hasComparisonItems ? (
            <motion.div key="setup">
              <SetupNudge />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-2 text-center"
            >
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Nothing to compare yet — keep logging!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
