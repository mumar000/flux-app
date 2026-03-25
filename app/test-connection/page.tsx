"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function TestConnectionPage() {
  const { user, loading: authLoading } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test: string, success: boolean, message: string, details?: any) => {
    setTestResults((prev) => [
      ...prev,
      { test, success, message, details, timestamp: new Date().toISOString() },
    ]);
  };

  const runTests = async () => {
    setTestResults([]);
    setTesting(true);

    // Test 1: Authentication Status
    if (authLoading) {
      addResult("Authentication", false, "⏳ Still loading...", null);
    } else if (user) {
      addResult("Authentication", true, `✓ Logged in as ${user.email}`, { userId: user.id });
    } else {
      addResult("Authentication", false, "✗ Not logged in", null);
    }

    // Test 2: Database Connection
    try {
      const res = await fetch("/api/test-connection");
      const data = await res.json();

      if (!res.ok || !data.success) {
        addResult("Database Connection", false, `✗ ${data.error || 'Connection failed'}`, data);
      } else {
        addResult("Database Connection", true, "✓ Successfully connected to MongoDB", data);
        addResult("Expenses Collection", true, `✓ Collection exists (${data.expenseCount || 0} documents)`, data);
      }
    } catch (err: any) {
      addResult("Database Connection", false, `✗ Connection failed: ${err.message}`, err);
    }

    // Test 3: Try to insert and delete a test record via API (if logged in)
    if (user) {
      try {
        const testExpense = {
          amount: 1,
          description: "Test Expense",
          category: "Other",
          bankAccount: "Test",
          rawInput: "test",
        };

        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testExpense),
        });

        const data = await res.json();

        if (!res.ok) {
          addResult("Insert Test", false, `✗ ${data.error}`, data);
        } else {
          addResult("Insert Test", true, "✓ Successfully inserted test record", data);

          // Clean up test record
          if (data?.id) {
            const delRes = await fetch(`/api/expenses?id=${data.id}`, { method: "DELETE" });
            if (delRes.ok) {
                addResult("Cleanup", true, "✓ Test record deleted", null);
            } else {
                addResult("Cleanup", false, "✗ Failed to delete test record", null);
            }
          }
        }
      } catch (err: any) {
        addResult("Insert Test", false, `✗ ${err.message}`, err);
      }
    } else {
      addResult("Insert Test", false, "⏭️ Skipped - not logged in", null);
    }

    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔧 Connection Test</h1>
        <p className="text-white/40 mb-6">
          Debug your MongoDB connection and NextAuth setup
        </p>

        <button
          onClick={runTests}
          disabled={testing}
          className="px-6 py-3 bg-[#CCFF00] text-black font-bold rounded-lg mb-6 disabled:opacity-50"
        >
          {testing ? "Running Tests..." : "Run Tests"}
        </button>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.success
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold">{result.test}</h3>
                <span className="text-xs text-white/40">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className={result.success ? "text-green-400" : "text-red-400"}>
                {result.message}
              </p>
              {result.details && (
                <details className="mt-2">
                  <summary className="text-xs text-white/40 cursor-pointer">
                    Show details
                  </summary>
                  <pre className="mt-2 p-2 bg-black/30 rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {testResults.length === 0 && !testing && (
          <div className="text-center text-white/40 py-12">
            Click "Run Tests" to check your connection
          </div>
        )}

        <div className="mt-8 p-6 bg-white/5 rounded-lg">
          <h2 className="text-xl font-bold mb-4">📋 Common Issues & Solutions</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold text-red-400">
                ✗ Connection failed
              </p>
              <p className="text-white/60">
                → Check your MONGODB_URI environment variable and ensure your IP is whitelisted in MongoDB Atlas.
              </p>
            </div>
            <div>
              <p className="font-bold text-red-400">
                ✗ Not logged in
              </p>
              <p className="text-white/60">
                → Go to <a href="/auth" className="text-[#CCFF00] underline">/auth</a> to log in first
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
