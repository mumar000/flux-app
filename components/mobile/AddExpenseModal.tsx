"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { useQueryClient } from "@tanstack/react-query";
import { useAddExpense } from "@/hooks/mutations/useAddExpense";
import { queryKeys } from "@/lib/queryKeys";
import { comparisonService, type ComparisonInsight } from "@/services/comparison.service";
import { CouldveBeenInsightCard } from "@/components/mobile/CouldveBeenInsightCard";
import type { Expense } from "@/services/expense.service";
import { useCategories } from "@/hooks/queries/useCategories";
import { useBanks } from "@/hooks/queries/useBanks";
import { formatPKR } from "@/utils/expenseParser";
import type { Bank } from "@/services/bank.service";
import type { Category as StoredCategory } from "@/services/category.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Food", emoji: "🍔", color: "#FF6B6B" },
  { id: "2", name: "Transport", emoji: "🚕", color: "#4ECDC4" },
  { id: "3", name: "Shopping", emoji: "🛍️", color: "#FFE66D" },
  { id: "4", name: "Bills", emoji: "📄", color: "#95A5A6" },
  { id: "5", name: "Entertainment", emoji: "🎬", color: "#9B59B6" },
  { id: "6", name: "Health", emoji: "💊", color: "#2ECC71" },
  { id: "7", name: "Education", emoji: "📚", color: "#3498DB" },
  { id: "8", name: "Other", emoji: "📦", color: "#BDC3C7" },
];

