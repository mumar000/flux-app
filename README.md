# Rizqly 💸 - Personal Finance for Gen Z

The simplest, cleanest way to track your expenses. Rizqly is a modern personal finance app designed with an intuitive, emoji-first interface that makes budgeting fun and addictive.

## 🚀 Tech Stack

*   **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion
*   **Backend**: Next.js API Routes (Serverless)
*   **Database**: MongoDB (via Mongoose)
*   **Authentication**: NextAuth.js (Google OAuth)
*   **Styling & UI**: Tailwind CSS, Geist Typography

## 🛠 Setup & Installation

Follow these steps to run Rizqly locally:

### 1. Clone the repository

```bash
git clone <repository-url>
cd rizqly-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root of your project:

```env
# MongoDB Connection String (from MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rizqly?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_here

# Google OAuth Credentials (for NextAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🧠 Database Schema

Rizqly uses MongoDB with the following collections (mapped via Mongoose):

*   `users`: Managed by NextAuth.js
*   `profiles`: User settings, onboarding status, push notifications
*   `expenses`: Granular tracking of user expenses by amount, category, and bank
*   `categories`: Default and custom expense categorization (with emojis and colors)
*   `banks`: Custom bank lists available to users
*   `goals`, `budgets`: Modules for setting overarching financial targets
