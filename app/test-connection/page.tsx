"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
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

    // Test 1: Environment Variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      addResult("Environment Variables", true, "✓ Supabase URL and Key are configured", { url });
    } else {
      addResult("Environment Variables", false, "✗ Missing Supabase credentials", { url, hasKey: !!key });
      setTesting(false);
      return;
    }

    // Test 2: Authentication Status
    if (authLoading) {
      addResult("Authentication", false, "⏳ Still loading...", null);
    } else if (user) {
      addResult("Authentication", true, `✓ Logged in as ${user.email}`, { userId: user.id });
    } else {
      addResult("Authentication", false, "✗ Not logged in", null);
    }

    // Test 3: Connection Test
    try {
      const { data, error } = await supabase.from("expenses").select("count", { count: "exact", head: true });

      if (error) {
        addResult("Database Connection", false, `✗ ${error.message}`, error);
      } else {
        addResult("Database Connection", true, "✓ Successfully connected to database", data);
      }
    } catch (err: any) {
      addResult("Database Connection", false, `✗ Connection failed: ${err.message}`, err);
    }

    // Test 4: Check if expenses table exists
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .limit(1);

      if (error) {
        if (error.message.includes("relation") || error.message.includes("does not exist")) {
          addResult("Expenses Table", false, "✗ Table doesn't exist. Run the SQL setup!", error);
        } else if (error.message.includes("policy") || error.message.includes("row-level security")) {
          addResult("Expenses Table", false, "✗ RLS policies blocking access. Check policies!", error);
        } else {
          addResult("Expenses Table", false, `✗ ${error.message}`, error);
        }
      } else {
        addResult("Expenses Table", true, `✓ Table exists (${data?.length || 0} rows fetched)`, data);
      }
    } catch (err: any) {
      addResult("Expenses Table", false, `✗ Error: ${err.message}`, err);
    }

    // Test 5: Try to insert a test record (if logged in)
    if (user) {
      try {
        const testExpense = {
          user_id: user.id,
          amount: 1,
          description: "Test Expense",
          category: "Other",
          bank_account: "Test",
          raw_input: "test",
          date: new Date().toISOString().split("T")[0],
        };

        const { data, error } = await supabase
          .from("expenses")
          .insert(testExpense)
          .select()
          .single();

        if (error) {
          addResult("Insert Test", false, `✗ ${error.message}`, error);
        } else {
          addResult("Insert Test", true, "✓ Successfully inserted test record", data);

          // Clean up test record
          if (data?.id) {
            await supabase.from("expenses").delete().eq("id", data.id);
            addResult("Cleanup", true, "✓ Test record deleted", null);
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
          Debug your Supabase connection and database setup
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
                ✗ Database table not found / relation does not exist
              </p>
              <p className="text-white/60">
                → Run the SQL in <code>FIX_DATABASE.sql</code> in your Supabase SQL Editor
              </p>
            </div>
            <div>
              <p className="font-bold text-red-400">
                ✗ Row-level security policy violation
              </p>
              <p className="text-white/60">
                → The RLS policies are blocking access. Run the SQL setup to create proper policies.
              </p>
            </div>
            <div>
              <p className="font-bold text-red-400">
                ✗ Failed to fetch / Network error
              </p>
              <p className="text-white/60">
                → Check if your Supabase project is active and the URL/Key are correct in .env.local
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
