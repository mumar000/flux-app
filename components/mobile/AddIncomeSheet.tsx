"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBanks } from "@/hooks/queries/useBanks";

interface AddIncomeSheetProps {
  open: boolean;
  onClose: () => void;
  onIncomeAdded: (income: {
    amount: number;
    description: string;
    bankAccount: string;
    category: string;
    rawInput: string;
  }) => void;
}

interface SelectOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const FALLBACK_BANKS: SelectOption[] = [
  { id: "meezan-bank", label: "Meezan Bank", emoji: "🏦", color: "#00A651" },
  { id: "hbl", label: "HBL", emoji: "💚", color: "#006341" },
  { id: "ubl", label: "UBL", emoji: "🏛️", color: "#1E90FF" },
];

const INCOME_CATEGORIES: SelectOption[] = [
  { id: "Salary", label: "Salary", emoji: "💼", color: "#22C55E" },
  { id: "Freelance / Gig", label: "Freelance", emoji: "🧠", color: "#06B6D4" },
  { id: "Transfer", label: "Transfer", emoji: "🔄", color: "#38BDF8" },
  { id: "Cash Deposit", label: "Deposit", emoji: "🏦", color: "#84CC16" },
  { id: "Refund", label: "Refund", emoji: "↩️", color: "#F59E0B" },
  { id: "Gift", label: "Gift", emoji: "🎁", color: "#EC4899" },
  { id: "Paid Back", label: "Paid Back", emoji: "🤝", color: "#A78BFA" },
  { id: "Other", label: "Other", emoji: "✨", color: "#94A3B8" },
];

function mapBankOption(bank: { name?: string; icon_url?: string; color?: string }) {
  const name = bank.name?.trim() || "Account";
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    label: name,
    emoji: bank.icon_url || "🏦",
    color: bank.color || "#22C55E",
  };
}

