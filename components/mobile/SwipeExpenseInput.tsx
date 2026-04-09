"use client";

import { useState, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  parseExpense,
  CATEGORY_EMOJIS,
  CATEGORY_COLORS,
  formatPKR,
} from "@/utils/expenseParser";

interface SwipeExpenseInputProps {
  onExpenseAdded: (expense: {
    amount: number;
    description: string;
    bankAccount: string;
    category: string;
    rawInput: string;
  }) => void;
}

// Bank options with emojis
const BANKS = [
  { id: "meezan", name: "Meezan Bank", emoji: "🏦", color: "#00A651" },
  { id: "hbl", name: "HBL", emoji: "💚", color: "#006341" },
  { id: "jazzcash", name: "JazzCash", emoji: "📱", color: "#ED1C24" },
  { id: "easypaisa", name: "Easypaisa", emoji: "💛", color: "#00A54F" },
  { id: "sadapay", name: "SadaPay", emoji: "💜", color: "#6B21A8" },
  { id: "nayapay", name: "NayaPay", emoji: "🔵", color: "#3B82F6" },
  { id: "cash", name: "Cash", emoji: "💵", color: "#22C55E" },
];

// Category options
const CATEGORIES = [
  { id: "Food", emoji: "🍔", color: "#FF6B6B" },
  { id: "Transport", emoji: "🚕", color: "#4ECDC4" },
  { id: "Shopping", emoji: "🛍️", color: "#FFE66D" },
  { id: "Bills", emoji: "📄", color: "#95A5A6" },
  { id: "Entertainment", emoji: "🎬", color: "#9B59B6" },
  { id: "Health", emoji: "💊", color: "#2ECC71" },
  { id: "Education", emoji: "📚", color: "#3498DB" },
  { id: "Groceries", emoji: "🛒", color: "#E67E22" },
  { id: "Other", emoji: "📦", color: "#BDC3C7" },
];

type Step = "amount" | "category" | "bank" | "description" | "confirm";

