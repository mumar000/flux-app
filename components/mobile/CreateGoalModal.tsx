"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateGoal } from "@/hooks/mutations/useCreateGoal";

const EMOJI_OPTIONS = [
  "🎯","💻","✈️","🏠","💍","🎓","🏋️","🎮","👟","📱",
  "🚗","🎸","📷","👜","🌴","💊","🎁","🐕","🍕","⌚",
  "🏖️","🎪","🛵","💈","🧳","🎻","🖥️","👓","🎩","🚀",
];

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGoalModal({ isOpen, onClose }: CreateGoalModalProps) {
  const [step, setStep] = useState<"emoji" | "details">("emoji");
  const [emoji, setEmoji] = useState("🎯");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const createGoal = useCreateGoal();

  const reset = () => {
    setStep("emoji"); setEmoji("🎯"); setTitle("");
    setAmount(""); setDeadline(""); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!title.trim()) { setError("Give your goal a name"); return; }
    const n = Number(amount);
    if (!n || n <= 0) { setError("Enter a valid target amount"); return; }

    createGoal.mutate(
      { title: title.trim(), target_amount: n, emoji, deadline: deadline || undefined },
      { onSuccess: handleClose }
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] px-5 pt-4 pb-10"
            style={{ background: "#13142A", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <AnimatePresence mode="wait">
              {/* Step 1: Emoji */}
              {step === "emoji" && (
                <motion.div key="emoji"
                  initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.2 }}
                >
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">
                    Step 1 of 2
                  </p>
                  <h3 className="text-white text-2xl font-extrabold mb-1">
                    What are you saving for?
                  </h3>
                  <p className="text-white/40 text-sm mb-5">Pick an emoji that represents it</p>

                  {/* Big preview */}
                  <motion.div key={emoji}
                    initial={{ scale: 0.5, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="text-7xl text-center mb-5"
                  >
                    {emoji}
                  </motion.div>

                  {/* Grid */}
                  <div className="grid grid-cols-6 gap-2 mb-6">
                    {EMOJI_OPTIONS.map((e) => {
                      const active = emoji === e;
                      return (
                        <motion.button key={e} whileTap={{ scale: 0.82 }}
                          onClick={() => setEmoji(e)}
                          className="h-12 rounded-2xl text-2xl flex items-center justify-center"
                          style={{
                            background: active ? "rgba(204,255,0,0.12)" : "rgba(255,255,255,0.05)",
                            border: `1px solid ${active ? "rgba(204,255,0,0.4)" : "transparent"}`,
                          }}
                        >
                          {e}
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setStep("details")}
                    className="w-full py-4 rounded-2xl text-black font-extrabold text-base"
                    style={{ background: "#CCFF00" }}
                  >
                    Next →
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2: Details */}
              {step === "details" && (
                <motion.div key="details"
                  initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <motion.button whileTap={{ scale: 0.92 }}
                      onClick={() => { setStep("emoji"); setError(""); }}
                      className="text-white/40 text-sm font-medium px-3 py-1.5 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      ← Back
                    </motion.button>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest">Step 2 of 2</p>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-5xl">{emoji}</span>
                    <div>
                      <p className="text-white/40 text-xs">Your goal</p>
                      <h3 className="text-white text-xl font-extrabold">Set the details</h3>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mb-4">
                    <label className="text-white/35 text-[10px] uppercase tracking-widest mb-2 block font-semibold">
                      Goal name
                    </label>
                    <input value={title}
                      onChange={(e) => { setTitle(e.target.value); setError(""); }}
                      placeholder='e.g. "New Laptop", "Europe Trip"'
                      autoFocus
                      className="w-full rounded-2xl px-4 py-3.5 text-white text-base font-semibold outline-none placeholder:text-white/20"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>

                  {/* Amount */}
                  <div className="mb-4">
                    <label className="text-white/35 text-[10px] uppercase tracking-widest mb-2 block font-semibold">
                      Target amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 text-sm font-bold">
                        PKR
                      </span>
                      <input type="number" value={amount}
                        onChange={(e) => { setAmount(e.target.value); setError(""); }}
                        placeholder="50,000"
                        className="w-full rounded-2xl pl-16 pr-4 py-3.5 text-white text-base font-extrabold outline-none placeholder:text-white/20"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="mb-5">
                    <label className="text-white/35 text-[10px] uppercase tracking-widest mb-2 block font-semibold">
                      Deadline{" "}
                      <span className="text-white/20 normal-case font-normal">(optional)</span>
                    </label>
                    <input type="date" value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-2xl px-4 py-3.5 text-white text-base outline-none"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        colorScheme: "dark",
                      }}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[#FF6B6B] text-sm mb-3 font-medium"
                      >
                        ⚠️ {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={createGoal.isPending}
                    className="w-full py-4 rounded-2xl text-black font-extrabold text-base disabled:opacity-50"
                    style={{ background: "#CCFF00" }}
                  >
                    {createGoal.isPending ? "Creating..." : "Create Goal 🎯"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
