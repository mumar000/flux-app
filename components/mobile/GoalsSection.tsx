"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoals } from "@/hooks/queries/useGoals";
import { GoalCard } from "@/components/mobile/GoalCard";
import { CreateGoalModal } from "@/components/mobile/CreateGoalModal";

export function GoalsSection() {
  const { data: goals = [], isLoading } = useGoals();
  const [showCreate, setShowCreate] = useState(false);

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 px-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h3 className="text-sm font-extrabold text-white/50 uppercase tracking-widest">
            Goals
          </h3>
          {!isLoading && goals.length > 0 && (
            <span
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(204,255,0,0.12)",
                color: "#CCFF00",
                border: "1px solid rgba(204,255,0,0.2)",
              }}
            >
              {activeGoals.length} active
            </span>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-extrabold"
          style={{
            background: "rgba(204,255,0,0.1)",
            color: "#CCFF00",
            border: "1px solid rgba(204,255,0,0.25)",
          }}
        >
          <span className="text-sm">+</span> New
        </motion.button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i}
              className="flex-shrink-0 w-[178px] rounded-[24px] animate-pulse"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                height: "280px",
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && goals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] p-6 text-center cursor-pointer"
          style={{
            background: "rgba(204,255,0,0.04)",
            border: "1px dashed rgba(204,255,0,0.2)",
          }}
          onClick={() => setShowCreate(true)}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-4xl mb-3"
          >
            🎯
          </motion.div>
          <p className="text-white font-extrabold text-base mb-1">
            Set your first goal
          </p>
          <p className="text-white/35 text-sm">
            Save for anything — a trip, a gadget, anything
          </p>
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="mt-4 inline-block px-5 py-2.5 rounded-2xl text-black text-sm font-extrabold"
            style={{ background: "#CCFF00" }}
          >
            Create goal →
          </motion.div>
        </motion.div>
      )}

      {/* Active goals horizontal scroll */}
      {!isLoading && activeGoals.length > 0 && (
        <div className="-mx-6 px-6">
          <div className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <AnimatePresence>
              {activeGoals.map((goal, i) => (
                <GoalCard key={goal.id} goal={goal} colorIndex={i} />
              ))}
            </AnimatePresence>

            {/* Add new — always last */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowCreate(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-shrink-0 w-[90px] rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.12)",
                minHeight: "200px",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-black"
                style={{
                  background: "rgba(204,255,0,0.1)",
                  color: "#CCFF00",
                  border: "1px solid rgba(204,255,0,0.2)",
                }}
              >
                +
              </div>
              <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider text-center px-2">
                New Goal
              </p>
            </motion.button>
          </div>
        </div>
      )}

      {/* Completed goals */}
      {!isLoading && completedGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4"
        >
          <p className="text-white/25 text-[10px] uppercase tracking-widest font-bold mb-2">
            Completed 🏆
          </p>
          <div className="-mx-6 px-6">
            <div className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {completedGoals.map((goal, i) => (
                <GoalCard key={goal.id} goal={goal} colorIndex={i} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <CreateGoalModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
