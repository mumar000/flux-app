# Rizqly Money Addition and Receipt Intelligence Design

> **Prepared:** March 30, 2026
> **Status:** Proposed
> **Primary Goal:** Add fast income and money-addition tracking without fragmenting the existing expense-first product experience

---

## 1. Feature Overview

### Summary

This feature adds a new **money addition** flow to Rizqly so users can record salary, transfers received, cash deposits, refunds, gifts, pocket money, goal contributions, and other balance-increasing events with the same speed and clarity currently used for expenses.

The feature should not be implemented as a separate module that competes with expenses. Instead, Rizqly should move toward a **central transaction model** where:

- **Expenses** decrease balance
- **Money additions** increase balance
- Both appear in one transaction history, one dashboard model, and one receipt-scanning pipeline

### How It Differs From the Existing Expense Feature

The current expense feature is optimized for logging money out. The new feature expands that behavior to support money in while preserving the same principles:

- fast entry
- minimal fields
- intelligent defaults
- natural-language assistance
- strong mobile ergonomics

Key difference:

- Expense entry answers: "Where did my money go?"
- Money addition entry answers: "Where did my money come from?"

### Product Outcome

After this feature is shipped, Rizqly becomes a more complete personal finance tracker:

- users can explain both inflow and outflow
- dashboard metrics can show net cash flow, not just spending
- receipt scanning can classify documents into income or expense automatically
- bank balance changes become easier to reconcile
- per-bank balance = income credited to that account minus expenses paid from it

---

## 2. User Workflows

### 2.1 Manual Money/Income Entry

#### Primary Flow

1. User taps the existing floating action button.
2. User sees a compact action sheet:
   - Add Expense
   - Add Money
   - Scan Receipt
3. User chooses **Add Money**.
4. A fast-entry modal opens with prefilled defaults:
   - transaction type = `income`
   - date = today
   - account = last used account
   - category suggestions = Salary, Freelance / Gig, Creator Income, Resale / Flip, Transfer, Cash Deposit, Refund, Gift, Pocket Money / Allowance, Prize / Win, Crypto / Investment, Paid Back, Other
5. User selects a bank from the same horizontal bank selector used in Add Expense (Meezan, HBL, UBL, MCB, JazzCash, Easypaisa, SadaPay, NayaPay, Cash).
6. User enters amount and optional description.
7. User submits.
8. The ledger updates immediately with optimistic UI.
9. If income is above a threshold (e.g. > Rs. 20,000) and category is Salary or Freelance, a brief celebration animation fires.
10. Dashboard balance, net flow, and recent transactions refresh.

#### Speed Variant

For repeated behavior, the app supports a one-line natural input similar to the current expense parser. The parser should handle both structured and conversational input:

**Structured:**
```
1500 in UBL salary
8000 freelance meezan
50000 salary jazzcash
2500 refund to easypaisa
```

**Conversational (Gen-Z phrasing):**
```
boss paid me 15k
got paid for that design gig
salary finally came through lol
received 2k from Ahmed jazzcash
freelance payment 8000 meezan
50k dropped in meezan 🙏
```

The system parses:

- amount
- source description
- destination bank account (using the same BANK_KEYWORDS as the expense parser)
- probable income category

If amount is missing, prompt: "How much? 💸"
If bank is missing, default to last used account.

If confidence is high, the user can confirm in one tap.

### 2.2 Receipt Scanning and Automatic Detection

#### Primary Flow

1. User taps **Scan Receipt** from the same centralized action entry point.
2. User uploads or captures an image.
3. The app runs OCR and document parsing.
4. The parser extracts:
   - merchant or issuer
   - date
   - amount(s)
   - keywords indicating payment, refund, deposit, transfer, salary, cash-in, bill payment, etc.
5. The classification engine predicts:
   - transaction type = `income`, `expense`, or `mixed`
   - suggested category
   - confidence score
6. The review screen shows:
   - detected type
   - primary amount
   - detected account or payment rail if present
   - category suggestion
   - line items when available
7. User confirms or edits before saving.
8. The transaction is stored and linked to the receipt asset.

### 2.3 How the System Determines Income vs Expense

The system should use a layered decision model rather than a single rule.

#### Signal Groups

