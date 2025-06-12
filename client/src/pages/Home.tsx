import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import HabitsView from "@/components/HabitsView";
import JournalView from "@/components/JournalView";
import ProgressView from "@/components/ProgressView";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Habit, HabitCompletion, UserProgress } from "@shared/schema";
import { updateHabitTargets, calculateCompletionPercentage } from "@/lib/habitUtils";

type View = "habits" | "journal" | "progress";

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("habits");
  const { toast } = useToast();

  // Initialize user data
  const initializeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/initialize");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
  });

  // Fetch user habits
  const { data: habits, isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Fetch today's completions
  const { data: todayCompletions, isLoading: completionsLoading } = useQuery<HabitCompletion[]>({
    queryKey: ["/api/habits/today"],
  });

  // Fetch user progress
  const { data: progressData, isLoading: progressLoading } = useQuery<{
    progress: UserProgress;
    streaks: any[];
  }>({
    queryKey: ["/api/progress"],
  });

  // Initialize user if no habits exist
  useEffect(() => {
    if (!habitsLoading && habits && habits.length === 0) {
      initializeMutation.mutate();
    }
  }, [habits, habitsLoading]);

  // Update habit targets based on current day
  const updatedHabits = habits && progressData?.progress 
    ? updateHabitTargets(habits, progressData.progress.currentDay)
    : habits || [];

  const completedCount = todayCompletions?.filter(c => c.completed).length || 0;
  const totalHabits = updatedHabits.length;
  const completionPercentage = calculateCompletionPercentage(todayCompletions || [], totalHabits);
  const currentDay = progressData?.progress?.currentDay || 1;
  const currentStreak = progressData?.progress?.currentStreak || 0;
  const bestStreak = progressData?.progress?.bestStreak || 0;

  const showConfetti = () => {
    const container = document.getElementById("confetti-container");
    if (!container) return;

    const colors = ["#FFB800", "#00D4AA", "#2E8BFF", "#FF4444", "#9B59B6"];
    
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.animationDelay = Math.random() * 2 + "s";
      confetti.style.animationDuration = (Math.random() * 2 + 2) + "s";
      
      container.appendChild(confetti);
      
      setTimeout(() => {
        confetti.remove();
      }, 4000);
    }
  };

  const handleCompleteDayClick = () => {
    if (completedCount >= 7) {
      toast({
        title: "🏆 Day Complete!",
        description: "Amazing work today! Keep it up!",
      });
      showConfetti();
    } else {
      const remaining = totalHabits - completedCount;
      toast({
        title: "💪 Almost there!",
        description: `${remaining} more habits to complete the day!`,
      });
    }
  };

  if (habitsLoading || completionsLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-[var(--dark-base)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gradient-bg rounded-full animate-pulse"></div>
          <p className="text-[var(--text-secondary)]">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-[var(--dark-surface)] min-h-screen relative overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="gradient-bg h-full w-full"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 pt-12">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-sora font-bold text-2xl text-[var(--text-primary)]">Rise 66</h1>
            <p className="text-[var(--text-secondary)] text-sm">Day {currentDay} of 66</p>
          </div>
          <div className="neumorphic rounded-full p-3">
            <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{completionPercentage}%</span>
            </div>
          </div>
        </div>
        
        {/* Streak Info */}
        <div className="flex gap-3 mt-4">
          <div className="neumorphic rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-[var(--warning)] text-lg">🔥</span>
            <span className="text-[var(--text-secondary)] text-sm">Current Streak</span>
            <span className="text-[var(--text-primary)] font-bold">{currentStreak}</span>
          </div>
          <div className="neumorphic rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-[var(--success)] text-lg">⭐</span>
            <span className="text-[var(--text-secondary)] text-sm">Best</span>
            <span className="text-[var(--text-primary)] font-bold">{bestStreak}</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="relative z-10 px-6 mb-6">
        <div className="neumorphic rounded-2xl p-1 flex">
          {[
            { key: "habits", label: "Today's Habits" },
            { key: "journal", label: "Journal" },
            { key: "progress", label: "Progress" },
          ].map((tab) => (
            <Button
              key={tab.key}
              onClick={() => setCurrentView(tab.key as View)}
              variant="ghost"
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                currentView === tab.key
                  ? "gradient-bg text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === "habits" && (
              <HabitsView
                habits={updatedHabits}
                completions={todayCompletions || []}
                completedCount={completedCount}
                totalHabits={totalHabits}
              />
            )}
            {currentView === "journal" && (
              <JournalView
                currentDay={currentDay}
                completedHabits={completedCount}
                totalHabits={totalHabits}
                currentStreak={currentStreak}
              />
            )}
            {currentView === "progress" && (
              <ProgressView
                habits={updatedHabits}
                progress={progressData?.progress}
                streaks={progressData?.streaks || []}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleCompleteDayClick}
          className="w-14 h-14 gradient-bg rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 p-0"
        >
          <span className="text-white text-xl">✓</span>
        </Button>
      </div>

      {/* Confetti Container */}
      <div id="confetti-container" className="fixed inset-0 pointer-events-none z-40"></div>
    </div>
  );
}
