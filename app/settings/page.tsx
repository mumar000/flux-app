"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/queries/useCategories";
import { useBanks } from "@/hooks/queries/useBanks";
import { useAddCategory } from "@/hooks/mutations/useAddCategory";
import { useDeleteCategory } from "@/hooks/mutations/useDeleteCategory";
import { useAddBank } from "@/hooks/mutations/useAddBank";
import { useDeleteBank } from "@/hooks/mutations/useDeleteBank";
import { ComparisonItemsManager } from "@/components/mobile/ComparisonItemsManager";
import { BottomNav } from "@/components/mobile/BottomNav";

export default function SettingsPage() {
  const { user, signOut, loading: authLoading } = useAuth();

  const { data: categories = [] } = useCategories();
  const { data: banks = [] } = useBanks();

  const addCategory = useAddCategory();
  const deleteCategory = useDeleteCategory();
  const addBank = useAddBank();
  const deleteBank = useDeleteBank();

  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");
  const [newBankName, setNewBankName] = useState("");

  if (!user && !authLoading) return null;

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory.mutate(
      {
        name: newCatName.trim(),
        emoji: newCatEmoji,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
      },
      { onSuccess: () => setNewCatName("") }
    );
  };

  const handleAddBank = () => {
    if (!newBankName.trim()) return;
    addBank.mutate(newBankName.trim(), { onSuccess: () => setNewBankName("") });
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white pb-32">

      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Settings</h1>
            <p className="text-white/30 text-sm mt-0.5">Personalize your financial flow</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={signOut}
            className="text-red-400 text-sm font-bold px-4 py-2 rounded-xl"
            style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.15)" }}
          >
            Log out
          </motion.button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-8">

        {/* Profile */}
        <section
          className="rounded-[28px] p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(236,72,153,0.06))",
            border: "1px solid rgba(167,139,250,0.15)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              👤
            </div>
            <div className="min-w-0">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Logged in as</p>
              <p className="text-white font-extrabold truncate">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* Two-column grid on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Categories */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold flex items-center gap-2">🏷️ Categories</h2>
              <span
                className="text-[10px] px-2 py-1 rounded-full font-extrabold uppercase"
                style={{ background: "rgba(204,255,0,0.1)", color: "#CCFF00" }}
              >
                {categories.length} total
              </span>
            </div>

            <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
              <AnimatePresence>
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        {cat.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{cat.name}</p>
                        {cat.is_default && (
                          <span className="text-[10px] text-white/25 uppercase font-bold">Default</span>
                        )}
                      </div>
                    </div>
                    {!cat.is_default && (
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => deleteCategory.mutate(cat.id)}
                        className="text-white/20 hover:text-red-400 active:text-red-400 transition-colors p-1.5 flex-shrink-0"
                      >
                        🗑️
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add category */}
            <div
              className="p-3 sm:p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}
            >
              <div className="flex gap-2">
                <input
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl text-center text-xl outline-none focus:ring-1 focus:ring-[#CCFF00] flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  placeholder="🍕"
                />
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  className="flex-1 min-w-0 px-3 sm:px-4 h-11 sm:h-12 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#CCFF00] text-white placeholder:text-white/20"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  placeholder="Category name..."
                />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleAddCategory}
                  disabled={addCategory.isPending}
                  className="px-3 sm:px-4 h-11 sm:h-12 rounded-xl text-black font-extrabold text-sm disabled:opacity-50 flex-shrink-0"
                  style={{ background: "#CCFF00" }}
                >
                  Add
                </motion.button>
              </div>
            </div>
          </section>

          {/* Banks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold flex items-center gap-2">🏦 Banks & Accounts</h2>
              <span
                className="text-[10px] px-2 py-1 rounded-full font-extrabold uppercase"
                style={{ background: "rgba(78,205,196,0.1)", color: "#4ECDC4" }}
              >
                {banks.length} total
              </span>
            </div>

            <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
              <AnimatePresence>
                {banks.map((bank) => (
                  <motion.div
                    key={bank.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        💳
                      </div>
                      <p className="font-bold text-sm">{bank.name}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => deleteBank.mutate(bank.id)}
                      className="text-white/20 hover:text-red-400 active:text-red-400 transition-colors p-1.5"
                    >
                      🗑️
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {banks.length === 0 && (
                <p
                  className="text-white/20 text-center py-6 text-sm rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)" }}
                >
                  No custom banks yet
                </p>
              )}
            </div>

            {/* Add bank */}
            <div
              className="p-3 sm:p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}
            >
              <div className="flex gap-2">
                <input
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddBank()}
                  className="flex-1 min-w-0 px-3 sm:px-4 h-11 sm:h-12 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#CCFF00] text-white placeholder:text-white/20"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  placeholder="e.g. Meezan, My Stash..."
                />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleAddBank}
                  disabled={addBank.isPending}
                  className="px-3 sm:px-4 h-11 sm:h-12 rounded-xl text-black font-extrabold text-sm disabled:opacity-50 flex-shrink-0"
                  style={{ background: "#CCFF00" }}
                >
                  Add
                </motion.button>
              </div>
            </div>
          </section>

        </div>

        {/* Comparison Items — full width below the two-column grid */}
        <ComparisonItemsManager />

      </div>
    </div>
  );
}
