# Rizqly — Production SaaS Roadmap 2026

> **Prepared:** March 2026
> **Stack Snapshot:** Next.js 16 · React 19 · MongoDB Atlas · NextAuth.js · Mongoose · Framer Motion
> **Target Market:** Gen Z (18–28), Pakistan-first with regional expansion potential

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Critical Security & Infrastructure Gaps](#2-critical-security--infrastructure-gaps)
3. [Production-Ready Requirements](#3-production-ready-requirements)
4. [Feature Roadmap](#4-feature-roadmap)
5. [Platform Architecture for Scale](#5-platform-architecture-for-scale)
6. [Go-to-Market as a SaaS](#6-go-to-market-as-a-saas)
7. [Sprint Planning Guide](#7-sprint-planning-guide)
8. [Technical Hiring Plan](#8-technical-hiring-plan)

---

## 1. Current State Assessment

### What's Working Well

| Area | Status | Notes |
|------|--------|-------|
| Authentication | Solid | Google OAuth via NextAuth, session callback auto-creates Profile |
| Database Models | Good foundation | User, Expense, Category, Bank, Goal, Budget schemas defined |
| Mobile UI | Strong | Glass morphism, Framer Motion, thumb-first design, Gen-Z aesthetic |
| NLP Expense Parser | Differentiator | Parses "500rs biryani from meezan" — standout feature |
| Offline Fallback | Present | localStorage sync with optimistic updates |
| API Layer | Functional | CRUD endpoints for expenses, categories, profile, banks |
| Build Config | Ready | Standalone output mode for containerization |

### What Exists But Is Incomplete

| Feature | Schema | API | UI |
|---------|--------|-----|-----|
| Goals | ✅ | ❌ | ❌ |
| Budget limits | ✅ | ❌ | ❌ |
| Bank management | ✅ | Partial | Minimal |
| Onboarding flow | ❌ | ❌ | Placeholder |
| Desktop dashboard | ❌ | ❌ | ❌ |
| Notifications | ❌ | ❌ | ❌ |

### Architecture Strengths

- **Serverless-ready**: Next.js API routes scale independently
- **Connection pooling**: Mongoose global cache prevents Atlas connection exhaustion
- **Optimistic UI**: Zero-lag perceived performance for expense adds
- **Type safety**: TypeScript throughout with strict mode

### Technical Debt Inventory

1. **Exposed credentials in `.env.local`** — MongoDB URI, OAuth secrets are hardcoded with real values in the repo (CRITICAL — see Section 2)
2. **No input validation** — API routes accept raw `req.body` without schema validation (Zod/Joi missing)
3. **TypeScript errors suppressed** — `next.config.ts` has `ignoreBuildErrors: true`
4. **No rate limiting** — All API endpoints are open to abuse
5. **No error boundaries** — Client crashes will show blank screens
6. **Goals/Budget schemas** — Defined but orphaned; no business logic layer
7. **Seed endpoint exposed** — `/api/seed` has no auth guard (can wipe/seed any user's data)
8. **NEXTAUTH_SECRET** is a weak placeholder string

---

## 2. Critical Security & Infrastructure Gaps

> **These must be fixed BEFORE any public launch. Non-negotiable.**

### 🔴 P0 — Fix Immediately

#### 2.1 Secret Rotation & Environment Management

The `.env.local` file contains live production credentials committed to the repo context. This is a security incident.

**Action items:**
```bash
# Immediately rotate:
# 1. MongoDB Atlas password (create new user, revoke old)
# 2. Google OAuth client secret (regenerate in Google Cloud Console)
# 3. Generate cryptographically strong NEXTAUTH_SECRET:
openssl rand -base64 32
```

Use a secrets manager going forward:
- **Development**: `.env.local` (never commit), use `.env.example` with dummy values
- **Staging/Production**: Vercel Environment Variables, AWS Secrets Manager, or Doppler

#### 2.2 API Route Authorization

Every API route must verify the session and scope data to the authenticated user:

```typescript
// Current (unsafe) pattern:
const { userId } = req.body  // user can pass any userId

// Required pattern:
const session = await getServerSession(authOptions)
if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' })
const userId = session.user.id  // always from session, never from client
```

Audit all routes: `/api/expenses`, `/api/categories`, `/api/profile`, `/api/banks`, `/api/seed`

#### 2.3 Remove or Guard the Seed Endpoint

`/api/seed` must be either deleted in production or protected behind an admin check + secret token. This endpoint can destroy user data.

#### 2.4 Input Validation

Add Zod validation to all API routes:

```bash
npm install zod
```

```typescript
import { z } from 'zod'

const ExpenseSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  description: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bank_account: z.string().optional(),
})
```

#### 2.5 Rate Limiting

Install and configure rate limiting before any public traffic:

```bash
npm install @upstash/ratelimit @upstash/redis
# or for simpler setup:
npm install express-rate-limit  # works with Next.js middleware
```

Apply to:
- `/api/expenses` — 60 req/min per user
- `/api/auth/*` — 10 req/min per IP
- `/api/seed` — DELETE entirely

### 🟠 P1 — Fix Before Beta Launch

#### 2.6 MongoDB Atlas Network Access

- Restrict Atlas IP whitelist to your deployment IP ranges (not 0.0.0.0/0)
- Enable Atlas audit logs
- Create separate DB users per environment (dev/staging/prod) with minimal permissions

#### 2.7 HTTPS & Security Headers

Add to `next.config.ts`:

```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; img-src 'self' data: https:;"
  },
]
```

#### 2.8 Fix TypeScript Suppression

Remove `ignoreBuildErrors: true` from `next.config.ts` and fix all type errors. Type safety is your first line of defense against runtime crashes in production.

---

## 3. Production-Ready Requirements

### 3.1 Database Architecture

#### Current State
Single MongoDB Atlas cluster, no indexing strategy, no sharding plan.

#### Required Improvements

**Indexes to add immediately** (add to models.ts):

```typescript
// Expense model
ExpenseSchema.index({ userId: 1, date: -1 })        // dashboard queries
ExpenseSchema.index({ userId: 1, category: 1 })      // category breakdowns
ExpenseSchema.index({ userId: 1, createdAt: -1 })    // recent transactions

// Profile model
ProfileSchema.index({ userId: 1 }, { unique: true }) // already unique, verify index exists

// Goal model
GoalSchema.index({ userId: 1, completed: 1 })
```

**Data retention policy:**
- Implement soft deletes (`isDeleted: boolean`) instead of hard deletes
- Retain expense history indefinitely for free tier (core value prop)
- Add `archivedAt` for data older than 3 years (move to cold storage tier)

**Backup strategy:**
- Enable MongoDB Atlas continuous backups (point-in-time recovery)
- Daily snapshots retained for 7 days (free tier), 30 days (paid)
- Monthly snapshots retained for 1 year
- Test restore procedure quarterly

#### Multi-Tenancy Readiness
Current architecture is already implicitly multi-tenant via `userId` scoping. Verify every query includes userId filter — this is your tenant isolation boundary.

### 3.2 Authentication & Authorization

#### Current: Google OAuth only

**Extend to:**
- Email/password with bcrypt (many Pakistani users don't want Google dependency)
- Phone number + OTP (critical for Pakistan market: JazzCash, Easypaisa users)
- Apple Sign-In (required for iOS App Store compliance)

**Authorization layers to add:**

```typescript
// Role-based access (for future admin/support tooling)
type UserRole = 'user' | 'premium' | 'admin'

// Subscription check middleware
export function requirePremium(handler: NextApiHandler) {
  return async (req, res) => {
    const session = await getServerSession(authOptions)
    const profile = await Profile.findOne({ userId: session.user.id })
    if (profile.subscription_tier === 'free' && isPremiumRoute(req.url)) {
      return res.status(403).json({ error: 'Upgrade required' })
    }
    return handler(req, res)
  }
}
```

### 3.3 API Design for Scale

**Current:** REST with Next.js API routes
**Recommended:** Maintain REST but add structure

**Versioning:**
```
/api/v1/expenses      ← add versioning before public launch
/api/v1/categories
/api/v1/profile
```

**Consistent response envelope:**
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    page?: number
    total?: number
    cursor?: string
  }
}
```

**Pagination** (critical before scale):
```typescript
// GET /api/v1/expenses?limit=20&cursor=<last_id>
const expenses = await Expense.find({ userId })
  .sort({ createdAt: -1 })
  .limit(limit + 1)  // fetch one extra to determine hasMore
  .skip(cursor ? 0 : offset)
```

### 3.4 Error Handling & Observability

**Logging** — Add structured logging:
```bash
npm install pino pino-pretty
```

```typescript
import pino from 'pino'
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

// In every API route:
logger.error({ userId, route: req.url, error: err.message }, 'API error')
```

**Error monitoring** — Add Sentry (free tier is sufficient for MVP):
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Health check endpoint:**
```typescript
// /api/health
export default async function handler(req, res) {
  const dbStatus = await checkMongoConnection()
  res.json({
    status: dbStatus ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  })
}
```

**Uptime monitoring:** Use Better Uptime or UptimeRobot (free) pinging `/api/health` every 60 seconds.

### 3.5 Performance Requirements

**Target metrics for launch:**
- Time to First Byte (TTFB): < 200ms
- Largest Contentful Paint (LCP): < 1.5s on mobile
- API response times: < 100ms p50, < 500ms p99
- Dashboard load (cold): < 2s

**Optimizations needed:**
1. Add `React.Suspense` boundaries with skeleton loaders
2. Implement React Query or SWR for client-side caching and deduplication
3. Add MongoDB field projections (only fetch fields you render)
4. Enable Next.js Image optimization for avatars
5. Move heavy Framer Motion animations to `transform` only (GPU-accelerated)

---

## 4. Feature Roadmap

### Priority Tiers

- **Must-Have (Launch Blockers):** Without these, the app cannot go live
- **High Value (Sprint 1–3):** Core differentiation, directly drives retention
- **Growth Features (Sprint 4–8):** Drives paid conversion and viral growth
- **Future Roadmap (Post-PMF):** Build after finding product-market fit

---

### 4.1 Must-Have for Launch

#### Complete Goals UI
The Goal schema is defined but has zero UI. Goals are the #1 retention mechanic for Gen Z.

```
Goal screen components needed:
- GoalCard (progress bar, emoji, days remaining)
- CreateGoalModal (name, target amount, deadline, emoji picker)
- GoalCompletionCelebration (confetti animation)
- GoalsList with filter (active/completed)
```

#### Complete Budget System
BudgetSchema exists but has no business logic.

```
Budget features needed:
- Set monthly spending limits per category
- Real-time budget vs. actual comparison
- Visual "danger zone" when >80% of budget used
- Budget alerts (push notification when near limit)
```

#### Onboarding Flow
Critical for activation. Without it, new users bounce.

```
Screens:
1. Welcome + value prop (swipe)
2. "What's your vibe?" (spending personality quiz)
3. Set your monthly income
4. Pick your categories
5. Connect bank (optional, skip-able)
6. First expense capture (interactive tutorial)
```

#### Desktop Dashboard
Per CLAUDE.md, this is a required deliverable. Build after mobile is stable.

### 4.2 High-Value Features (Sprint 1–3)

#### AI Expense Insights

The NLP parser is already built — extend it to generate insights:

```typescript
// Weekly digest generation
interface WeeklyInsight {
  topCategory: string
  changeVsLastWeek: number   // +15% or -8%
  unusualSpend: Expense[]    // outlier detection
  savingTip: string          // "You spent 3x on food this week"
  predictedMonthEnd: number  // projected total based on pace
}
```

Use Claude API for natural language insight generation:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic()

const insight = await client.messages.create({
  model: 'claude-haiku-4-5-20251001',  // fast + cheap for insights
  max_tokens: 150,
  messages: [{
    role: 'user',
    content: `User spent PKR ${totalSpent} this week. Top category: ${topCategory}.
              Generate a 1-sentence friendly Gen Z insight about their spending.`
  }]
})
```

**Why:** AI insights are the #1 reason Gen Z users cite for staying with finance apps. It makes the app feel like a companion, not a spreadsheet.

#### Recurring Expense Detection

Automatically detect and tag recurring expenses (Netflix, rent, subscriptions):

```typescript
// Algorithm: find expenses with same description within ±3 days monthly
async function detectRecurring(userId: string) {
  const expenses = await Expense.find({ userId }).sort({ date: 1 })
  // Group by normalized description, check monthly interval
  // Return candidates for user confirmation
}
```

#### Export & Share

- CSV export (power users, tax filing)
- WhatsApp-shareable monthly summary card (viral mechanic for Pakistan)
- Instagram story format for "my month in spending" (Gen Z engagement)

#### Multi-Currency Support

Pakistan-first (PKR), but prepare for UAE dirhams, USD for diaspora users:

```typescript
// Add to Expense model:
currency: { type: String, default: 'PKR' }
exchangeRate: { type: Number, default: 1 }
```

### 4.3 Growth Features (Sprint 4–8)

#### Gamification System

**Why:** Gen Z spends 4+ hours/day in apps with game mechanics. Finance apps that gamify see 40% higher 30-day retention.

```typescript
interface Achievement {
  id: string
  name: string        // "Budget Boss", "Saving Streak", "No Spend Day"
  emoji: string
  xpReward: number
  condition: string   // "7 consecutive days under budget"
  unlockedAt?: Date
}

interface UserLevel {
  level: number       // 1-50
  xp: number
  title: string       // "Financial Newbie" → "Money Master" → "Rizqly Legend"
  perks: string[]     // Unlock features at higher levels
}
```

**Streaks:**
- "On Budget" streak (days under category limits)
- "No Impulse" streak (no unplanned expenses)
- "Saver" streak (week-over-week reduction)

#### Social Features (Viral Growth)

**Split expenses** (highest-requested feature for Gen Z friend groups):
```typescript
interface Split {
  expenseId: string
  participants: Array<{ userId: string; phone?: string; amount: number; paid: boolean }>
  createdBy: string
  settledAt?: Date
}
```

**Friend spending challenges:**
- "No Coffee for 30 Days" challenge you can invite friends to
- Leaderboard (anonymous) for savings rate
- "Accountability buddy" — share goals (not amounts) with a friend

#### Banking Integration (Open Banking)

**Pakistan-specific APIs to target:**
- **1LINK** — Pakistan's national payment network (ATM/POS)
- **Raast** — SBP's instant payment system (free API for registered fintechs)
- **JazzCash API** — Mobile wallet
- **Easypaisa API** — Mobile wallet

**International (for scale):**
- Plaid (US/UK)
- Salt Edge (Europe/Middle East)
- Lean Technologies (MENA)

**Note:** Banking API integration requires SBP (State Bank of Pakistan) regulatory approval and EMI/PSP licensing. Start with manual import (CSV), automate later.

#### Investment Tracking

Read-only tracking of:
- **Pakistan Stock Exchange (PSX)** portfolio (manual entry initially)
- **Mutual funds** (UBL Funds, MCB Arif Habib API)
- **Gold rates** (live PKR gold price feed)
- **Crypto** (CoinGecko API — free tier)

```typescript
interface Investment {
  userId: string
  type: 'stock' | 'fund' | 'gold' | 'crypto' | 'savings'
  name: string
  units: number
  buyPrice: number
  currency: string
  currentValue?: number   // fetched from external API
}
```

#### AI Budget Automation

```typescript
// Auto-generate budget from 3 months of expense history
async function suggestBudget(userId: string): Promise<Budget[]> {
  const threeMonths = await getExpenseHistory(userId, 90)
  const averages = calculateCategoryAverages(threeMonths)
  return averages.map(cat => ({
    categoryId: cat.id,
    monthly_limit: Math.round(cat.average * 1.1),  // 10% buffer
    suggested: true,
  }))
}
```

#### Push Notifications

**Priority notifications:**
1. Daily spending summary (7pm local time)
2. Budget alert (when 80% of category limit used)
3. Unusual transaction detected
4. Goal milestone reached
5. Weekly digest every Sunday

**Stack:**
```bash
npm install web-push  # for PWA web push
# For native mobile: Expo Notifications (if building React Native)
```

### 4.4 Future Roadmap (Post-PMF)

| Feature | Reason to Wait |
|---------|---------------|
| Credit score tracking | Requires SECP/SBP licensing in Pakistan |
| Bill payment integration | Requires PSP license and bank partnerships |
| Micro-savings automation | Requires banking license (regulated activity) |
| Peer-to-peer lending | Heavy regulation, needs Series A+ to navigate |
| Tax filing integration | FBR API access requires enterprise agreement |
| React Native mobile app | Build after validating PWA engagement metrics |

---

## 5. Platform Architecture for Scale

### 5.1 Current Architecture

```
User → Next.js (Vercel) → MongoDB Atlas
```

Simple, cheap, and correct for 0–10,000 users.

### 5.2 Target Architecture (10K–1M Users)

```
                    ┌─────────────────────────────────┐
                    │         Cloudflare CDN            │
                    │  (DDoS protection, edge caching)  │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      Vercel / AWS ECS             │
                    │   Next.js App (containerized)     │
                    │   Multiple regions: PAK, UAE, EU  │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    ┌─────────▼──────┐  ┌─────────▼──────┐  ┌─────────▼──────┐
    │  MongoDB Atlas  │  │  Upstash Redis  │  │  Queue System  │
    │  (M10+ cluster) │  │  (API cache,    │  │  (BullMQ or    │
    │  Multi-region   │  │   rate limits,  │  │   Inngest for  │
    │  replica set    │  │   sessions)     │  │   background   │
    └────────────────┘  └────────────────┘  │   jobs)        │
                                             └────────────────┘
```

### 5.3 Deployment Strategy

**Phase 1 (MVP → 10K users): Vercel**
- Zero-config deployments
- Edge functions for auth/middleware
- Automatic preview deployments per PR
- Free SSL, global CDN

```bash
# Deploy:
vercel --prod

# Environment variables managed in Vercel dashboard
# Never in code
```

**Phase 2 (10K → 100K users): Add caching layer**
```bash
npm install @upstash/redis ioredis
```

Cache:
- Category lists (rarely change): 1 hour TTL
- Monthly stats (expensive aggregation): 5 minute TTL
- User profile: 15 minute TTL

**Phase 3 (100K → 1M users): Containerize + multi-region**
- Migrate to AWS ECS + ECR (Docker containers)
- Deploy to AWS regions: ap-south-1 (closest to Pakistan), eu-west-1, us-east-1
- MongoDB Atlas global clusters (data residency compliance)
- Implement database read replicas

### 5.4 Database Scaling

**Atlas Tier Progression:**

| Stage | Users | Atlas Tier | Monthly Cost |
|-------|-------|-----------|-------------|
| MVP | 0–1K | M0 (Free) | $0 |
| Beta | 1K–10K | M10 | ~$57 |
| Growth | 10K–100K | M30 | ~$185 |
| Scale | 100K+ | M50+ | $410+ |

**Aggregation pipeline optimization** (for dashboard stats):

```typescript
// Replace N queries with single aggregation
const stats = await Expense.aggregate([
  { $match: { userId: new Types.ObjectId(userId), date: { $gte: startOfMonth } } },
  { $group: {
    _id: '$category',
    total: { $sum: '$amount' },
    count: { $sum: 1 }
  }},
  { $sort: { total: -1 } }
])
```

### 5.5 Payment Processing

For premium subscriptions:

**Pakistan-first:**
- **Stripe** — Cards (international cards work in Pakistan)
- **JazzCash API** — Mobile wallet payments
- **Easypaisa API** — Mobile wallet payments
- **HBL Pay** — Bank transfer integration

**Implementation:**
```bash
npm install stripe
```

```typescript
// Stripe subscription flow
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
  mode: 'subscription',
  success_url: `${APP_URL}/settings?upgrade=success`,
  cancel_url: `${APP_URL}/settings?upgrade=cancelled`,
  metadata: { userId: session.user.id }
})
```

**Webhook handler** for subscription lifecycle events (required):
- `customer.subscription.created`
- `customer.subscription.deleted`
- `invoice.payment_failed`

### 5.6 Analytics & User Behavior

**Product analytics** (understand what users actually do):
```bash
npm install posthog-js  # open source, GDPR-friendly, generous free tier
```

**Events to track:**
```typescript
posthog.capture('expense_added', {
  category: expense.category,
  amount_range: getAmountBucket(expense.amount),  // never log raw amounts
  input_method: 'nlp' | 'manual',
  day_of_week: new Date().getDay(),
})

posthog.capture('goal_created', { emoji: goal.emoji, has_deadline: !!goal.deadline })
posthog.capture('budget_alert_triggered', { category: budget.categoryId })
```

**Dashboards to build:**
- DAU/MAU ratio (target: >0.3 for finance app)
- Expense add rate per user per week
- Feature adoption funnel
- Churn prediction by engagement score

---

## 6. Go-to-Market as a SaaS

### 6.1 Pricing Model

#### Freemium Architecture

**Free Tier — "Rizqly Lite"**
- Unlimited expense tracking (core loop must be free)
- 5 custom categories
- 3-month expense history
- Basic charts
- 1 savings goal

**Premium — "Rizqly Pro" (PKR 499/month or PKR 3,999/year)**
- Unlimited history
- Unlimited categories + goals
- AI insights & spending forecasts
- Budget automation
- CSV/PDF export
- Priority support
- Exclusive themes/avatars

**Why this pricing:**
- PKR 499 ≈ $1.80 USD — accessible for Pakistani Gen Z
- Equivalent to a single Uber ride or coffee
- Annual plan creates 4 months free incentive (drives annual commits)
- Keep core tracking free forever — removing it kills retention

#### Future: "Rizqly Teams" (for student groups, couples, families)
- Shared expense tracking
- Bill splitting with settlement
- PKR 799/month per workspace

### 6.2 User Onboarding & Retention

**Activation funnel targets:**

```
Install → Register → Add first expense → See first insight → Enable notifications
   100%      60%           40%                 25%                  15%
                       ← focus here →
```

The biggest drop is between Register and Add First Expense. Fix this with:

1. **Guided first expense** — App pre-fills a demo expense, user just taps confirm
2. **Instant value** — Show personalized insight after first 3 expenses
3. **Day 1 push** — "Your money is waiting for you" notification if no expense in 24h
4. **Day 7 milestone** — "7-day streak! Here's your first week summary"

**Retention loops:**

| Mechanic | Cadence | Purpose |
|---------|---------|---------|
| Daily spending nudge | Daily 9pm | Re-engagement |
| Weekly digest | Sunday 10am | Habit formation |
| Budget alert | Real-time | Urgency + habit |
| Level up notification | On achievement | Dopamine hit |
| Monthly report | 1st of month | Reflection trigger |

**Referral program:**
- "Give a friend 1 month Pro free" (no cost to you if they don't convert)
- Deep link sharing of monthly spending summaries
- WhatsApp-first sharing (dominant in Pakistan)

### 6.3 Compliance & Regulatory

**Pakistan-specific requirements:**

| Regulation | Applicability | Timeline |
|-----------|--------------|---------|
| SBP EMI License | Required for payment initiation | Before payment features |
| SECP registration | If offering investment features | Before investment tracker |
| PTA compliance | Mobile app distribution | Before Play Store submission |
| FBR NTN | Business tax registration | Before monetization |
| Data Protection Bill 2023 | User data handling | Now (PDPB passed in 2023) |

**Data privacy (critical for trust):**

```typescript
// Privacy-first data model:
// 1. Never store raw bank credentials
// 2. Encrypt sensitive fields at rest:
import crypto from 'crypto'

function encryptField(value: string): string {
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  // ...
}

// 3. Data deletion endpoint (user right to erasure):
// DELETE /api/account — wipes all user data within 30 days
// 4. Data export endpoint (user right to portability):
// GET /api/account/export — returns all user data as JSON
```

**Privacy policy must cover:**
- What data is collected
- How expense data is used (explicitly: not sold to advertisers)
- Bank data handling (read-only, not stored as credentials)
- Third-party services used (MongoDB, Google OAuth, analytics)
- Data deletion process and timeline

### 6.4 Trust Mechanisms

Gen Z users are privacy-conscious. Build trust explicitly:

1. **"Your data, your rules"** section in settings
2. No ads, ever (make this a brand promise)
3. End-to-end encryption badge on expense data
4. Open-source the encryption implementation
5. Annual transparency report (what data you have, what you do with it)
6. Bug bounty program (attracts security researchers, signals confidence)

---

## 7. Sprint Planning Guide

### Phase 0 — Security Sprint (Week 1–2, BLOCKING)

| Task | Priority | Owner |
|------|---------|-------|
| Rotate all secrets (MongoDB, Google OAuth, NextAuth) | P0 | Backend |
| Add session-scoped userId to all API routes | P0 | Backend |
| Remove or guard `/api/seed` | P0 | Backend |
| Add Zod validation to all endpoints | P0 | Backend |
| Add rate limiting middleware | P0 | Backend |
| Fix TypeScript errors (remove ignoreBuildErrors) | P1 | Full-stack |
| Add MongoDB Atlas IP allowlist | P1 | DevOps |
| Add security headers to next.config.ts | P1 | Frontend |

### Phase 1 — Complete Core Product (Weeks 3–6)

| Task | Value | Effort |
|------|-------|--------|
| Build Goals UI (list, create, progress) | High | Medium |
| Build Budget UI (set limits, vs. actual) | High | Medium |
| Build Onboarding flow (6 screens) | High | High |
| Add pagination to expense list | Medium | Low |
| Add Sentry error tracking | High | Low |
| Add PostHog analytics | High | Low |
| API versioning (/api/v1/) | Medium | Low |

### Phase 2 — Desktop Dashboard (Weeks 7–10)

| Component | Description |
|-----------|-------------|
| Navigation | Left sidebar with collapse, keyboard shortcuts |
| Monthly Overview | Large stat cards + trend line chart |
| Category Breakdown | Horizontal bar chart + donut chart |
| Transaction Table | Sortable, filterable, inline edit |
| Goals + Budget | Side-by-side progress view |
| Settings | Profile, subscription, data export |

### Phase 3 — Growth Features (Weeks 11–18)

| Feature | Why Now |
|---------|---------|
| AI insights (Claude API) | Differentiator, drives "wow" moment |
| Push notifications (web push) | Retention 2x with notifications enabled |
| Gamification (levels, streaks) | 40% higher 30-day retention |
| Recurring expense detection | Saves time, increases perceived value |
| Export (CSV, summary card) | Power user retention |
| Referral program | Viral growth loop |

### Phase 4 — Monetization (Weeks 19–24)

| Task | Dependency |
|------|-----------|
| Stripe subscription integration | Phase 3 complete |
| Premium feature gates | Stripe webhooks working |
| Upgrade prompts (non-intrusive) | Analytics showing usage patterns |
| Annual plan discount | Stripe product catalog |
| Pakistan payment methods (JazzCash) | Business bank account in Pakistan |

---

## 8. Technical Hiring Plan

### Current Gap Analysis

The codebase is built by (likely) 1 engineer. To ship the full roadmap, you need:

### Immediate Hires (Before Beta)

**Full-Stack Engineer (Next.js + MongoDB)**
- Owns Goals/Budget feature completion
- Builds desktop dashboard
- Implements API pagination and validation
- Skills: TypeScript, Next.js App Router, MongoDB aggregations, Tailwind

**Designer (Product/UX)**
- Desktop dashboard design
- Onboarding flow
- Achievement/gamification system design
- Skills: Figma, mobile-first, Gen Z aesthetic, dark mode systems

### Growth Hires (Post-Beta)

**Mobile Engineer (React Native / Expo)**
- Converts PWA to native mobile app
- Implements push notifications
- Manages App Store / Play Store submissions
- Skills: Expo, React Native, iOS/Android deployment

**Backend/Platform Engineer**
- Banking API integration research
- Redis caching layer
- Background job system (notifications, insights generation)
- Skills: Node.js, Redis, queue systems, financial APIs

### Future Hires (Post-Revenue)

**ML/Data Engineer** — Personalized insights, anomaly detection, budget forecasting
**Security Engineer** — Pen testing, compliance (SBP licensing), security audits
**Product Manager** — User research, roadmap prioritization, Gen Z behavior analysis
**Growth/Marketing** — Pakistan-specific user acquisition, university outreach, influencer partnerships

---

## Appendix: Key Metrics to Track at Each Stage

| Stage | North Star Metric | Supporting Metrics |
|-------|------------------|-------------------|
| MVP (0–1K) | Expenses added per user/week | DAU, onboarding completion rate |
| Beta (1K–10K) | 30-day retention | Weekly active rate, feature adoption |
| Growth (10K–100K) | MAU growth rate | NPS, churn rate, referral rate |
| Scale (100K+) | Revenue per user | LTV, CAC, payback period |

**Target benchmarks for a healthy finance app:**
- 30-day retention: >35%
- DAU/MAU ratio: >0.25
- Expense entries per MAU per month: >15
- Week 4 retention: >20%

---

*This roadmap is a living document. Revisit and reprioritize every 2 sprints based on actual user behavior data from PostHog. Ship fast, measure ruthlessly, iterate.*