- **Document keywords**
  - Income signals: `salary credited`, `received`, `refund`, `cash deposit`, `transfer received`, `credited`, `profit payout`, `bonus`
  - Expense signals: `paid`, `purchase`, `debit`, `bill`, `checkout`, `invoice total`, `tax`, `order total`
- **Issuer or merchant type**
  - Payroll provider, bank deposit slip, wallet cash-in screen, refund notice, remittance confirmation
- **Amount direction language**
  - `credited to`, `received in`, `transferred to you` indicates income
  - `paid via`, `debited from`, `purchase at` indicates expense
- **Document structure**
  - Deposit slips and transfer confirmations differ structurally from store receipts
- **Existing account context**
  - If the image resembles a bank or wallet credit confirmation tied to a user account, bias toward income

#### Classification Rules

- If income confidence is high and expense confidence is low, classify as `income`
- If expense confidence is high and income confidence is low, classify as `expense`
- If both appear strongly, classify as `mixed`
- If neither is reliable, classify as `unknown` and require user confirmation

#### Mixed Receipt Examples

- item purchase plus cashback
- purchase plus refund line
- bank statement snippet with both debit and credit rows
- marketplace settlement receipt showing sale amount minus fee

For mixed documents, the user should be prompted to split the receipt into multiple transactions before save.

### 2.4 Per-Bank Income Tracking

When income is added, it must be attributed to a specific bank account — the same way expenses are debited from a bank. This is the same `bank_account: string` field convention already used in expenses.

- **Natural language:** `"1500 in UBL"` → credits UBL; `"50k salary meezan"` → credits Meezan Bank
- **Structured entry:** bank selector in AddMoneyModal mirrors QuickExpenseInput's horizontal scrollable bank list — same banks, same emoji, same colors
- **Parser:** extend existing `BANK_KEYWORDS` in `utils/expenseParser.ts` into a shared `transactionParser` that works for both directions; do not duplicate the keyword map
- **Per-bank balance formula:**
  ```
  balance(bank) = SUM(income where bank_account = bank) - SUM(expenses where bank_account = bank)
  ```
- **Default:** if no bank is specified, attribute to last used account (same behavior as expenses)

Supported bank keywords (reused from existing parser):

| Keyword | Bank Name |
|---------|-----------|
| meezan | Meezan Bank |
| hbl, habib | HBL |
| ubl | UBL |
| mcb | MCB |
| jazzcash, jazz cash | JazzCash |
| easypaisa | Easypaisa |
| sadapay, sada pay | SadaPay |
| nayapay, naya pay | NayaPay |
| cash | Cash |

---

## 3. Core Functionality

### 3.1 Money/Income Input Methods

The feature should support four entry methods:

1. **Manual structured entry**
   - amount
   - category
   - bank account (same horizontal selector as expense entry)
   - date
   - notes
2. **Natural-language quick entry**
   - extend the current `expenseParser` pattern into a generalized transaction parser
   - support conversational phrasing alongside structured input
   - map parsed bank keyword to bank name using the shared `BANK_KEYWORDS` map

   Examples:
   ```
   "1500 in UBL salary"       → Salary, 1500, UBL
   "8000 freelance meezan"    → Freelance, 8000, Meezan Bank
   "boss paid me 15k"         → Salary, 15000, last used account
   "received 2k from Ahmed"   → Paid Back, 2000, last used account
   "salary finally dropped"   → Salary, prompts for amount
   ```

3. **Receipt scan from camera**
4. **Receipt upload from gallery/files**

### 3.2 Receipt Upload and Scanning Logic

#### Pipeline

1. Upload image
2. Normalize image
   - crop
   - rotate
   - contrast cleanup
3. OCR extraction
4. Field extraction
5. Transaction classification
6. Category suggestion
7. User review
8. Save transaction and receipt metadata

#### Parsing Outputs

Each scan should produce a normalized payload:

```ts
type ParsedReceiptTransaction = {
  direction: "income" | "expense" | "mixed" | "unknown";
  amount: number | null;
  currency: string;
  date: string | null;
  description: string | null;
  category: string | null;
  sourceName: string | null;
  destinationAccount: string | null;
  confidence: number;
  extractedText: string;
  lineItems?: Array<{
    label: string;
    amount: number;
    direction?: "income" | "expense";
  }>;
};
```

### 3.3 Data Processing

#### Amount Recognition

The parser should:

