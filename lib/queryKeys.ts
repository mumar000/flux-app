export const queryKeys = {
  expenses: {
    all: ["expenses"] as const,
    list: (filters?: { month?: string }) => ["expenses", "list", filters] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => ["categories", "list"] as const,
  },
  banks: {
    all: ["banks"] as const,
    list: () => ["banks", "list"] as const,
  },
  goals: {
    all: ["goals"] as const,
    list: () => ["goals", "list"] as const,
    detail: (id: string) => ["goals", "detail", id] as const,
  },
  dailyRizq: {
    today: () => ["daily-rizq", "today"] as const,
  },
  streaks: {
    all: ["streaks"] as const,
    current: () => ["streaks", "current"] as const,
  },
} as const;
