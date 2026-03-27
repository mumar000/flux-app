export interface StreakData {
  currentCount: number;
  startDate: string | null;
  lastBrokenDate: string | null;
  lastBrokenAmount: number | null;
  lastBrokenDescription: string | null;
  mourningMessage: string | null;
}

export interface UnderBudgetStreakData {
  currentCount: number;
  startDate: string | null;
  lastBrokenDate: string | null;
  lastBrokenAmount: number | null;
  mourningMessage: string | null;
}

export interface SpendStreakResponse {
  noImpulse: StreakData;
  underBudget: UnderBudgetStreakData;
  dailyBudget: number;
  computedAt: string;
}

export interface UpdateStreakSettingsInput {
  dailyBudget?: number | null; // null resets to auto
}
