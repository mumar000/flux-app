"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  is_default: boolean;
}

interface Bank {
  id: string;
  name: string;
  icon?: string;
}

export default function SettingsPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");
  const [newBankName, setNewBankName] = useState("");

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch categories (user's + default)
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user?.id},is_default.eq.true`);

      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch banks
      const { data: bankData, error: bankError } = await supabase
        .from("banks")
        .select("*")
        .eq("user_id", user?.id);

      // If banks table doesn't exist yet, it might error. We'll handle it.
      if (bankError) {
        console.warn("Banks table might not exist yet, using defaults");
        // Safe to ignore if table doesn't exist, we'll just show empty
        setBanks([]);
      } else {
        setBanks(bankData || []);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCatName || !user) return;
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: newCatName,
          emoji: newCatEmoji,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      setCategories([...categories, data]);
      setNewCatName("");
    } catch (err) {
      alert("Error adding category");
    }
  };

  const deleteCategory = async (id: string, isDefault: boolean) => {
    if (isDefault) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      alert("Error deleting category");
    }
  };

  const addBank = async () => {
    if (!newBankName || !user) return;
    try {
      const { data, error } = await supabase
        .from("banks")
        .insert({
          user_id: user.id,
          name: newBankName,
        })
        .select()
        .single();

      if (error) {
        // Create table if it doesn't exist is not possible here
        // But we can inform the user
        throw error;
      }
      setBanks([...banks, data]);
      setNewBankName("");
    } catch (err) {
      alert(
        "Error adding bank. Make sure the 'banks' table exists in Supabase.",
      );
    }
  };

  const deleteBank = async (id: string) => {
    try {
      const { error } = await supabase.from("banks").delete().eq("id", id);

      if (error) throw error;
      setBanks(banks.filter((b) => b.id !== id));
    } catch (err) {
      alert("Error deleting bank");
    }
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F11]">
        <div className="w-12 h-12 border-4 border-[#CCFF00]/30 border-t-[#CCFF00] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white pb-32">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/budget")}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            ⬅️
          </motion.button>
          <h1 className="text-xl font-bold">Settings</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={signOut}
            className="text-red-400 text-sm font-bold"
          >
            Log Out
          </motion.button>
        </div>
        <p className="text-white/40 text-sm">Personalize your financial flow</p>
      </div>

      <div className="px-6 mt-8 space-y-10">
        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              🏷️ Categories
            </h2>
            <span className="text-[10px] bg-[#CCFF00]/10 text-[#CCFF00] px-2 py-1 rounded-full uppercase font-black">
              {categories.length} total
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-4">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                layout
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    {cat.emoji}
                  </div>
                  <div>
                    <p className="font-bold">{cat.name}</p>
                    {cat.is_default && (
                      <span className="text-[10px] text-white/30 uppercase">
                        System Default
                      </span>
                    )}
                  </div>
                </div>
                {!cat.is_default && (
                  <button
                    onClick={() => deleteCategory(cat.id, cat.is_default)}
                    className="p-2 text-white/20 hover:text-red-400 transition-colors"
                  >
                    🗑️
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Add Category Form */}
          <div className="p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatEmoji}
                onChange={(e) => setNewCatEmoji(e.target.value)}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl text-center text-xl focus:outline-none focus:ring-1 focus:ring-[#CCFF00]"
                placeholder="🍕"
              />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-4 h-12 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#CCFF00] text-sm"
                placeholder="New Category Name..."
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={addCategory}
                className="px-4 h-12 bg-[#CCFF00] text-black font-black rounded-xl text-sm"
              >
                ADD
              </motion.button>
            </div>
          </div>
        </section>

        {/* Banks Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              🏦 Banks & Accounts
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-4">
            <AnimatePresence>
              {banks.map((bank) => (
                <motion.div
                  key={bank.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      💳
                    </div>
                    <p className="font-bold">{bank.name}</p>
                  </div>
                  <button
                    onClick={() => deleteBank(bank.id)}
                    className="p-2 text-white/20 hover:text-red-400 transition-colors"
                  >
                    🗑️
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {banks.length === 0 && (
              <p className="text-white/20 text-center py-4 text-sm bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                No custom banks added yet.
                <br />
                We'll still auto-detect main banks from your text!
              </p>
            )}
          </div>

          {/* Add Bank Form */}
          <div className="p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                className="flex-1 px-4 h-12 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#CCFF00] text-sm"
                placeholder="e.g. My Secret Stash, Meezan..."
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={addBank}
                className="px-4 h-12 bg-[#CCFF00] text-black font-black rounded-xl text-sm"
              >
                ADD
              </motion.button>
            </div>
          </div>
        </section>

        {/* Profile Card */}
        <section className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-6 rounded-[32px] border border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow-2xl">
              👤
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase font-bold tracking-widest">
                Logged in as
              </p>
              <h3 className="text-lg font-black">{user.email}</h3>
            </div>
          </div>
          <div className="h-px bg-white/5 my-4" />
          <p className="text-white/40 text-[10px] leading-relaxed">
            Your data is synced with Supabase. You can access your budget from
            any device.
          </p>
        </section>
      </div>

      {/* Bottom Nav Spacer */}
      <div className="h-10" />
    </div>
  );
}
