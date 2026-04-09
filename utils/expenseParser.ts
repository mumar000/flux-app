// Natural Language Expense Parser
// Parses text like: "500rs buy ice cream from meezan bank account"
// or "1200 pizza from hbl" or "300rs coffee jazzcash"

export interface ParsedExpense {
  amount: number;
  description: string;
  bankAccount: string;
  category: string;
  rawInput: string;
}

// Common bank names in Pakistan
export const BANK_KEYWORDS: Record<string, string> = {
  meezan: "Meezan Bank",
  hbl: "HBL",
  habib: "HBL",
  ubl: "UBL",
  mcb: "MCB",
  allied: "Allied Bank",
  askari: "Askari Bank",
  faysal: "Faysal Bank",
  jazzcash: "JazzCash",
  jazz: "JazzCash",
  easypaisa: "Easypaisa",
  easy: "Easypaisa",
  nayapay: "NayaPay",
  sadapay: "SadaPay",
  "bank al habib": "Bank Al Habib",
  alhabib: "Bank Al Habib",
  alfalah: "Bank Alfalah",
  "standard chartered": "Standard Chartered",
  sc: "Standard Chartered",
  cash: "Cash",
};

// Category detection based on keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    "food",
    "eat",
    "lunch",
    "dinner",
    "breakfast",
    "biryani",
    "pizza",
    "burger",
    "chai",
    "coffee",
    "ice cream",
    "icecream",
    "restaurant",
    "dhaba",
    "hotel",
    "snacks",
    "samosa",
    "paratha",
    "nihari",
    "haleem",
    "karahi",
  ],
  Transport: [
    "uber",
    "careem",
    "petrol",
    "fuel",
    "cng",
    "bus",
    "taxi",
    "rickshaw",
    "metro",
    "transport",
    "travel",
    "fare",
  ],
  Shopping: [
    "clothes",
    "shoes",
    "shopping",
    "mall",
    "shirt",
    "jeans",
    "dress",
    "hoodie",
    "buy",
  ],
  Bills: [
    "bill",
    "electricity",
    "gas",
    "water",
    "internet",
    "wifi",
    "mobile",
    "phone",
    "recharge",
    "fesco",
    "lesco",
    "ssgc",
    "sngpl",
  ],
  Entertainment: [
    "movie",
    "netflix",
    "spotify",
    "youtube",
    "game",
    "gaming",
    "playstation",
    "cinema",
    "concert",
  ],
  Health: [
    "medicine",
    "doctor",
    "hospital",
    "pharmacy",
    "clinic",
    "medical",
    "gym",
    "fitness",
  ],
  Education: [
    "books",
    "course",
    "tuition",
    "fee",
    "university",
    "college",
    "school",
    "academy",
  ],
  Groceries: [
    "grocery",
    "vegetables",
    "fruits",
    "milk",
    "bread",
    "eggs",
    "supermarket",
    "mart",
    "store",
  ],
  Other: [],
};

// Emoji mapping for categories
export const CATEGORY_EMOJIS: Record<string, string> = {
  Food: "🍔",
  Transport: "🚕",
  Shopping: "🛍️",
  Bills: "📄",
  Entertainment: "🎬",
  Health: "💊",
  Education: "📚",
  Groceries: "🛒",
  Other: "📦",
};

// Color mapping for pie chart
export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#FF6B6B",
  Transport: "#4ECDC4",
  Shopping: "#FFE66D",
  Bills: "#95A5A6",
  Entertainment: "#9B59B6",
  Health: "#2ECC71",
  Education: "#3498DB",
  Groceries: "#E67E22",
  Other: "#BDC3C7",
};

export function parseExpense(input: string): ParsedExpense | null {
  const rawInput = input.trim();
  if (!rawInput) return null;

  const lowerInput = rawInput.toLowerCase();

  // Extract amount - supports formats like: 500rs, 500 rs, rs500, Rs. 500, 500, etc.
  const amountRegex =
    /(?:rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:rs\.?|rupees?)?/i;
  const amountMatch = lowerInput.match(amountRegex);

  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  if (isNaN(amount) || amount <= 0) return null;

  // Extract bank account
  let bankAccount = "Cash";
  for (const [keyword, bankName] of Object.entries(BANK_KEYWORDS)) {
    if (lowerInput.includes(keyword)) {
      bankAccount = bankName;
      break;
    }
  }

  // Detect category
  let category = "Other";
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerInput.includes(keyword))) {
      category = cat;
      break;
    }
  }

  // Extract description - remove amount and bank references for cleaner description
  let description = rawInput
    .replace(/\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:rs\.?|rupees?)?/gi, "")
    .replace(/(?:rs\.?\s*)\d+(?:,\d{3})*(?:\.\d{1,2})?/gi, "")
    .replace(/\b(?:from|via|through|using)\s+\w+\s*(?:bank|account)?/gi, "")
    .replace(
      /\b(?:meezan|hbl|ubl|mcb|jazzcash|easypaisa|sadapay|nayapay|cash)\b/gi,
      "",
    )
    .replace(/\b(?:bank|account)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // If description is too short or empty, use category as description
  if (description.length < 3) {
    description = category;
  }

  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    amount,
    description,
    bankAccount,
    category,
    rawInput,
  };
}

// Format amount in Pakistani style
export function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
