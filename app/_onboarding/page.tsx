"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const onboardingSteps = [
  {
    emoji: "👋",
    title: "Welcome to Rizqly",
    description:
      "Your personal finance companion that makes money management fun and addictive",
  },
  {
    emoji: "💸",
    title: "Track Every Cent",
    description:
      "Add expenses in seconds with emoji categories. No spreadsheets, no hassle.",
  },
  {
    emoji: "📊",
    title: "Beautiful Insights",
    description:
      "See where your money goes with gorgeous visualizations and spending patterns",
  },
  {
    emoji: "🎯",
    title: "Crush Your Goals",
    description: "Set goals, track progress, and level up your financial game",
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  const completeOnboarding = async () => {
    if (user) {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true }),
      });
    }
  };

  const handleNext = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
      router.push("/home");
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.push("/home");
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Skip button */}
      <div className="w-full max-w-md flex justify-end z-10">
        <button
          onClick={handleSkip}
          className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          Skip
        </button>
      </div>

      {/* Swipeable content */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                handleNext();
              }
            }}
            className="w-full text-center px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-8xl mb-8"
            >
              {onboardingSteps[currentStep].emoji}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-4 gradient-text"
            >
              {onboardingSteps[currentStep].title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-lg leading-relaxed"
            >
              {onboardingSteps[currentStep].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="w-full max-w-md space-y-6 z-10">
        {/* Progress indicators */}
        <div className="flex justify-center gap-2">
          {onboardingSteps.map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-gradient-to-r from-purple-600 to-pink-600"
                  : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 active:scale-95"
        >
          {currentStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
        </motion.button>

        {/* Swipe hint */}
        {currentStep < onboardingSteps.length - 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-sm text-gray-500"
          >
            Swipe left to continue →
          </motion.p>
        )}
      </div>
    </div>
  );
}
