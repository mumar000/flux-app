"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComparisonItems } from "@/hooks/queries/useComparisonItems";
import { useCreateComparisonItem } from "@/hooks/mutations/useCreateComparisonItem";
import { useUpdateComparisonItem } from "@/hooks/mutations/useUpdateComparisonItem";
import { useDeleteComparisonItem } from "@/hooks/mutations/useDeleteComparisonItem";

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------
interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

function Toggle({ enabled, onChange, disabled }: ToggleProps) {
  return (
    <motion.button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200"
      style={{
        background: enabled ? "#CCFF00" : "rgba(255,255,255,0.12)",
        opacity: disabled ? 0.5 : 1,
      }}
      aria-label={enabled ? "Disable" : "Enable"}
      whileTap={{ scale: 0.92 }}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 rounded-full"
        style={{
          background: enabled ? "#000" : "rgba(255,255,255,0.55)",
          left: enabled ? "calc(100% - 22px)" : "2px",
        }}
      />
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function ItemSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[60px] rounded-2xl animate-pulse"
          style={{ background: "rgba(255,255,255,0.04)", animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ComparisonItemsManager() {
  const { data: items = [], isLoading } = useComparisonItems();
  const createItem = useCreateComparisonItem();
  const updateItem = useUpdateComparisonItem();
  const deleteItem = useDeleteComparisonItem();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newEmoji, setNewEmoji] = useState("💰");
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = () => {
    setFormError(null);
    const label = newLabel.trim();
    const amount = parseFloat(newAmount);

    if (!label) { setFormError("Label is required"); return; }
    if (!amount || amount <= 0) { setFormError("Amount must be a positive number"); return; }

    createItem.mutate(
      { label, amount, emoji: newEmoji },
      {
        onSuccess: () => {
          setNewLabel("");
          setNewAmount("");
          setNewEmoji("💰");
          setFormError(null);
          setShowAddForm(false);
        },
        onError: (err) => {
          setFormError(err.message ?? "Could not create item");
        },
      }
    );
  };

  const handleToggle = (id: string, enabled: boolean) => {
    updateItem.mutate({ id, enabled });
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate(id);
  };

  const enabledCount = items.filter((i) => i.enabled).length;

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-extrabold flex items-center gap-2">
          💭 Comparison Items
        </h2>
        <span
          className="text-[10px] px-2 py-1 rounded-full font-extrabold uppercase"
          style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}
        >
          {enabledCount} active
        </span>
      </div>

      <p className="text-white/30 text-[12px] font-medium mb-4 leading-relaxed">
        These are used to calculate "That Could've Been" comparisons whenever you log a spend.
        Toggle to enable/disable. Add your own.
      </p>

      {/* List */}
      {isLoading ? (
        <ItemSkeleton />
      ) : (
        <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{
                  background: item.enabled
                    ? "rgba(167,139,250,0.05)"
                    : "rgba(255,255,255,0.03)",
                  border: item.enabled
                    ? "1px solid rgba(167,139,250,0.15)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Emoji */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  {item.emoji}
                </div>

                {/* Label + amount */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate transition-colors duration-200"
                    style={{ color: item.enabled ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.40)" }}
                  >
                    {item.label}
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.30)" }}>
                    PKR {item.amount.toLocaleString("en-PK")}
                  </p>
                </div>

                {/* Toggle */}
                <Toggle
                  enabled={item.enabled}
                  onChange={(val) => handleToggle(item.id, val)}
                  disabled={updateItem.isPending}
                />

                {/* Delete */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={() => handleDelete(item.id)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 active:text-red-400 transition-colors flex-shrink-0"
                  aria-label={`Delete ${item.label}`}
                >
                  🗑️
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && !isLoading && (
            <div
              className="py-8 text-center rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.01)",
                border: "1px dashed rgba(255,255,255,0.07)",
              }}
            >
              <p className="text-white/25 text-sm">No items yet — add one below</p>
            </div>
          )}
        </div>
      )}

      {/* Add form toggle */}
      <AnimatePresence>
        {!showAddForm ? (
          <motion.button
            key="add-btn"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 rounded-2xl text-sm font-extrabold transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.40)",
            }}
          >
            + Add comparison item
          </motion.button>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div
              className="p-4 rounded-2xl space-y-3"
              style={{
                background: "rgba(167,139,250,0.05)",
                border: "1px solid rgba(167,139,250,0.15)",
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#A78BFA" }}>
                New item
              </p>

              {/* Emoji + Label row */}
              <div className="flex gap-2">
                <input
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  className="w-12 h-11 rounded-xl text-center text-xl outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#fff",
                  }}
                  maxLength={2}
                  aria-label="Emoji"
                />
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  placeholder="e.g. Concert Ticket"
                  className="flex-1 min-w-0 px-3 h-11 rounded-xl text-sm outline-none text-white placeholder:text-white/20"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                />
              </div>

              {/* Amount */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm font-semibold flex-shrink-0">PKR</span>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  placeholder="1800"
                  min="1"
                  className="flex-1 min-w-0 px-3 h-11 rounded-xl text-sm outline-none text-white placeholder:text-white/20"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {formError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-semibold"
                    style={{ color: "#FF6B6B" }}
                  >
                    {formError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={handleCreate}
                  disabled={createItem.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-extrabold text-black disabled:opacity-60"
                  style={{ background: "#CCFF00" }}
                >
                  {createItem.isPending ? "Adding..." : "Add"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    setShowAddForm(false);
                    setNewLabel("");
                    setNewAmount("");
                    setNewEmoji("💰");
                    setFormError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.50)",
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