- extract the most probable total amount
- detect multiple amounts such as subtotal, tax, discount, cashback, net payout
- prefer labeled totals like `total`, `credited amount`, `net received`, `amount paid`
- retain raw OCR text for reprocessing and debugging

#### Category Recognition

The system should use:

- keyword mapping
- merchant/source heuristics
- user history
- account context
- transaction direction

Example:

- `salary credited` → `Salary`
- `refund issued` → `Refund`
- `bank transfer received` → `Transfer In`
- `cash deposit` → `Cash Deposit`
- `freelance payment` → `Freelance / Gig`
- `youtube earnings` → `Creator Income`
- `sold on OLX` → `Resale / Flip`
- `pocket money` → `Pocket Money / Allowance`
- `POS purchase` → expense category

#### Transaction Type Recognition

Introduce a classifier that outputs direction first, then category. Direction must be resolved before category because the same words can mean different things depending on flow.

Example:

- `transfer` could be `Transfer In` or `Transfer Out`
- `adjustment` could be a refund or a fee

### 3.4 Integration Points

#### Existing Expense Feature

The new flow should reuse as much of the expense infrastructure as possible:

- same floating action entry point
- same account selector (same horizontal bank list, same BANK_KEYWORDS)
- same date picker patterns
- same optimistic mutation behavior
- same recent activity list

#### Dashboard

The dashboard should evolve from a spend-only view into a **cash-flow overview**. The primary home screen number should be a single net growth card:

```
This month: +Rs. 12,000  ↑ vs last month
```

Tapping reveals the detailed breakdown:

- income this month
- expenses this month
- net flow this month
- current balance per bank
- recent transactions
- top expense categories
- top income sources

This is more emotionally resonant for Gen-Z than a side-by-side income/expense table.

#### Goals

Money additions should optionally support:

- direct contribution to goal
- source tagging such as `salary -> emergency fund`

This should be optional in v1, but the data model should support it.

#### Banks and Accounts

Money additions must update the same account-level balance logic used by expenses. A transfer into a bank or wallet should appear as a positive movement linked to that account. Per-bank balance is computed as income credited minus expenses debited for that account.

---

## 4. User Interface Considerations

### Design Principles

- keep entry actions centralized
- avoid introducing a second navigation branch just for income
- default to the fastest likely action
- preserve the mobile-first interaction style already used in Rizqly
- every income event should feel good — celebrate money coming in, not just track it

### Recommended UI Placement

#### Centralized Transaction Hub

Use the existing home and bottom navigation model, but make transaction creation more explicit:

- retain one primary action button
- expose three creation paths from that button:
  - Add Expense
  - Add Money
  - Scan Receipt

This avoids cluttering the main nav with separate expense and income tabs.

#### Unified Transaction Feed

Replace isolated expense-only lists with a ledger feed that visually differentiates:

- income with positive styling and green accent
- expenses with negative styling
- mixed or unresolved scanned transactions with a review badge

#### Review Screen for Scans

The review screen should be optimized for quick confirmation:

- large detected amount
- segmented control for `Income` / `Expense` / `Split`
- editable category chip
- account selector (same bank list)
- save button fixed to bottom

#### Filters Instead of Separate Screens

On history and dashboard pages, users should filter by:

- All
- Income
- Expenses
- Scanned
- Account / Bank
- Category

This keeps the app centralized and avoids parallel information architecture.

### 4.5 Gen-Z Emotional Moments

#### Salary Drop Celebration

When income exceeding a threshold (e.g. > Rs. 20,000) is logged and categorized as Salary or Freelance:

- brief confetti/particle burst animation on submission (Framer Motion)
- home screen shows a `"Salary dropped 💰"` banner card for 24 hours
- net balance card briefly highlights in `var(--accent-lime)`

This makes logging income feel rewarding rather than administrative.

#### Income Milestone Badges

Surface a dismissable badge on the home screen when milestones are hit:

- `"First salary logged 🎓"` — first time Salary category is used
- `"3 months of freelance income 🔥"` — consecutive months with a Freelance entry
- `"Best month ever 📈"` — current month income exceeds all prior months
- `"First Rs. 100k month 💎"` — total income in a month crosses 100,000

#### Income Streaks

Track consecutive months in which at least one income entry was logged. Display streak count next to income total on the dashboard.

### 4.6 Net Growth Dashboard Card

The primary number shown on the home screen should be a single net flow card rather than two separate totals:

```
This month
+Rs. 12,000
↑ 8% vs last month
```

