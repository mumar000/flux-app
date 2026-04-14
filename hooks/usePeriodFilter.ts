import { useMemo } from "react";
import type { Period, TransactionFilters } from "@/types/period";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthLabel(monthKey: string, options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }) {
  return new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-PK", options);
}

function monthRangeEnd(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return toDateKey(new Date(year, month, 0));
}

function previousMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return toMonthKey(new Date(year, month - 2, 1));
}

function previousRange(startMonth: string, endMonth: string): { start: string; end: string } {
  const [startYear, start] = startMonth.split("-").map(Number);
  const [endYear, end] = endMonth.split("-").map(Number);
  const monthCount = (endYear - startYear) * 12 + (end - start) + 1;
  const priorEnd = new Date(startYear, start - 2, 1);
  const priorStart = new Date(priorEnd.getFullYear(), priorEnd.getMonth() - monthCount + 1, 1);
  return {
    start: toMonthKey(priorStart),
    end: toMonthKey(priorEnd),
  };
}

export function usePeriodFilter(period: Period) {
  return useMemo(() => {
    const now = new Date();
    const thisMonth = toMonthKey(now);
    const lastMonth = previousMonth(thisMonth);

    if (period.type === "last_month") {
      return {
        filters: { month: lastMonth } satisfies TransactionFilters,
        priorFilters: { month: previousMonth(lastMonth) } satisfies TransactionFilters,
        label: monthLabel(lastMonth),
        shortLabel: monthLabel(lastMonth, { month: "short" }),
        priorLabel: monthLabel(previousMonth(lastMonth), { month: "short" }),
        transactionTitle: `${monthLabel(lastMonth, { month: "long" })} Transactions`,
        emptyCopy: `No transactions in ${monthLabel(lastMonth, { month: "long" })}`,
        showAllByDefault: true,
        flowSuffix: "last month",
      };
    }

    if (period.type === "ytd") {
      const currentYear = now.getFullYear();
      return {
        filters: { startDate: `${currentYear}-01-01` } satisfies TransactionFilters,
        priorFilters: {
          startDate: `${currentYear - 1}-01-01`,
          endDate: `${currentYear - 1}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        } satisfies TransactionFilters,
        label: `Jan - ${monthLabel(thisMonth, { month: "short" })} ${currentYear}`,
        shortLabel: "YTD",
        priorLabel: `${currentYear - 1} YTD`,
        transactionTitle: "All Transactions",
        emptyCopy: "No transactions this year",
        showAllByDefault: false,
        pageSize: 20,
        flowSuffix: "YTD",
      };
    }

    if (period.type === "custom") {
      const start = period.start <= period.end ? period.start : period.end;
      const end = period.start <= period.end ? period.end : period.start;
      const prior = previousRange(start, end);
      return {
        filters: {
          startDate: `${start}-01`,
          endDate: monthRangeEnd(end),
        } satisfies TransactionFilters,
        priorFilters: {
          startDate: `${prior.start}-01`,
          endDate: monthRangeEnd(prior.end),
        } satisfies TransactionFilters,
        label: `${monthLabel(start, { month: "short" })} - ${monthLabel(end, { month: "short" })} ${end.slice(0, 4)}`,
        shortLabel: `${monthLabel(start, { month: "short" })} - ${monthLabel(end, { month: "short" })}`,
        priorLabel: `${monthLabel(prior.start, { month: "short" })} - ${monthLabel(prior.end, { month: "short" })}`,
        transactionTitle: `${monthLabel(start, { month: "short" })} - ${monthLabel(end, { month: "short" })} Transactions`,
        emptyCopy: "No transactions in this period",
        showAllByDefault: true,
        flowSuffix: "selected period",
      };
    }

    return {
      filters: { month: thisMonth } satisfies TransactionFilters,
      priorFilters: { month: lastMonth } satisfies TransactionFilters,
      label: monthLabel(thisMonth),
      shortLabel: "this month",
      priorLabel: monthLabel(lastMonth, { month: "short" }),
      transactionTitle: "Recent Transactions",
      emptyCopy: "No transactions yet this month",
      showAllByDefault: false,
      pageSize: 5,
      flowSuffix: "this month",
    };
  }, [period]);
}
