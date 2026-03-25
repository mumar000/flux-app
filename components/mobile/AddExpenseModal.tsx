"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";

// --- Types ---
interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string; // Used for glow effects
}

const defaultCategories: Category[] = [
  { id: "1", name: "Food", emoji: "🍔", color: "#FF6B6B" }, // Coral
  { id: "2", name: "Transport", emoji: "🛸", color: "#00F0FF" }, // Cyan
  { id: "3", name: "Fashion", emoji: "👟", color: "#FFE66D" }, // Yellow
  { id: "4", name: "Gaming", emoji: "👾", color: "#B983FF" }, // Purple
  { id: "5", name: "Tech", emoji: "🔋", color: "#00F0FF" }, // Cyan
  { id: "6", name: "Wellness", emoji: "🧘", color: "#95E1D3" }, // Teal
  { id: "7", name: "Social", emoji: "🥂", color: "#FF8B94" }, // Pink
  { id: "8", name: "Random", emoji: "🎲", color: "#FFFFFF" }, // White
];

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ open, onClose }: AddExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dynamic categories
  useEffect(() => {
    if (open) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const mapped = data.map((d: any) => ({
              id: d.id || d.name,
              name: d.name,
              emoji: d.emoji || "📦",
              color: d.color || "#BDC3C7",
            }));
            setCategories(mapped);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [open]);

  // Shake animation state
  const [shake, setShake] = useState(false);

  // --- Numpad Logic ---
  const handleNumPress = (num: string) => {
    if (amount.includes(".") && num === ".") return;
    if (amount.length > 7) return; // Prevent crazy lengths
    // Prevent multiple leading zeros
    if (amount === "0" && num !== ".") {
      setAmount(num);
      return;
    }
    setAmount((prev) => prev + num);
  };

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  // --- Submit Logic ---
  const handleSubmit = async () => {
    if (!amount || !selectedCategory) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsSubmitting(true);

    // TODO: Backend API Logic Here
    setTimeout(() => {
      console.log({ amount, category: selectedCategory });
      setAmount("");
      setSelectedCategory(null);
      setDescription("");
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Backdrop: Deep Void with Blur */}
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
            className="fixed bottom-0 left-0 right-0 z-50 h-[92vh] flex flex-col bg-[#121216] border-t border-white/10 rounded-t-[40px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* 1. Header & Handle */}
            <div className="flex justify-center pt-4 pb-2" onClick={onClose}>
              <div className="w-16 h-1.5 bg-white/10 rounded-full" />
            </div>

            <div className="flex-1 flex flex-col px-6 pb-8">
              {/* 2. The Big Amount Display */}
              <motion.div
                className={clsx(
                  "flex flex-col items-center justify-center flex-1 min-h-[120px]",
                  shake && "animate-shake", // Add custom CSS animation for shake
                )}
                animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
              >
                <div className="text-white/40 text-sm font-medium tracking-widest uppercase mb-2">
                  Total Spent
                </div>
                <div className="relative flex items-center">
                  <span className="text-4xl text-white/30 font-light mr-2">
                    $
                  </span>
                  <span
                    className={clsx(
                      "text-6xl font-bold tracking-tighter transition-colors duration-300",
                      amount ? "text-white" : "text-white/10",
                    )}
                  >
                    {amount || "0"}
                  </span>
                  <span className="text-6xl text-white animate-pulse">|</span>
                </div>
              </motion.div>

              {/* 3. Horizontal Scroll Categories (The "Vibe" Picker) */}
              <div className="mb-6">
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory?.id === cat.id;
                    return (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedCategory(cat)}
                        className={clsx(
                          "flex flex-col items-center justify-center min-w-[72px] h-[72px] rounded-2xl border snap-center transition-all duration-300",
                          isSelected
                            ? "bg-white/10 border-transparent shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            : "bg-transparent border-white/5 hover:bg-white/5",
                        )}
                        style={{
                          borderColor: isSelected ? cat.color : undefined,
                          boxShadow: isSelected
                            ? `0 0 20px ${cat.color}40`
                            : undefined,
                        }}
                      >
                        <span className="text-3xl mb-1 filter drop-shadow-md">
                          {cat.emoji}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                {selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm font-medium tracking-widest uppercase"
                    style={{ color: selectedCategory.color }}
                  >
                    {selectedCategory.name}
                  </motion.div>
                )}
              </div>

              {/* 4. Giant Numpad (No Native Keyboard) */}
              {/* 5. The "Aerogel" Numpad */}
              <div className="grid grid-cols-3 gap-3 mb-8 px-2">
                {/* Numbers 1-9 */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <motion.button
                    key={num}
                    onClick={() => handleNumPress(num.toString())}
                    whileHover={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      boxShadow: "0 0 15px rgba(255, 255, 255, 0.05)",
                    }}
                    whileTap={{
                      scale: 0.9,
                      backgroundColor: "rgba(204, 255, 0, 0.1)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="h-20 rounded-[24px] bg-white/5 border-t border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-md flex items-center justify-center group relative overflow-hidden"
                  >
                    <span className="text-3xl font-medium text-white group-hover:text-white transition-colors z-10 font-['Space_Grotesk']">
                      {num}
                    </span>

                    {/* Subtle internal gradient blob that moves on hover could go here, keeping it clean for now */}
                  </motion.button>
                ))}

                {/* Decimal Point */}
                <motion.button
                  onClick={() => handleNumPress(".")}
                  whileTap={{ scale: 0.9 }}
                  className="h-20 rounded-[24px] bg-transparent flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <span className="text-4xl font-bold pb-4">.</span>
                </motion.button>

                {/* Number 0 */}
                <motion.button
                  onClick={() => handleNumPress("0")}
                  whileHover={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 0 15px rgba(255, 255, 255, 0.05)",
                  }}
                  whileTap={{
                    scale: 0.9,
                    backgroundColor: "rgba(204, 255, 0, 0.1)",
                  }}
                  className="h-20 rounded-[24px] bg-white/5 border-t border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-md flex items-center justify-center"
                >
                  <span className="text-3xl font-medium text-white font-['Space_Grotesk']">
                    0
                  </span>
                </motion.button>

                {/* Backspace (Destructive Action) */}
                <motion.button
                  onClick={handleBackspace}
                  whileTap={{ scale: 0.9, x: -2 }}
                  className="h-20 rounded-[24px] flex items-center justify-center text-white/40 hover:text-[#FF6B6B] transition-colors group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:drop-shadow-[0_0_8px_rgba(255,107,107,0.5)] transition-all"
                  >
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                    <line x1="18" y1="9" x2="12" y2="15"></line>
                    <line x1="12" y1="9" x2="18" y2="15"></line>
                  </svg>
                </motion.button>
              </div>
              {/* 5. Note Input (Optional/Minimal) */}
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note..."
                className="w-full bg-transparent text-center text-white/60 placeholder:text-white/20 border-b border-white/10 pb-2 mb-6 focus:outline-none focus:border-[#CCFF00] transition-colors"
              />

              {/* 6. Action Button (The "Send it" button) */}
              <motion.button
                onClick={handleSubmit}
                disabled={!amount || !selectedCategory || isSubmitting}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  "w-full py-5 rounded-2xl font-bold text-black text-lg uppercase tracking-wide transition-all shadow-[0_0_30px_rgba(204,255,0,0.2)]",
                  !amount || !selectedCategory
                    ? "bg-white/10 text-white/20 cursor-not-allowed"
                    : "bg-[#CCFF00] hover:bg-[#b3e600] cursor-pointer", // Rizqly Neon Lime
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Processing...
                  </span>
                ) : (
                  "Confirm Drop"
                )}
              </motion.button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
