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
   - category suggestions = Salary, Transfer, Cash Deposit, Refund, Gift, Freelance, Savings Return, Other
5. User enters amount and optional description.
6. User submits.
7. The ledger updates immediately with optimistic UI.
8. Dashboard balance, net flow, and recent transactions refresh.

#### Speed Variant

For repeated behavior, the app should also support a one-line natural input similar to the current expense parser:

- `50000 salary in meezan`
- `2500 refund to jazzcash`
- `12000 freelance payment received`

The system parses:

- amount
- source description
- destination account
- probable income category

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

---

## 3. Core Functionality

### 3.1 Money/Income Input Methods

The feature should support four entry methods:

1. **Manual structured entry**
   - amount
   - category
   - account
   - date
   - notes
2. **Natural-language quick entry**
   - extend the current `expenseParser` pattern into a generalized transaction parser
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

- `salary credited` maps to `Salary`
- `refund issued` maps to `Refund`
- `bank transfer received` maps to `Transfer In`
- `cash deposit` maps to `Cash Deposit`
- `POS purchase` maps to an expense category

#### Transaction Type Recognition

Introduce a classifier that outputs direction first, then category. Direction must be resolved before category because the same words can mean different things depending on flow.

Example:

- `transfer` could be `Transfer In` or `Transfer Out`
- `adjustment` could be a refund or a fee

### 3.4 Integration Points

#### Existing Expense Feature

The new flow should reuse as much of the expense infrastructure as possible:

- same floating action entry point
- same account selector
- same date picker patterns
- same optimistic mutation behavior
- same recent activity list

#### Dashboard

The dashboard should evolve from a spend-only view into a **cash-flow overview**:

- current balance
- income this month
- expenses this month
- net flow this month
- recent transactions
- top expense categories
- top income sources

#### Goals

Money additions should optionally support:

- direct contribution to goal
- source tagging such as `salary -> emergency fund`

This should be optional in v1, but the data model should support it.

#### Banks and Accounts

Money additions must update the same account-level balance logic used by expenses. A transfer into a bank or wallet should appear as a positive movement linked to that account.

---

## 4. User Interface Considerations

### Design Principles

- keep entry actions centralized
- avoid introducing a second navigation branch just for income
- default to the fastest likely action
- preserve the mobile-first interaction style already used in Rizqly

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

- income with positive styling
- expenses with negative styling
- mixed or unresolved scanned transactions with a review badge

#### Review Screen for Scans

The review screen should be optimized for quick confirmation:

- large detected amount
- segmented control for `Income` / `Expense` / `Split`
- editable category chip
- account selector
- save button fixed to bottom

#### Filters Instead of Separate Screens

On history and dashboard pages, users should filter by:

- All
- Income
- Expenses
- Scanned
- Account
- Category

This keeps the app centralized and avoids parallel information architecture.

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
  accountId: string | null;
  category: string;
  date: string; // YYYY-MM-DD
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
- `utils/transactionParser.ts`
- `services/receipt.service.ts`

The old expense service can remain as a compatibility layer during rollout.

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

- spending-only charts should remain available
- totals must clearly distinguish gross income, expenses, and net flow
- streak and behavioral features must avoid treating money additions as spending events

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

- manual Add Money flow
- unified transaction feed UI
- transaction API and model
- receipt upload
- OCR extraction
- direction classification: income vs expense vs needs review
- review-and-confirm screen
- dashboard updates for income and net flow

### V2 Scope

- split transaction flow for mixed documents
- internal transfer support
- goal-linked money additions
- duplicate detection
- user-history-based category learning

### V3 Scope

- automatic reconciliation against account balances
- linking refunds to original expenses
- smarter classification models and merchant/source memory

---

## 9. Open Questions for Build Planning

- Should salary and transfers be seeded as default income categories alongside expense categories?
- Should internal account transfers be supported in the same release or deferred?
- Does the dashboard home card show one net balance number first, or separate income and expense totals first?
- Should receipt scanning be available to all users or gated behind a premium tier?

---

## 10. Final Recommendation

Rizqly should implement this feature as a **unified transaction system**, not as a separate income-only branch. That decision keeps the product centralized, simplifies dashboard logic, and makes receipt scanning materially more useful because every uploaded financial document can flow through the same classification and review pipeline.

If implemented this way, the app becomes faster to use, easier to understand, and significantly more complete as a daily financial tracking product.