type ModalStep = "input" | "insights";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function currentMonthPrefix(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// AddExpenseModal
// ---------------------------------------------------------------------------
export function AddExpenseModal({ open, onClose }: AddExpenseModalProps) {
  const queryClient = useQueryClient();
  const addExpense = useAddExpense();

  const [step, setStep] = useState<ModalStep>("input");
  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [description, setDescription] = useState("");
  const [shake, setShake] = useState(false);

  // Insight state
  const [loggedAmount, setLoggedAmount] = useState(0);
  const [loggedBankName, setLoggedBankName] = useState("");
  const [loggedBalanceBefore, setLoggedBalanceBefore] = useState(0);
  const [loggedBalanceAfter, setLoggedBalanceAfter] = useState(0);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<ComparisonInsight[]>([]);
  const [hasComparisonItems, setHasComparisonItems] = useState(true);

  // Auto-close timer ref
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch categories dynamically when modal opens
  const { data: categoryData } = useCategories();
  const { data: bankData = [] } = useBanks();

  useEffect(() => {
    if (!open) return;
    if (categoryData && categoryData.length > 0) {
      setCategories(
        categoryData.map((d: StoredCategory) => ({
          id: d.id ?? d.name,
          name: d.name,
          emoji: d.emoji ?? "📦",
          color: d.color ?? "#BDC3C7",
        }))
      );
    }
  }, [open, categoryData]);

  useEffect(() => {
    if (!open) return;
    if (bankData.length === 0) {
      setSelectedBank(null);
      return;
    }
    setSelectedBank((current) =>
      current && bankData.some((bank) => bank.id === current.id)
        ? current
        : bankData[0]
    );
  }, [open, bankData]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("input");
      setAmount("");
      setSelectedCategory(null);
      setSelectedBank(null);
      setDescription("");
      setLoggedBankName("");
      setLoggedBalanceBefore(0);
      setLoggedBalanceAfter(0);
      setInsights([]);
      setInsightsLoading(false);
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
  }, []);

  // ---------------------------------------------------------------------------
  // Numpad handlers
  // ---------------------------------------------------------------------------
  const handleNumPress = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount.length >= 8) return;
    if (amount === "0" && num !== ".") { setAmount(num); return; }
    setAmount((prev) => prev + num);
  };

  const handleBackspace = () => setAmount((prev) => prev.slice(0, -1));
  const numericAmount = parseFloat(amount) || 0;
  const balanceBefore = Number(selectedBank?.balance ?? 0);
  const balanceAfter = balanceBefore - numericAmount;
  const balanceWillGoNegative = Boolean(selectedBank && numericAmount > 0 && balanceAfter < 0);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    if (!numericAmount || !selectedCategory || !selectedBank) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Compute monthly category total from cache (avoids extra server round-trip)
    const cached = queryClient.getQueryData<Expense[]>(queryKeys.expenses.list()) ?? [];
    const monthPrefix = currentMonthPrefix();
    const monthlyTotal = cached
      .filter(
        (e) =>
          e.category === selectedCategory.name &&
          (e.date ?? e.created_at ?? "").startsWith(monthPrefix)
      )
      .reduce((sum, e) => sum + Number(e.amount), 0) + numericAmount;

    // Fire expense creation
    addExpense.mutate(
      {
        amount: numericAmount,
        description: description.trim() || selectedCategory.name,
        bankAccount: selectedBank.name,
        category: selectedCategory.name,
        rawInput: description.trim() || `${numericAmount} ${selectedCategory.name}`,
      },
      {
        onSuccess: async () => {
          setLoggedAmount(numericAmount);
          setLoggedBankName(selectedBank.name);
          setLoggedBalanceBefore(balanceBefore);
          setLoggedBalanceAfter(balanceAfter);
          setStep("insights");
          setInsightsLoading(true);

          try {
            const result = await comparisonService.calculate({
              amount: numericAmount,
              category: selectedCategory!.name,
              monthlyTotalForCategory: monthlyTotal,
            });
            setInsights(result.insights);
            setHasComparisonItems(result.hasComparisonItems);
          } catch {
            setInsights([]);
          } finally {
            setInsightsLoading(false);
          }

          // Auto-close after 5 s if user doesn't interact
          autoCloseTimer.current = setTimeout(onClose, 5000);
        },
        onError: () => {
          // Stay on input step so user can retry
        },
      }
    );
  };

  const handleInsightsDismiss = () => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050507]/80 backdrop-blur-md z-50"
          />
        </Dialog.Overlay>

        <Dialog.Content asChild>
          <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-[#121216] border-t border-white/10 rounded-t-[40px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
            style={{ maxHeight: "92vh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-4 pb-2 flex-shrink-0" onClick={onClose}>
              <div className="w-16 h-1.5 bg-white/10 rounded-full" />
            </div>

            <AnimatePresence mode="wait">
              {/* ── STEP 1: Expense input ────────────────────────── */}
              {step === "input" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 flex flex-col px-6 pb-8 overflow-y-auto"
                >
                  {/* Amount display */}
                  <motion.div
                    className="flex flex-col items-center justify-center py-6"
                    animate={shake ? { x: [-6, 6, -6, 6, 0] } : {}}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="text-white/40 text-[11px] font-bold tracking-widest uppercase mb-2">
                      Amount (PKR)
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-white/30 text-3xl font-light">₨</span>
                      <span
                        className={clsx(
                          "text-6xl font-extrabold tracking-tighter transition-colors duration-200",
                          amount ? "text-white" : "text-white/10"
                        )}
                      >
                        {amount || "0"}
                      </span>
                    </div>
                  </motion.div>

                  {/* Category picker */}
                  <div className="mb-5">
                    <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
                      {categories.map((cat) => {
                        const isSelected = selectedCategory?.id === cat.id;
                        return (
                          <motion.button
                            key={cat.id}
                            whileTap={{ scale: 0.88 }}
                            onClick={() => setSelectedCategory(cat)}
                            className="flex flex-col items-center justify-center min-w-[68px] h-[68px] rounded-2xl border transition-all duration-200 flex-shrink-0"
                            style={{
                              background: isSelected ? `${cat.color}15` : "rgba(255,255,255,0.04)",
                              borderColor: isSelected ? `${cat.color}60` : "rgba(255,255,255,0.07)",
                              boxShadow: isSelected ? `0 0 16px ${cat.color}30` : "none",
                            }}
                          >
                            <span className="text-2xl mb-0.5">{cat.emoji}</span>
                            <span
                              className="text-[9px] font-bold uppercase tracking-wide"
                              style={{ color: isSelected ? cat.color : "rgba(255,255,255,0.30)" }}
                            >
                              {cat.name}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-2.5 mb-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <motion.button
                        key={num}
                        onClick={() => handleNumPress(num.toString())}
                        whileTap={{ scale: 0.88, backgroundColor: "rgba(204,255,0,0.1)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="h-[72px] rounded-[22px] bg-white/[0.05] border border-white/[0.08] flex items-center justify-center"
                      >
                        <span className="text-2xl font-bold text-white">{num}</span>
                      </motion.button>
                    ))}

                    {/* . */}
                    <motion.button
                      onClick={() => handleNumPress(".")}
                      whileTap={{ scale: 0.88 }}
                      className="h-[72px] rounded-[22px] flex items-center justify-center"
                    >
                      <span className="text-3xl font-black text-white/40 leading-none pb-2">.</span>
                    </motion.button>

                    {/* 0 */}
                    <motion.button
                      onClick={() => handleNumPress("0")}
                      whileTap={{ scale: 0.88, backgroundColor: "rgba(204,255,0,0.1)" }}
                      className="h-[72px] rounded-[22px] bg-white/[0.05] border border-white/[0.08] flex items-center justify-center"
                    >
                      <span className="text-2xl font-bold text-white">0</span>
                    </motion.button>

                    {/* ⌫ */}
                    <motion.button
                      onClick={handleBackspace}
                      whileTap={{ scale: 0.88, x: -2 }}
                      className="h-[72px] rounded-[22px] flex items-center justify-center group"
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="text-white/30 group-active:text-[#FF6B6B] transition-colors">
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                        <line x1="18" y1="9" x2="12" y2="15" />
                        <line x1="12" y1="9" x2="18" y2="15" />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Bank picker */}
                  <div className="mb-5">
                    <div className="mb-2 text-white/40 text-[11px] font-bold uppercase tracking-widest">
                      Pay From
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                      {bankData.map((bank) => {
                        const isSelected = selectedBank?.id === bank.id;
                        return (
                          <motion.button
                            key={bank.id}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setSelectedBank(bank)}
                            className="flex-shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold"
                            style={{
                              color: isSelected ? "#CCFF00" : "rgba(255,255,255,0.45)",
                              background: isSelected ? "rgba(204,255,0,0.10)" : "rgba(255,255,255,0.05)",
                              borderColor: isSelected ? "rgba(204,255,0,0.40)" : "rgba(255,255,255,0.08)",
                              boxShadow: isSelected ? "0 0 12px rgba(204,255,0,0.15)" : "none",
                            }}
                          >
                            {bank.name}
                          </motion.button>
                        );
                      })}
                    </div>

                    {bankData.length === 0 && (
                      <p className="text-xs font-semibold text-[#FF8B8B]">
                        Add a bank account in Settings before logging an expense.
                      </p>
                    )}

                    <AnimatePresence>
                      {numericAmount > 0 && selectedBank && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="text-xs font-semibold"
                          style={{ color: balanceWillGoNegative ? "#FF8B8B" : "rgba(255,255,255,0.40)" }}
                        >
                          <span className="text-white/50">{selectedBank.name}</span>{" "}
                          <span className="text-white/60">{formatPKR(balanceBefore)}</span>{" "}
                          <span className="text-white/20">→</span>{" "}
                          <span style={{ color: balanceWillGoNegative ? "#FF8B8B" : "rgba(255,255,255,0.80)" }}>
                            {formatPKR(balanceAfter)}
                          </span>{" "}
                          <span>after this expense</span>
                          {balanceWillGoNegative && (
                            <span className="ml-2 font-extrabold">⚠ Balance will go negative</span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Note field */}
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    placeholder="Add a note... (optional)"
                    className="w-full bg-transparent text-center text-white/60 placeholder:text-white/20 border-b border-white/10 pb-2 mb-5 outline-none focus:border-[#CCFF00] transition-colors text-sm"
                  />

                  {/* Submit */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!amount || !selectedCategory || !selectedBank || addExpense.isPending}
                    whileTap={{ scale: 0.97 }}
                    className={clsx(
                      "w-full py-5 rounded-2xl font-extrabold text-base uppercase tracking-wider transition-all",
                      !amount || !selectedCategory || !selectedBank
                        ? "bg-white/8 text-white/20 cursor-not-allowed"
                        : "bg-[#CCFF00] text-black shadow-[0_0_28px_rgba(204,255,0,0.25)]"
                    )}
                  >
                    {addExpense.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        >
                          ⏳
                        </motion.span>
                        Logging...
                      </span>
                    ) : (
                      "Log Expense"
                    )}
                  </motion.button>

                  {addExpense.isError && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-xs font-semibold mt-3"
                      style={{ color: "#FF6B6B" }}
                    >
                      Could not save. Please try again.
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* ── STEP 2: Success + insights ───────────────────── */}
              {step === "insights" && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 340, damping: 28 }}
                  className="flex-1 flex flex-col px-5 pb-10 pt-2 overflow-y-auto"
                >
                  {/* Success banner */}
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.05 }}
                    className="flex flex-col items-center py-6"
                  >
                    <motion.span
                      animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                      transition={{ duration: 0.55, delay: 0.1 }}
                      className="text-5xl mb-3"
                    >
                      ✅
                    </motion.span>
                    <p className="text-white font-extrabold text-xl">Logged!</p>
                    <p className="text-white/40 text-sm font-medium mt-1">
                      PKR {Math.round(loggedAmount).toLocaleString("en-PK")} added
                    </p>
                    {loggedBankName && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/45"
                      >
                        <span className="text-white/70">{loggedBankName}</span>{" "}
                        <span>{formatPKR(loggedBalanceBefore)}</span>{" "}
                        <span className="text-white/20">→</span>{" "}
                        <span className={loggedBalanceAfter < 0 ? "text-[#FF8B8B]" : "text-white/80"}>
                          {formatPKR(loggedBalanceAfter)}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Insight card */}
                  <CouldveBeenInsightCard
                    amount={loggedAmount}
                    isLoading={insightsLoading}
                    insights={insights}
                    hasComparisonItems={hasComparisonItems}
                    onDismiss={handleInsightsDismiss}
                  />

                  {/* Auto-close hint */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center text-[11px] font-medium mt-4"
                    style={{ color: "rgba(255,255,255,0.20)" }}
                  >
                    Closes automatically in 5s
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
