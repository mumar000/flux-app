"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { formatPKR } from "@/utils/expenseParser";

interface QuickExpenseInputProps {
  onExpenseAdded: (expense: {
    amount: number;
    description: string;
    bankAccount: string;
    category: string;
    rawInput: string;
  }) => void;
}

// We will load these from the API instead of hardcoding
const FALLBACK_BANKS = [
  { id: "meezan", name: "Meezan Bank", emoji: "🏦", color: "#00A651" },
  { id: "hbl", name: "HBL", emoji: "💚", color: "#006341" },
  { id: "cash", name: "Cash", emoji: "💵", color: "#22C55E" },
];

const FALLBACK_CATEGORIES = [
  { id: "Food", emoji: "🍔", color: "#FF6B6B" },
  { id: "Transport", emoji: "🚕", color: "#4ECDC4" },
  { id: "Other", emoji: "📦", color: "#BDC3C7" },
];

export function QuickExpenseInput({ onExpenseAdded }: QuickExpenseInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [banks, setBanks] = useState(FALLBACK_BANKS);
  
  const [category, setCategory] = useState(FALLBACK_CATEGORIES[0]);
  const [bank, setBank] = useState(FALLBACK_BANKS[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);

  // Swipe tracking
  const swipeY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic categories and banks on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.name,
            name: d.name,
            emoji: d.emoji || "📦",
            color: d.color || "#BDC3C7",
          }));
          setCategories(mapped);
          setCategory(mapped[0]);
        }
      })
      .catch((err) => console.error(err));

    fetch("/api/banks")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.name.toLowerCase().replace(/\s+/g, ""),
            name: d.name,
            emoji: d.icon_url || "🏦",
            color: d.color || "#22C55E",
          }));
          setBanks(mapped);
          setBank(mapped[0]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Reset
  const resetFields = () => {
    setAmount("");
    setSwipeProgress(0);
  };

  // Open modal
  const handleOpen = () => {
    resetFields();
    setIsOpen(true);
  };

  // Close modal
  const handleClose = () => {
    setIsOpen(false);
    resetFields();
  };

  // Numpad press with haptic feedback simulation
  const handleNumPress = (num: string) => {
    if (amount.includes(".") && num === ".") return;
    if (amount.length > 8) return;
    if (amount === "0" && num !== ".") {
      setAmount(num);
      return;
    }
    setAmount((prev) => prev + num);
  };

  // Backspace
  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  // Handle swipe
  const handleDrag = (event: any, info: PanInfo) => {
    const progress = Math.min(Math.abs(info.offset.y) / 150, 1);
    setSwipeProgress(info.offset.y < 0 ? progress : 0);
  };

  // Handle swipe end
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y < -120 && parseFloat(amount) > 0) {
      handleSubmit();
    }
    setSwipeProgress(0);
  };

  // Submit
  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const rawInput = `${amount}rs ${category.id} from ${bank.name}`;

    onExpenseAdded({
      amount: parseFloat(amount),
      description: category.id,
      bankAccount: bank.name,
      category: category.id,
      rawInput,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      resetFields();
      handleClose();
    }, 1000);
  };

  const canSubmit = parseFloat(amount) > 0;

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center text-black text-3xl font-light z-40"
        style={{
          background: "linear-gradient(135deg, #CCFF00 0%, #99CC00 100%)",
          boxShadow: "0 10px 40px rgba(204, 255, 0, 0.4)",
        }}
      >
        +
      </motion.button>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Bottom Sheet */}
            <motion.div
              ref={containerRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: -150, bottom: 0 }}
              dragElastic={{ top: 0.1, bottom: 0.5 }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              className="absolute bottom-0 left-0 right-0 rounded-t-[32px] overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #1a1a1f 0%, #0f0f12 100%)",
                boxShadow: "0 -10px 50px rgba(0,0,0,0.5)",
              }}
            >
              {/* Swipe Indicator */}
              <div className="flex justify-center pt-3 pb-1">
                <motion.div
                  className="w-12 h-1.5 rounded-full"
                  animate={{
                    background:
                      swipeProgress > 0.5 ? "#CCFF00" : "rgba(255,255,255,0.2)",
                    width: swipeProgress > 0 ? 48 + swipeProgress * 20 : 48,
                  }}
                />
              </div>

              {/* Swipe Progress Indicator */}
              <AnimatePresence>
                {swipeProgress > 0.3 && canSubmit && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-10"
                  >
                    <motion.div
                      animate={{
                        y: [0, -5, 0],
                        scale: swipeProgress > 0.8 ? 1.2 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <div className="text-4xl mb-1">🚀</div>
                      <div
                        className="text-sm font-bold"
                        style={{
                          color:
                            swipeProgress > 0.8
                              ? "#CCFF00"
                              : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {swipeProgress > 0.8
                          ? "Release to add!"
                          : "Keep swiping..."}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content */}
              <div className="px-4 pb-6">
                {/* Amount Display */}
                <motion.div
                  className="text-center py-4"
                  animate={{
                    scale: swipeProgress > 0.5 ? 0.95 : 1,
                    opacity: swipeProgress > 0.5 ? 0.7 : 1,
                  }}
                >
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                    Amount
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
                </motion.div>

                {/* Category Selector - Horizontal Scroll */}
                <div className="mb-3">
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-2 px-1">
                    Category
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map((cat) => {
                      const isSelected = category.id === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCategory(cat)}
                          className="flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl shrink-0"
                          style={{
                            background: isSelected
                              ? `linear-gradient(135deg, ${cat.color}40 0%, ${cat.color}20 100%)`
                              : "rgba(255,255,255,0.05)",
                            border: `2px solid ${isSelected ? cat.color : "transparent"}`,
                            boxShadow: isSelected
                              ? `0 0 15px ${cat.color}30`
                              : "none",
                          }}
                        >
                          <span className="text-2xl">{cat.emoji}</span>
                          <span
                            className={`text-[10px] mt-1 ${isSelected ? "text-white" : "text-white/40"}`}
                          >
                            {cat.id}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Bank Selector - Horizontal Scroll */}
                <div className="mb-4">
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-2 px-1">
                    Account
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {banks.map((b) => {
                      const isSelected = bank.id === b.id;
                      return (
                        <motion.button
                          key={b.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setBank(b)}
                          className="flex items-center gap-2 py-2 px-3 rounded-xl shrink-0"
                          style={{
                            background: isSelected
                              ? `linear-gradient(135deg, ${b.color}30 0%, ${b.color}10 100%)`
                              : "rgba(255,255,255,0.05)",
                            border: `2px solid ${isSelected ? b.color : "transparent"}`,
                          }}
                        >
                          <span className="text-xl">{b.emoji}</span>
                          <span
                            className={`text-xs whitespace-nowrap ${isSelected ? "text-white" : "text-white/40"}`}
                          >
                            {b.name}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <motion.button
                      key={num}
                      whileHover={{ background: "rgba(204, 255, 0, 0.1)" }}
                      whileTap={{
                        scale: 0.9,
                        background: "rgba(204, 255, 0, 0.2)",
                      }}
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

                  {/* Decimal */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleNumPress(".")}
                    className="h-14 rounded-2xl flex items-center justify-center text-xl text-white/40"
                  >
                    .
                  </motion.button>

                  {/* Zero */}
                  <motion.button
                    whileHover={{ background: "rgba(204, 255, 0, 0.1)" }}
                    whileTap={{
                      scale: 0.9,
                      background: "rgba(204, 255, 0, 0.2)",
                    }}
                    onClick={() => handleNumPress("0")}
                    className="h-14 rounded-2xl flex items-center justify-center text-xl font-medium text-white"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    0
                  </motion.button>

                  {/* Backspace */}
                  <motion.button
                    whileTap={{ scale: 0.9, x: -3 }}
                    onClick={handleBackspace}
                    className="h-14 rounded-2xl flex items-center justify-center text-white/40 hover:text-[#FF6B6B]"
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

                {/* Swipe to Submit Hint */}
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                    opacity: canSubmit ? 1 : 0.3,
                  }}
                  transition={{
                    y: { duration: 1.5, repeat: Infinity },
                    opacity: { duration: 0.2 },
                  }}
                  className="mt-4 text-center"
                >
                  <div className="text-2xl mb-1">👆</div>
                  <div className="text-white/40 text-xs uppercase tracking-wider">
                    {canSubmit ? "Swipe up to add" : "Enter amount"}
                  </div>
                </motion.div>

                {/* Quick Submit Button (alternative to swipe) */}
                <motion.button
                  whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                  whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full mt-3 py-4 rounded-2xl font-bold text-lg"
                  style={{
                    background: canSubmit
                      ? "linear-gradient(135deg, #CCFF00 0%, #99CC00 100%)"
                      : "rgba(255,255,255,0.1)",
                    color: canSubmit ? "#000" : "rgba(255,255,255,0.3)",
                    boxShadow: canSubmit
                      ? "0 10px 30px rgba(204, 255, 0, 0.3)"
                      : "none",
                  }}
                >
                  {canSubmit
                    ? `Add ${formatPKR(parseFloat(amount))}`
                    : "Enter Amount"}
                </motion.button>
              </div>
            </motion.div>

            {/* Success Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/90 z-60"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.4 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="text-7xl mb-3"
                    >
                      ✨
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-white font-bold text-xl"
                    >
                      {formatPKR(parseFloat(amount))} added!
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
