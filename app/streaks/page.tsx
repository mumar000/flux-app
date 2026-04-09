"use client";

import React from "react";
import { SpendStreakCard } from "@/components/mobile/SpendStreakCard";
import { BottomNav } from "@/components/mobile/BottomNav";

export default function StreaksPage() {
  const currentMonth = new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ backgroundColor: "#0F0F11" }}>
      <header className="px-6 pt-10 pb-4">
        <div>
          <p className="text-[#8F90A6] text-xs font-extrabold tracking-widest uppercase">Insights</p>
          <h1 className="text-2xl font-extrabold text-white mt-0.5">Your Streaks</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 mt-4">
        <div>
          <SpendStreakCard />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