Tapping the card expands into income vs expense breakdown. This is the number Gen-Z actually cares about — am I going up or down? — and it is more emotionally legible than a data table.

---

## 5. Data Structure

### Recommended Model Shift

The cleanest implementation is to introduce a new `Transaction` model and gradually migrate expense functionality to it.

#### Proposed Transaction Schema

```ts
interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  direction: "income" | "expense";
  amount: number;
  description: string;
  bank_account: string;         // Bank NAME string — matches existing Expense convention
                                // e.g. "Meezan Bank", "UBL", "JazzCash", "Cash"
                                // Per-bank balance = SUM(income) - SUM(expenses) for that name
  accountId: string | null;     // Reserved for future ID-based reference
  category: string;
  date: string;                 // YYYY-MM-DD
  sourceType: "manual" | "natural_language" | "receipt_scan" | "system";
  receiptId: string | null;
  rawInput: string;
  scanConfidence: number | null;
  scanStatus: "none" | "detected" | "confirmed" | "needs_review";
  relatedGoalId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

`bank_account` uses the same string-name convention as the existing `Expense` model so that per-bank balance computation works uniformly across both collections during the rollout phase:

```ts
// Per-bank balance
const incomeTotal = await Transaction.aggregate([
  { $match: { userId, direction: "income", bank_account: bankName } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
]);
const expenseTotal = await Expense.aggregate([
  { $match: { userId, bank_account: bankName } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
]);
const balance = (incomeTotal[0]?.total ?? 0) - (expenseTotal[0]?.total ?? 0);
```

#### Receipt Metadata Schema

```ts
interface IReceiptDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  fileUrl: string;
  mimeType: string;
  extractedText: string;
  detectedDirection: "income" | "expense" | "mixed" | "unknown";
  confidence: number;
  status: "processed" | "needs_review" | "failed";
  transactionIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Relationship to Existing Expense Data

#### Recommended Rollout

Phase 1 should avoid a risky full migration on day one.

1. Keep the existing `Expense` collection operational.
2. Add `Transaction` for new development.
3. Read dashboard data from a combined adapter layer.
4. Migrate expense writes into `Transaction` once stable.
5. Backfill historical expenses into `Transaction` in a background migration.

If the team wants lower short-term scope, an interim solution is to add a parallel `Income` collection. That is simpler to ship but weaker long term because reporting, receipt classification, and net flow logic all become more complex. The recommended direction remains a unified ledger.

---

## 6. Edge Cases

### Split Receipts

Problem:

- one document contains multiple independent transactions

Handling:

- allow user to split a scan into multiple saves
- preserve one parent receipt with multiple child transactions

### Unclear or Missing Amounts

Problem:

- OCR cannot determine the total

Handling:

- mark `needs_review`
- highlight candidate amounts
- require manual amount confirmation before save

### Mixed Income and Expense in One Document

Problem:

- sale settlement, cashback receipt, reversal, or statement snippet includes both directions

Handling:

- classify as `mixed`
- force split flow
- show suggested positive and negative lines separately

### Refunds

Problem:

- refund may refer to reversal of an earlier expense, not independent income

Handling:

- store as `income` with category `Refund`
- optionally support linking to original expense in later versions

### Internal Transfers

Problem:

- user moves money from one owned account to another

Handling:

- do not count as true income or expense in reporting
- support later extension for `direction = transfer`
- in v1, if transfer receipts are scanned, ask whether this is external money in or internal movement

### Duplicate Scans

Problem:

- user uploads the same receipt twice

Handling:

- hash image plus extracted text plus amount/date heuristics
- warn user about possible duplicate before save

### Currency Ambiguity

Problem:

- OCR sees symbols without clear locale

Handling:

- default to app currency
- allow user override on review screen

### Low-Quality Images

Problem:

- blurred, cropped, dark, or angled receipts

Handling:

- add image quality checks before OCR
- prompt recapture if text confidence is too low

---

## 7. Technical Considerations

### 7.1 Backend and Service Layer

The current codebase has expense-focused services and routes such as:

- `services/expense.service.ts`
- `app/api/expenses/route.ts`
- `utils/expenseParser.ts`

This feature should introduce transaction-oriented services:

- `services/transaction.service.ts`
- `app/api/transactions/route.ts`
- `utils/transactionParser.ts` — wraps or imports `BANK_KEYWORDS` from `utils/expenseParser.ts`; do not duplicate the keyword map
- `services/receipt.service.ts`

The old expense service can remain as a compatibility layer during rollout.

**Bank keyword reuse:** `transactionParser.ts` must import the `BANK_KEYWORDS` constant from `expenseParser.ts` so that both income and expense NLP use the same bank name resolution. This ensures "meezan" always resolves to "Meezan Bank" in both directions.

### 7.2 OCR and Classification Infrastructure

The receipt pipeline requires:

- image storage
- OCR provider
- text extraction persistence
- classification worker or async job

Recommended architecture:

1. upload receipt
2. store file and metadata
3. enqueue OCR/classification job
4. return processing state
5. update client with parsed result

For fast UX, small receipts can be processed synchronously when latency is acceptable. Larger or low-confidence scans should fall back to async processing.

### 7.3 Performance

Speed is a core product requirement, so:

- keep manual add flows under 2 taps after opening
- use optimistic UI for manual saves
- cache recent categories and recent accounts
- prefill last-used values
- debounce OCR review updates rather than reprocessing on every field edit

### 7.4 Data Quality and Auditability

Store both normalized and raw scan data:

- raw OCR text
- classification confidence
- original image reference
- user-corrected fields

This is necessary for:

- debugging bad classifications
- improving parsing rules
- dispute handling
- future ML tuning

### 7.5 Reporting Implications

Once income exists, existing charts and insights need adjustment:

- spending-only charts should remain available as a drill-down
- the primary home screen metric is net flow (income minus expenses), not spending total
- streak and behavioral features must avoid treating money additions as spending events
- per-bank balance must aggregate both income and expense transactions for that bank

### 7.6 Security and Privacy

Receipts can contain sensitive financial data. The implementation should:

- scope receipt access by authenticated user only
- avoid exposing raw OCR text across users
- define file retention policy
- support deletion of attached receipts with transaction deletion rules

---

## 8. Implementation Recommendation

### V1 Scope

Ship the smallest complete version that changes user value quickly:

- manual Add Money flow with bank selector (same horizontal list as Add Expense)
- per-bank income attribution via NLP and structured entry
- unified transaction feed UI
- transaction API and model (with `bank_account` field)
- receipt upload
- OCR extraction
- direction classification: income vs expense vs needs review
- review-and-confirm screen
- dashboard net growth card (`This month: +Rs. X ↑ vs last month`)
- salary drop celebration animation (Framer Motion confetti on large income saves)
- income categories: Salary, Freelance / Gig, Creator Income, Resale / Flip, Transfer, Cash Deposit, Refund, Gift, Pocket Money / Allowance, Prize / Win, Crypto / Investment, Paid Back, Other

### V2 Scope

- income streaks (consecutive months with income logged)
- income milestone badges (first salary, 3-month freelance streak, best month ever)
- per-bank balance view showing income credited minus expenses debited per account
- split transaction flow for mixed documents
- internal transfer support
- goal-linked money additions
- duplicate detection

### V3 Scope

- automatic reconciliation against account balances
- linking refunds to original expenses
- smarter classification models and merchant/source memory
- user-history-based category learning

---

## 9. Open Questions for Build Planning

- Should salary and transfers be seeded as default income categories alongside expense categories?
- Should internal account transfers be supported in the same release or deferred?
- Does the dashboard home card show one net balance number first, or separate income and expense totals first? (Recommendation: net number first, breakdown on tap)
- Should receipt scanning be available to all users or gated behind a premium tier?
- What threshold triggers the salary drop celebration — Rs. 20,000 or user-configurable?

---

## 10. Final Recommendation

Rizqly should implement this feature as a **unified transaction system**, not as a separate income-only branch. That decision keeps the product centralized, simplifies dashboard logic, and makes receipt scanning materially more useful because every uploaded financial document can flow through the same classification and review pipeline.

The bank account attribution model should reuse the existing `bank_account: string` convention from the `Expense` model so that per-bank balance computation requires no schema migration: balance equals income credited to a bank minus expenses paid from the same bank.

The product layer must feel Gen-Z — salary drops should spark confetti, income streaks should feel like streaks, and the home screen should answer "am I growing?" with one number, not a finance report.

If implemented this way, the app becomes faster to use, easier to understand, and significantly more complete as a daily financial tracking product.
