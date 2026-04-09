"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  INCOME_COLORS,
  INCOME_EMOJIS,
  formatPKR,
} from "@/utils/expenseParser";

interface SpendingData {
  name: string;
  value: number;
}

interface FinanceAnalyticsChartProps {
  expenseData: Record<string, number>;
  incomeData: Record<string, number>;
  totalExpenses: number;
  totalIncome: number;
}

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 14}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-2xl"
        style={{ filter: `drop-shadow(0 0 16px ${fill}A0)` }}
      />
    </g>
  );
};

export function FinanceAnalyticsChart({
  expenseData,
  incomeData,
  totalExpenses,
  totalIncome,
}: FinanceAnalyticsChartProps) {
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isExpense = mode === "expense";
  const dataMap = isExpense ? expenseData : incomeData;
  const total = isExpense ? totalExpenses : totalIncome;
  const COLOR_MAP = isExpense ? CATEGORY_COLORS : INCOME_COLORS;
  const EMOJI_MAP = isExpense ? CATEGORY_EMOJIS : INCOME_EMOJIS;

  const chartData: SpendingData[] = Object.entries(dataMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const onPieClick = useCallback((_: any, index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  }, []);

  const activeCategory = activeIndex !== null && chartData[activeIndex] ? chartData[activeIndex] : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-[32px] p-6 relative overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: activeCategory 
          ? `0 0 80px -30px ${COLOR_MAP[activeCategory.name]}40` 
          : "none",
        transition: "box-shadow 0.5s ease",
      }}
    >
      {/* Vibe Switch */}
      <div className="flex justify-center mb-6 relative z-10">
        <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/10 relative">
          <motion.div
            className="absolute inset-y-1 rounded-full"
            style={{ backgroundColor: isExpense ? "#FF6B6B20" : "#86EFAC20" }}
            layoutId="mode-pill"
            initial={false}
            animate={{
              left: isExpense ? 4 : "50%",
              width: "calc(50% - 4px)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button
            onClick={() => { setMode("expense"); setActiveIndex(null); }}
            className={`relative z-10 px-5 py-2 rounded-full text-xs font-extrabold transition-colors ${
              isExpense ? "text-[#FF8B8B]" : "text-white/40"
            }`}
          >
            💸 Spends
          </button>
          <button
            onClick={() => { setMode("income"); setActiveIndex(null); }}
            className={`relative z-10 px-5 py-2 rounded-full text-xs font-extrabold transition-colors ${
              !isExpense ? "text-[#86EFAC]" : "text-white/40"
            }`}
          >
            ✨ Secured
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-5xl mb-4">👻</div>
          <h3 className="text-lg font-bold text-white mb-1">Ghost Town</h3>
          <p className="text-xs text-white/40">Nothing to show here yet.</p>
        </motion.div>
      ) : (
        <>
          <div className="relative h-[250px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient
                      key={`gradient-${mode}-${index}`}
                      id={`gradient-${mode}-${entry.name}`}
                      x1="0" y1="0" x2="1" y2="1"
                    >
                      <stop offset="0%" stopColor={COLOR_MAP[entry.name] || "#8884d8"} stopOpacity={1} />
                      <stop offset="100%" stopColor={COLOR_MAP[entry.name] || "#8884d8"} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                {/* @ts-ignore Recharts Pie definitely accepts activeIndex but DT misses it occasionally */}
                <Pie
                  data={chartData}
                  cx="50%" cy="50%"
                  innerRadius={75} outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  {...({ activeIndex: activeIndex ?? undefined } as any)}
                  activeShape={renderActiveShape}
                  onClick={onPieClick}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${mode}-${index}`}
                      fill={`url(#gradient-${mode}-${entry.name})`}
                      className="cursor-pointer transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Glowing Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                {activeCategory ? (
                  <motion.div
                    key={activeCategory.name}
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: -10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="text-center flex flex-col items-center justify-center"
                  >
                    <motion.div 
                      animate={{ y: [0, -6, 0] }} 
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-3xl mb-1 filter drop-shadow-md"
                    >
                      {EMOJI_MAP[activeCategory.name] || "📦"}
                    </motion.div>
                    <p className="text-[#CCFF00] font-extrabold text-lg tracking-tight leading-none mb-0.5" 
                       style={{ color: COLOR_MAP[activeCategory.name] }}>
                      {formatPKR(activeCategory.value)}
                    </p>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                      {((activeCategory.value / total) * 100).toFixed(0)}%
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="total"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">
                      {isExpense ? "Total Spends" : "Total Secured"}
                    </p>
                    <p className="text-white font-extrabold text-xl">
                      {formatPKR(total)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Interactive Legend / "Vibe Checks" */}
          <div className="flex flex-col gap-2">
            {chartData.slice(0, 4).map((entry, index) => {
              const isActive = activeIndex === index;
              let label = entry.name;
              let labelStyle = "text-white/60";
              let labelTitle = "";
              
              if (index === 0 && chartData.length > 1) {
                 labelTitle = isExpense ? "Main Character Energy 💅" : "Top Bag 💰";
              } else if (index === 1 && chartData.length > 2) {
                 labelTitle = "Side Quest 🗺️";
              }

              return (
                <motion.div
                  key={entry.name}
                  onClick={() => setActiveIndex(isActive ? null : index)}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer relative overflow-hidden"
                  style={{
                    background: isActive ? `${COLOR_MAP[entry.name]}15` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? COLOR_MAP[entry.name] + "40" : "rgba(255,255,255,0.05)"}`
                  }}
                >
                  <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl"
                       style={{ background: `${COLOR_MAP[entry.name]}20` }}>
                    {EMOJI_MAP[entry.name] || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm truncate">{entry.name}</p>
                      {labelTitle && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full" 
                              style={{ background: `${COLOR_MAP[entry.name]}25`, color: COLOR_MAP[entry.name] }}>
                          {labelTitle}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-semibold mt-0.5 ${isActive ? "" : "text-white/40"}`}
                       style={{ color: isActive ? COLOR_MAP[entry.name] : "" }}>
                      {formatPKR(entry.value)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