export function AddIncomeSheet({
  open,
  onClose,
  onIncomeAdded,
}: AddIncomeSheetProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [banks, setBanks] = useState<SelectOption[]>(FALLBACK_BANKS);
  const [selectedBank, setSelectedBank] = useState<SelectOption | null>(
    FALLBACK_BANKS[0]
  );
  const [selectedCategory, setSelectedCategory] = useState<SelectOption>(
    INCOME_CATEGORIES[0]
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: bankData } = useBanks();

  useEffect(() => {
    if (!open) return;
    if (!bankData || bankData.length === 0) return;
    const mapped = bankData.map((bank: any) =>
      mapBankOption(bank)
    );
    setBanks(mapped);
    setSelectedBank((current) => current ?? mapped[0] ?? null);
  }, [open, bankData]);

  const resetState = () => {
    setAmount("");
    setDescription("");
    setSelectedCategory(INCOME_CATEGORIES[0]);
    setSelectedBank((current) => current ?? FALLBACK_BANKS[0]);
    setShowSuccess(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNumPress = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount.length >= 8) return;
    if (amount === "0" && num !== ".") {
      setAmount(num);
      return;
    }
    setAmount((prev) => prev + num);
  };

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const canSubmit = Boolean(selectedBank) && parseFloat(amount) > 0;

  const handleSubmit = () => {
    if (!selectedBank || !canSubmit) return;

    const amountValue = parseFloat(amount);
    const finalDescription = description.trim() || selectedCategory.label;

    onIncomeAdded({
      amount: amountValue,
      description: finalDescription,
      bankAccount: selectedBank.label,
      category: selectedCategory.id,
      rawInput: `${amountValue} ${selectedCategory.id} ${selectedBank.label}`,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      handleClose();
    }, 900);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70]"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) handleClose();
            }}
            className="absolute bottom-0 left-0 right-0 rounded-t-[32px] overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(12,30,18,1) 0%, rgba(12,16,18,1) 100%)",
              boxShadow: "0 -10px 50px rgba(0,0,0,0.55)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 relative">
              <div className="w-12 h-1.5 rounded-full bg-white/15" />
              {/* Close Button */}
              <button 
                onClick={handleClose}
                className="absolute right-4 top-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="px-4 pb-6">
              <div className="text-center py-4">
                <div className="text-[#86EFAC] text-xs uppercase tracking-[0.28em] mb-1">
                  Add Money
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-2xl text-white/30 mr-1">Rs</span>
                  <motion.span
                    key={amount}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className={`text-5xl font-bold ${amount ? "text-white" : "text-white/20"}`}
                  >
                    {amount || "0"}
                  </motion.span>
                </div>
              </div>

              <div className="mb-4 px-1">
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(134,239,172,0.18)",
                  }}
                >
                  <span className="text-lg flex-shrink-0">
                    {description ? "💬" : "✨"}
                  </span>
                  <input
                    value={description}
                    onChange={(e) => {
                      if (e.target.value.length <= 48) setDescription(e.target.value);
                    }}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
                    placeholder="What came in? (optional)"
                    maxLength={48}
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="text-white/40 text-xs uppercase tracking-wider mb-2 px-1">
                  Source
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {INCOME_CATEGORIES.map((category) => {
                    const isSelected = selectedCategory.id === category.id;
                    return (
                      <motion.button
                        key={category.id}
                        whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(category)}
                        className="flex flex-col items-center justify-center min-w-[72px] py-2 px-3 rounded-xl shrink-0"
                        style={{
                          background: isSelected
                            ? `linear-gradient(135deg, ${category.color}40 0%, ${category.color}18 100%)`
                            : "rgba(255,255,255,0.05)",
                          border: `2px solid ${isSelected ? category.color : "transparent"}`,
                          boxShadow: isSelected ? `0 0 15px ${category.color}26` : "none",
                        }}
                      >
                        <span className="text-2xl">{category.emoji}</span>
                        <span className={`text-[10px] mt-1 ${isSelected ? "text-white" : "text-white/40"}`}>
                          {category.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-white/40 text-xs uppercase tracking-wider mb-2 px-1">
                  Deposit To
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {banks.map((bank) => {
                    const isSelected = selectedBank?.id === bank.id;
                    return (
                      <motion.button
                        key={bank.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedBank(bank)}
                        className="flex items-center gap-2 py-2 px-3 rounded-xl shrink-0"
                        style={{
                          background: isSelected
                            ? `linear-gradient(135deg, ${bank.color}30 0%, ${bank.color}10 100%)`
                            : "rgba(255,255,255,0.05)",
                          border: `2px solid ${isSelected ? bank.color : "transparent"}`,
                        }}
                      >
                        <span className="text-xl">{bank.emoji}</span>
                        <span className={`text-xs whitespace-nowrap ${isSelected ? "text-white" : "text-white/40"}`}>
                          {bank.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <motion.button
                    key={num}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleNumPress(num.toString())}
                    className="h-14 rounded-2xl flex items-center justify-center text-xl font-medium text-white"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {num}
                  </motion.button>
                ))}

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleNumPress(".")}
                  className="h-14 rounded-2xl flex items-center justify-center text-xl text-white/40"
                >
                  .
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleNumPress("0")}
                  className="h-14 rounded-2xl flex items-center justify-center text-xl font-medium text-white"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  0
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9, x: -3 }}
                  onClick={handleBackspace}
                  className="h-14 rounded-2xl flex items-center justify-center text-white/40 hover:text-[#86EFAC]"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full mt-4 py-4 rounded-2xl font-bold text-lg"
                style={{
                  background: canSubmit
                    ? "linear-gradient(135deg, #86EFAC 0%, #22C55E 100%)"
                    : "rgba(255,255,255,0.1)",
                  color: canSubmit ? "#052E16" : "rgba(255,255,255,0.3)",
                  boxShadow: canSubmit ? "0 10px 30px rgba(34,197,94,0.25)" : "none",
                }}
              >
                Add Money
              </motion.button>
            </div>
          </motion.div>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full flex items-center gap-2 z-[80]"
                style={{
                  background:
                    "linear-gradient(135deg, #86EFAC 0%, #22C55E 100%)",
                  boxShadow: "0 10px 40px rgba(34,197,94,0.35)",
                }}
              >
                <span className="text-xl">💸</span>
                <span className="text-[#052E16] font-bold">Money Added!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