export function SwipeExpenseInput({ onExpenseAdded }: SwipeExpenseInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[0] | null>(null);
  const [bank, setBank] = useState<(typeof BANKS)[0] | null>(null);
  const [description, setDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Swipe tracking
  const swipeY = useMotionValue(0);
  const swipeOpacity = useTransform(swipeY, [-100, 0], [1, 0.3]);
  const swipeScale = useTransform(swipeY, [-100, 0], [1, 0.95]);

  // Reset all fields
  const resetFields = () => {
    setAmount("");
    setCategory(null);
    setBank(null);
    setDescription("");
    setStep("amount");
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

  // Numpad press
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

  // Clear amount
  const handleClear = () => {
    setAmount("");
  };

  // Navigate steps
  const goToStep = (newStep: Step) => {
    setStep(newStep);
  };

  // Handle swipe to confirm
  const handleSwipeEnd = (event: any, info: PanInfo) => {
    if (info.offset.y < -100 && step === "confirm") {
      handleSubmit();
    }
  };

  // Submit expense
  const handleSubmit = () => {
    if (!amount || !category || !bank) return;

    const rawInput = `${amount}rs ${description || category.id} from ${bank.name}`;

    onExpenseAdded({
      amount: parseFloat(amount),
      description: description || category.id,
      bankAccount: bank.name,
      category: category.id,
      rawInput,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      handleClose();
    }, 1500);
  };

  // Step progress
  const stepOrder: Step[] = [
    "amount",
    "category",
    "bank",
    "description",
    "confirm",
  ];
  const currentStepIndex = stepOrder.indexOf(step);
  const progress = ((currentStepIndex + 1) / stepOrder.length) * 100;

  // Can proceed to next step
  const canProceed = () => {
    switch (step) {
      case "amount":
        return parseFloat(amount) > 0;
      case "category":
        return category !== null;
      case "bank":
        return bank !== null;
      case "description":
        return true;
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  // Next step
  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      setStep(stepOrder[nextIndex]);
    }
  };

  // Previous step
  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(stepOrder[prevIndex]);
    }
  };

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
            className="fixed inset-0 z-50 bg-[#0A0A0C]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={step === "amount" ? handleClose : prevStep}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                {step === "amount" ? "✕" : "←"}
              </motion.button>

              {/* Progress Bar */}
              <div className="flex-1 mx-4 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #CCFF00, #99CC00)",
                  }}
                />
              </div>

              <div className="text-white/40 text-sm">
                {currentStepIndex + 1}/{stepOrder.length}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6">
              <AnimatePresence mode="wait">
                {/* STEP 1: Amount with Numpad */}
                {step === "amount" && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="h-full flex flex-col"
                  >
                    <h2 className="text-white/40 text-sm uppercase tracking-wider mb-2 text-center">
                      How much did you spend?
                    </h2>

                    {/* Amount Display */}
                    <div className="flex items-center justify-center py-8">
                      <span className="text-3xl text-white/30 mr-2">Rs</span>
                      <motion.span
                        key={amount}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={`text-6xl font-bold ${amount ? "text-white" : "text-white/20"}`}
                      >
                        {amount || "0"}
                      </motion.span>
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-6xl text-[#CCFF00] ml-1"
                      >
                        |
                      </motion.span>
                    </div>

                    {/* Numpad - Glass Morphism Style */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <motion.button
                          key={num}
                          whileHover={{
                            scale: 1.05,
                            background: "rgba(204, 255, 0, 0.1)",
                          }}
                          whileTap={{
                            scale: 0.95,
                            background: "rgba(204, 255, 0, 0.2)",
                          }}
                          onClick={() => handleNumPress(num.toString())}
                          className="h-16 rounded-2xl flex items-center justify-center text-2xl font-medium text-white relative overflow-hidden"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1)",
                          }}
                        >
                          {num}
                        </motion.button>
                      ))}

                      {/* Clear */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClear}
                        className="h-16 rounded-2xl flex items-center justify-center text-lg font-medium text-white/40 hover:text-white/60"
                      >
                        C
                      </motion.button>

                      {/* Zero */}
                      <motion.button
                        whileHover={{
                          scale: 1.05,
                          background: "rgba(204, 255, 0, 0.1)",
                        }}
                        whileTap={{
                          scale: 0.95,
                          background: "rgba(204, 255, 0, 0.2)",
                        }}
                        onClick={() => handleNumPress("0")}
                        className="h-16 rounded-2xl flex items-center justify-center text-2xl font-medium text-white"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        0
                      </motion.button>

                      {/* Backspace */}
                      <motion.button
                        whileTap={{ scale: 0.95, x: -5 }}
                        onClick={handleBackspace}
                        className="h-16 rounded-2xl flex items-center justify-center text-white/40 hover:text-[#FF6B6B]"
                      >
                        <svg
                          width="28"
                          height="28"
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

                    {/* Quick Amount Chips */}
                    <div className="flex gap-2 mt-6 justify-center flex-wrap">
                      {[100, 500, 1000, 2000, 5000].map((quickAmount) => (
                        <motion.button
                          key={quickAmount}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setAmount(quickAmount.toString())}
                          className="px-4 py-2 rounded-full text-sm font-medium"
                          style={{
                            background:
                              amount === quickAmount.toString()
                                ? "linear-gradient(135deg, #CCFF00 0%, #99CC00 100%)"
                                : "rgba(255,255,255,0.05)",
                            color:
                              amount === quickAmount.toString()
                                ? "#000"
                                : "rgba(255,255,255,0.6)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {quickAmount.toLocaleString()}
                        </motion.button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <motion.button
                      whileHover={{ scale: canProceed() ? 1.02 : 1 }}
                      whileTap={{ scale: canProceed() ? 0.98 : 1 }}
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="mt-auto mb-8 py-4 rounded-2xl font-bold text-lg uppercase tracking-wide"
                      style={{
                        background: canProceed()
                          ? "linear-gradient(135deg, #CCFF00 0%, #99CC00 100%)"
                          : "rgba(255,255,255,0.1)",
                        color: canProceed() ? "#000" : "rgba(255,255,255,0.3)",
                        boxShadow: canProceed()
                          ? "0 10px 30px rgba(204, 255, 0, 0.3)"
                          : "none",
                      }}
                    >
                      Next →
                    </motion.button>
                  </motion.div>
                )}

                {/* STEP 2: Category Selection */}
                {step === "category" && (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="h-full flex flex-col"
                  >
                    <h2 className="text-white/40 text-sm uppercase tracking-wider mb-2 text-center">
                      What category?
                    </h2>
                    <p className="text-center text-3xl font-bold text-white mb-8">
                      {formatPKR(parseFloat(amount || "0"))}
                    </p>

                    {/* Category Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {CATEGORIES.map((cat) => {
                        const isSelected = category?.id === cat.id;
                        return (
                          <motion.button
                            key={cat.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCategory(cat)}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl"
                            style={{
                              background: isSelected
                                ? `linear-gradient(135deg, ${cat.color}40 0%, ${cat.color}20 100%)`
                                : "rgba(255,255,255,0.05)",
                              border: `2px solid ${isSelected ? cat.color : "rgba(255,255,255,0.1)"}`,
                              boxShadow: isSelected
                                ? `0 0 20px ${cat.color}40`
                                : "none",
                            }}
                          >
                            <span className="text-4xl mb-2">{cat.emoji}</span>
                            <span
                              className={`text-xs font-medium ${isSelected ? "text-white" : "text-white/60"}`}
                            >
                              {cat.id}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <motion.button
                      whileHover={{ scale: canProceed() ? 1.02 : 1 }}
                      whileTap={{ scale: canProceed() ? 0.98 : 1 }}
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="mt-auto mb-8 py-4 rounded-2xl font-bold text-lg uppercase tracking-wide"
                      style={{
                        background: canProceed()
                          ? "linear-gradient(135deg, #CCFF00 0%, #99CC00 100%)"
                          : "rgba(255,255,255,0.1)",
                        color: canProceed() ? "#000" : "rgba(255,255,255,0.3)",
                        boxShadow: canProceed()
                          ? "0 10px 30px rgba(204, 255, 0, 0.3)"
                          : "none",
                      }}
                    >
                      Next →
                    </motion.button>
                  </motion.div>
                )}

                {/* STEP 3: Bank Selection */}
                {step === "bank" && (
                  <motion.div
                    key="bank"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="h-full flex flex-col"
                  >
                    <h2 className="text-white/40 text-sm uppercase tracking-wider mb-2 text-center">
                      Paid from?
                    </h2>
                    <div className="text-center mb-8">
                      <span className="text-3xl font-bold text-white">
                        {formatPKR(parseFloat(amount || "0"))}
                      </span>
                      <span className="text-white/40 mx-2">•</span>
                      <span className="text-2xl">{category?.emoji}</span>
                    </div>

                    {/* Bank List */}
                    <div className="space-y-3">
                      {BANKS.map((b) => {
                        const isSelected = bank?.id === b.id;
                        return (
                          <motion.button
                            key={b.id}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setBank(b)}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl"
                            style={{
                              background: isSelected
                                ? `linear-gradient(135deg, ${b.color}30 0%, ${b.color}10 100%)`
                                : "rgba(255,255,255,0.05)",
                              border: `2px solid ${isSelected ? b.color : "rgba(255,255,255,0.1)"}`,
                              boxShadow: isSelected
                                ? `0 0 20px ${b.color}30`
                                : "none",
                            }}
                          >
                            <span className="text-3xl">{b.emoji}</span>
                            <span
                              className={`font-medium ${isSelected ? "text-white" : "text-white/60"}`}
                            >
                              {b.name}
                            </span>
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-auto text-xl"
                              >
                                ✓
                              </motion.span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <motion.button
                      whileHover={{ scale: canProceed() ? 1.02 : 1 }}
                      whileTap={{ scale: canProceed() ? 0.98 : 1 }}
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="mt-auto mb-8 py-4 rounded-2xl font-bold text-lg uppercase tracking-wide"
                      style={{
                        background: canProceed()
                          ? "linear-gradient(135deg, #CCFF00 0%, #99CC00 100%)"
                          : "rgba(255,255,255,0.1)",
                        color: canProceed() ? "#000" : "rgba(255,255,255,0.3)",
                        boxShadow: canProceed()
                          ? "0 10px 30px rgba(204, 255, 0, 0.3)"
                          : "none",
                      }}
                    >
                      Next →
                    </motion.button>
                  </motion.div>
                )}

                {/* STEP 4: Description (Optional) */}
                {step === "description" && (
                  <motion.div
                    key="description"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="h-full flex flex-col"
                  >
                    <h2 className="text-white/40 text-sm uppercase tracking-wider mb-2 text-center">
                      Add a note (optional)
                    </h2>
                    <div className="text-center mb-8">
                      <span className="text-3xl font-bold text-white">
                        {formatPKR(parseFloat(amount || "0"))}
                      </span>
                      <span className="text-white/40 mx-2">•</span>
                      <span className="text-2xl">{category?.emoji}</span>
                      <span className="text-white/40 mx-2">•</span>
                      <span className="text-2xl">{bank?.emoji}</span>
                    </div>

                    {/* Description Input */}
                    <div
                      className="rounded-2xl p-4 mb-6"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Lunch with friends..."
                        className="w-full bg-transparent text-white text-lg placeholder:text-white/30 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap gap-2 mb-8">
                      {[
                        "Lunch",
                        "Dinner",
                        "Groceries",
                        "Bills",
                        "Shopping",
                        "Transport",
                      ].map((suggestion) => (
                        <motion.button
                          key={suggestion}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDescription(suggestion)}
                          className="px-4 py-2 rounded-full text-sm"
                          style={{
                            background:
                              description === suggestion
                                ? "#CCFF00"
                                : "rgba(255,255,255,0.1)",
                            color:
                              description === suggestion
                                ? "#000"
                                : "rgba(255,255,255,0.6)",
                          }}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={nextStep}
                      className="mt-auto mb-8 py-4 rounded-2xl font-bold text-lg uppercase tracking-wide"
                      style={{
                        background:
                          "linear-gradient(135deg, #CCFF00 0%, #99CC00 100%)",
                        color: "#000",
                        boxShadow: "0 10px 30px rgba(204, 255, 0, 0.3)",
                      }}
                    >
                      Review →
                    </motion.button>
                  </motion.div>
                )}

                {/* STEP 5: Confirm with Swipe */}
                {step === "confirm" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="h-full flex flex-col items-center justify-center"
                  >
                    {/* Summary Card */}
                    <motion.div
                      drag="y"
                      dragConstraints={{ top: -150, bottom: 0 }}
                      dragElastic={0.2}
                      onDragEnd={handleSwipeEnd}
                      className="w-full p-8 rounded-3xl text-center cursor-grab active:cursor-grabbing"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileDrag={{ scale: 1.02 }}
                      style={{
                        y: swipeY,
                        opacity: swipeOpacity,
                        scale: swipeScale,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                      }}
                    >
                      {/* Emoji */}
                      <motion.div
                        animate={{
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="text-6xl mb-4"
                      >
                        {category?.emoji}
                      </motion.div>

                      {/* Amount */}
                      <motion.h2
                        className="text-5xl font-bold text-white mb-2"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {formatPKR(parseFloat(amount || "0"))}
                      </motion.h2>

                      {/* Details */}
                      <p className="text-white/60 text-lg mb-4">
                        {description || category?.id}
                      </p>

                      <div className="flex items-center justify-center gap-2 text-white/40">
                        <span className="text-xl">{bank?.emoji}</span>
                        <span>{bank?.name}</span>
                      </div>
                    </motion.div>

                    {/* Swipe Instructions */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="mt-12 text-center"
                    >
                      <div className="text-4xl mb-2">👆</div>
                      <p className="text-white/40 text-sm uppercase tracking-wider">
                        Swipe up to confirm
                      </p>
                    </motion.div>

                    {/* Or tap button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      className="mt-8 py-4 px-12 rounded-2xl font-bold text-lg"
                      style={{
                        background:
                          "linear-gradient(135deg, #CCFF00 0%, #99CC00 100%)",
                        color: "#000",
                        boxShadow: "0 10px 30px rgba(204, 255, 0, 0.3)",
                      }}
                    >
                      Confirm 🚀
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Success Animation */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="fixed inset-0 z-60 bg-[#0A0A0C] flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 0.5 }}
                      className="text-8xl mb-4"
                    >
                      ✨
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold text-white"
                    >
                      Expense Added!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-white/40 mt-2"
                    >
                      {formatPKR(parseFloat(amount || "0"))} spent on{" "}
                      {description || category?.id}
                    </motion.p>
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
