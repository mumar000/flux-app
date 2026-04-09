// Natural Language Transaction Parser — Income Direction
// Handles structured input: "1500 in UBL salary", "8000 freelance meezan"
// Handles Gen-Z conversational: "boss paid me 15k", "salary finally dropped"
//
// Reuses BANK_KEYWORDS from expenseParser — do NOT duplicate the map.

import { BANK_KEYWORDS } from "@/utils/expenseParser";

export interface ParsedIncome {
  amount: number | null;
  description: string;
  bankAccount: string | null;
  category: string;
  rawInput: string;
  confidence: "high" | "medium" | "low";
  missingAmount: boolean;
}

// Income category detection keywords
const INCOME_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Salary: [
    "salary",
    "salry",
    "talaab",
    "paycheck",
    "pay check",
    "monthly pay",
    "boss paid",
    "office paid",
    "company paid",
    "got paid",
    "finally paid",
    "payment received",
    "pay aaya",
    "pay agaya",
    "pay dropped",
    "salary dropped",
    "salary ayi",
    "salary agyi",
  ],
  "Freelance / Gig": [
    "freelance",
    "gig",
    "project",
    "client paid",
    "client payment",
    "design payment",
    "dev payment",
    "fiverr",
    "upwork",
    "freelancing",
    "kaam ka",
    "project payment",
    "side hustle",
  ],
  "Creator Income": [
    "youtube",
    "adsense",
    "creator",
    "channel",
    "monetization",
    "sponsorship",
    "brand deal",
    "content",
    "tiktok",
    "instagram earning",
    "creator fund",
  ],
  "Resale / Flip": [
    "sold",
    "sell",
    "sale",
    "olx",
    "resale",
    "flip",
    "becha",
    "bechi",
    "sell kar",
    "marketplace",
    "daraz",
  ],
  Transfer: [
    "transfer",
    "transferred",
    "send",
    "sent",
    "bheja",
    "receive transfer",
    "account transfer",
    "bank transfer",
  ],
  "Cash Deposit": [
    "cash deposit",
    "deposit",
    "deposited",
    "jama",
    "cash in",
    "cash jama",
  ],
  Refund: [
    "refund",
    "refunded",
    "wapas",
    "return",
    "returned",
    "cashback",
    "cash back",
    "reversal",
    "reimbursement",
  ],
  Gift: [
    "gift",
    "eidi",
    "eid",
    "birthday",
    "present",
    "surprise",
    "tuhfa",
    "diya",
    "diye",
  ],
  "Pocket Money / Allowance": [
    "pocket money",
    "allowance",
    "kharch",
    "ghar se",
    "ammi",
    "abbu",
    "parents",
    "bhai",
    "allowance ayi",
  ],
  "Prize / Win": [
    "prize",
    "won",
    "win",
    "winning",
    "contest",
    "competition",
    "lucky",
    "jackpot",
  ],
  "Crypto / Investment": [
    "crypto",
    "bitcoin",
    "btc",
    "profit",
    "investment return",
    "dividend",
    "stock",
    "trading",
  ],
  "Paid Back": [
    "paid back",
    "payback",
    "wapas kiya",
    "wapas mila",
    "returned money",
    "got back",
    "ulta",
    "udhar wapas",
    "udhar mila",
    "liya tha wapas",
  ],
};

// Gen-Z / conversational income signal phrases
const INCOME_SIGNAL_PHRASES = [
  "got paid",
  "boss paid",
  "salary dropped",
  "salary ayi",
  "pay aaya",
  "received",
  "came through",
  "landed",
  "dropped in",
  "credited",
  "payment",
  "earning",
  "income",
  "mila",
  "mile",
  "milgaya",
  "agaya",
];

// k/K suffix multiplier: "15k" → 15000
function parseAmountWithSuffix(raw: string): number | null {
  const match = raw.match(/(\d+(?:\.\d+)?)\s*k/i);
  if (match) return parseFloat(match[1]) * 1000;

  const stdMatch = raw.match(
    /(?:rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:rs\.?|rupees?)?/i
  );
  if (stdMatch) {
    const val = parseFloat(stdMatch[1].replace(/,/g, ""));
    return isNaN(val) || val <= 0 ? null : val;
  }
  return null;
}

function detectBankAccount(lowerInput: string): string | null {
  for (const [keyword, bankName] of Object.entries(BANK_KEYWORDS)) {
    if (lowerInput.includes(keyword)) return bankName;
  }
  return null;
}

function detectIncomeCategory(lowerInput: string): string {
  for (const [category, keywords] of Object.entries(INCOME_CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lowerInput.includes(kw))) return category;
  }
  return "Other";
}

function buildDescription(rawInput: string, category: string): string {
  let desc = rawInput
    // remove amounts including k-suffix
    .replace(/\d+(?:,\d{3})*(?:\.\d{1,2})?\s*k\b/gi, "")
    .replace(/(?:rs\.?\s*)?\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:rs\.?|rupees?)?/gi, "")
    // remove bank keywords
    .replace(
      new RegExp(
        `\\b(${Object.keys(BANK_KEYWORDS).join("|")})\\b`,
        "gi"
      ),
      ""
    )
    .replace(/\b(bank|account|wallet)\b/gi, "")
    // remove common filler
    .replace(/\b(from|via|through|using|in|to|got|received|me|finally|dropped|ayi|agyi|aaya|agaya|lol|yaar|bhai)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (desc.length < 3) desc = category;
  return desc.charAt(0).toUpperCase() + desc.slice(1);
}

export function parseIncome(input: string): ParsedIncome {
  const rawInput = input.trim();
  const lowerInput = rawInput.toLowerCase();

  const amount = parseAmountWithSuffix(lowerInput);
  const bankAccount = detectBankAccount(lowerInput);
  const category = detectIncomeCategory(lowerInput);
  const description = buildDescription(rawInput, category);

  const hasIncomeSignal = INCOME_SIGNAL_PHRASES.some((phrase) =>
    lowerInput.includes(phrase)
  );

  const confidence: "high" | "medium" | "low" =
    amount !== null && bankAccount !== null
      ? "high"
      : amount !== null || hasIncomeSignal
      ? "medium"
      : "low";

  return {
    amount,
    description,
    bankAccount,
    category,
    rawInput,
    confidence,
    missingAmount: amount === null,
  };
}
