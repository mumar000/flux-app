'use client';

import { useState, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useStreaks } from '@/hooks/queries/useStreaks';
import { useUpdateStreakSettings } from '@/hooks/mutations/useUpdateStreakSettings';
import type { SpendStreakResponse } from '@/types/streak';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getMilestoneBadge(count: number): string | null {
  if (count >= 60) return 'Mythic 🌙';
  if (count >= 30) return 'Legend 👑';
  if (count >= 14) return 'Unstoppable ⚡';
  if (count >= 7) return 'On fire 🔥🔥';
  if (count >= 3) return 'Warming up 🔥';
  return null;
}

// ---------------------------------------------------------------------------
// AnimatedCount
// ---------------------------------------------------------------------------

interface AnimatedCountProps {
  value: number;
  color: string;
}

function AnimatedCount({ value, color }: AnimatedCountProps) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 20, mass: 1 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return (
    <motion.span
      className="text-5xl font-extrabold leading-none"
      style={{ color: value > 0 ? color : 'rgba(255,255,255,0.25)' }}
    >
      {display}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// StreakSkeleton
// ---------------------------------------------------------------------------

function StreakSkeleton() {
  return (
    <div
      className="rounded-[24px] p-5"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header skeleton */}
      <div
        className="w-24 h-3 rounded-full mb-4 animate-pulse"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
      {/* Counter grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="h-[120px] rounded-[16px] animate-pulse"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
        <div
          className="h-[120px] rounded-[16px] animate-pulse"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
      </div>
      {/* Budget pill skeleton */}
      <div className="flex justify-center mt-4">
        <div
          className="w-36 h-8 rounded-2xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MourningBanner
// ---------------------------------------------------------------------------

interface MourningBannerProps {
  streakKey: string;
  message: string;
  onDismiss: () => void;
}

function MourningBanner({ streakKey, message, onDismiss }: MourningBannerProps) {
  return (
    <motion.div
      key={streakKey}
      initial={{ opacity: 0, y: -16, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="mb-4 rounded-[16px] p-3 overflow-hidden relative"
      style={{
        background: 'rgba(255,200,120,0.07)',
        border: '1px solid rgba(255,200,120,0.20)',
      }}
    >
      {/* Top accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[16px]"
        style={{ background: 'rgba(255,200,120,0.50)' }}
      />

      <div className="flex items-start justify-between gap-2 pt-1">
        <p
          className="text-xs font-medium leading-relaxed flex-1"
          style={{ color: 'rgba(255,255,255,0.70)' }}
        >
          {message}
        </p>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onDismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          aria-label="Dismiss streak notification"
        >
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
            ✕
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StreakCounterCard
// ---------------------------------------------------------------------------

type StreakType = 'noImpulse' | 'underBudget';

interface StreakCounterCardProps {
  type: StreakType;
  count: number;
  accentColor: string;
  icon: string;
  label: string;
}

function StreakCounterCard({ type, count, accentColor, icon, label }: StreakCounterCardProps) {
  const badge = getMilestoneBadge(count);

  const borderColor =
    count >= 7
      ? `rgba(${type === 'noImpulse' ? '204,255,0' : '78,205,196'},0.35)`
      : count > 0
      ? `rgba(${type === 'noImpulse' ? '204,255,0' : '78,205,196'},0.18)`
      : 'rgba(255,255,255,0.07)';

  const boxShadow =
    count >= 7
      ? `0 0 0 1.5px rgba(${type === 'noImpulse' ? '204,255,0' : '78,205,196'},0.35), 0 4px 20px rgba(${type === 'noImpulse' ? '204,255,0' : '78,205,196'},0.15), inset 0 1px 0 rgba(${type === 'noImpulse' ? '204,255,0' : '78,205,196'},0.08)`
      : 'none';

  return (
    <div
      className="rounded-[16px] p-4"
      style={{
        background: `rgba(${type === 'noImpulse' ? '204,255,0' : '78,205,196'},0.04)`,
        border: `1px solid ${borderColor}`,
        boxShadow,
      }}
    >
      {/* Icon + label row */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{icon}</span>
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {label}
        </span>
      </div>

      {/* Animated count */}
      <AnimatedCount value={count} color={accentColor} />

      {/* "days" suffix */}
      <p
        className="text-xs font-semibold mt-0.5"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {count === 1 ? 'day' : 'days'}
      </p>

      {/* Milestone badge */}
      <AnimatePresence>
        {badge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full mt-2"
            style={{
              background: `${accentColor}1F`,
              border: `1px solid ${accentColor}40`,
            }}
          >
            <span className="text-[10px] font-bold" style={{ color: accentColor }}>
              {badge}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpendStreakCard — main export
// ---------------------------------------------------------------------------

export function SpendStreakCard() {
  const { data, isLoading } = useStreaks();
  const updateSettings = useUpdateStreakSettings();

  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [dismissedNoImpulse, setDismissedNoImpulse] = useState(false);
  const [dismissedUnderBudget, setDismissedUnderBudget] = useState(false);

  // Restore dismissal state from localStorage on mount (once data is available)
  useEffect(() => {
    if (!data) return;
    const savedNI = localStorage.getItem('streakDismissed_noImpulse');
    const savedUB = localStorage.getItem('streakDismissed_underBudget');
    if (savedNI === data.noImpulse.lastBrokenDate) setDismissedNoImpulse(true);
    if (savedUB === data.underBudget.lastBrokenDate) setDismissedUnderBudget(true);
  }, [data]);

  if (isLoading || !data) return <StreakSkeleton />;

  const { noImpulse, underBudget, dailyBudget } = data as SpendStreakResponse;

  const showNoImpulseMourning = !dismissedNoImpulse && !!noImpulse.mourningMessage;
  const showUnderBudgetMourning = !dismissedUnderBudget && !!underBudget.mourningMessage;

  const handleDismissNoImpulse = () => {
    setDismissedNoImpulse(true);
    if (noImpulse.lastBrokenDate) {
      localStorage.setItem('streakDismissed_noImpulse', noImpulse.lastBrokenDate);
    }
  };

  const handleDismissUnderBudget = () => {
    setDismissedUnderBudget(true);
    if (underBudget.lastBrokenDate) {
      localStorage.setItem('streakDismissed_underBudget', underBudget.lastBrokenDate);
    }
  };

  const handleSaveBudget = () => {
    const parsed = parseFloat(budgetInput);
    if (budgetInput.trim() === '' || isNaN(parsed)) {
      updateSettings.mutate({ dailyBudget: null });
    } else if (parsed > 0) {
      updateSettings.mutate({ dailyBudget: parsed });
    }
    setShowBudgetEditor(false);
    setBudgetInput('');
  };

  const bothZero = noImpulse.currentCount === 0 && underBudget.currentCount === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
      className="rounded-[24px] p-5"
      style={{
        background: `linear-gradient(135deg, rgba(204,255,0,0.03) 0%, rgba(15,15,17,0) 45%, rgba(78,205,196,0.03) 100%), rgba(255,255,255,0.04)`,
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow:
          '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Spend Streaks
        </span>
        <span className="text-base">🔥</span>
      </div>

      {/* Mourning banners */}
      <AnimatePresence>
        {showNoImpulseMourning && (
          <MourningBanner
            streakKey="mourning-noimpulse"
            message={noImpulse.mourningMessage as string}
            onDismiss={handleDismissNoImpulse}
          />
        )}
        {showUnderBudgetMourning && (
          <MourningBanner
            streakKey="mourning-underbudget"
            message={underBudget.mourningMessage as string}
            onDismiss={handleDismissUnderBudget}
          />
        )}
      </AnimatePresence>

      {/* Counter grid */}
      <div className="grid grid-cols-2 gap-3">
        <StreakCounterCard
          type="noImpulse"
          count={noImpulse.currentCount}
          accentColor="#CCFF00"
          icon="🧠"
          label="No Impulse"
        />
        <StreakCounterCard
          type="underBudget"
          count={underBudget.currentCount}
          accentColor="#4ECDC4"
          icon="💸"
          label="Under Budget"
        />
      </div>

      {/* Encouragement line when both are zero */}
      <AnimatePresence>
        {bothZero && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="text-center text-[11px] font-medium mt-3"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Every streak starts with one day. You got this.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Daily budget pill */}
      <div className="flex justify-center mt-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowBudgetEditor(!showBudgetEditor)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl min-h-[44px]"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
          aria-label={`Edit daily budget. Currently PKR ${dailyBudget}`}
        >
          <span className="text-xs">⚙️</span>
          <span
            className="text-xs font-medium"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            Daily budget:
          </span>
          <span className="text-xs font-extrabold text-white">
            PKR {dailyBudget.toLocaleString()}
          </span>
        </motion.button>
      </div>

      {/* Budget editor */}
      <AnimatePresence>
        {showBudgetEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="e.g. 1500"
                className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-bold text-white outline-none"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveBudget}
                disabled={updateSettings.isPending}
                className="px-4 py-2.5 rounded-2xl text-xs font-extrabold text-black"
                style={{ background: '#CCFF00' }}
              >
                {updateSettings.isPending ? '...' : 'Save'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowBudgetEditor(false);
                  setBudgetInput('');
                }}
                className="px-3 py-2.5 rounded-2xl text-xs font-bold"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.50)',
                }}
              >
                Cancel
              </motion.button>
            </div>
            <p
              className="text-[10px] mt-2 text-center"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              Set to blank to auto-calculate from your 30-day average
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
