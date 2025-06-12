import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Habit, HabitCompletion } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HabitCardProps {
  habit: Habit;
  completion?: HabitCompletion;
  streak?: number;
}

export default function HabitCard({ habit, completion, streak = 0 }: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  const isCompleted = completion?.completed || false;

  const toggleMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      await apiRequest("POST", `/api/habits/${habit.id}/toggle`, {
        completed,
        actualValue: habit.currentTarget,
      });
    },
    onSuccess: (_, completed) => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      
      if (completed) {
        setIsAnimating(true);
        toast({
          title: `🎯 ${habit.displayName} completed!`,
          description: "Great job! Keep building that momentum!",
        });
        
        setTimeout(() => setIsAnimating(false), 600);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = () => {
    toggleMutation.mutate(!isCompleted);
  };

  const getProgressPercentage = () => {
    if (streak === 0) return 0;
    if (streak >= 66) return 100;
    return Math.min(100, (streak / 66) * 100);
  };

  return (
    <motion.div
      className="neumorphic rounded-xl p-4 transition-all duration-300 hover:shadow-lg"
      animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{habit.emoji}</div>
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">{habit.displayName}</h3>
            <p className="text-[var(--text-muted)] text-sm">Target: {habit.currentTarget}</p>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <Button
          onClick={handleToggle}
          disabled={toggleMutation.isPending}
          className={`w-12 h-6 rounded-full relative transition-all duration-300 p-0 ${
            isCompleted
              ? "bg-gradient-to-r from-[var(--success)] to-[hsl(162,90%,35%)] shadow-lg"
              : "neumorphic-inset"
          }`}
        >
          <motion.div
            className={`w-5 h-5 rounded-full absolute top-0.5 transition-all duration-300 ${
              isCompleted
                ? "bg-white right-0.5 shadow-lg"
                : "bg-[var(--dark-elevated)] left-0.5"
            }`}
            animate={{ x: isCompleted ? 0 : 0 }}
          />
        </Button>
      </div>
      
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[var(--dark-elevated)] rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              isCompleted ? "progress-bar" : "bg-[var(--text-muted)]"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage()}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <span className="text-[var(--text-secondary)] text-xs font-medium">
          {streak > 0 ? `${streak} days` : "Start today"}
        </span>
      </div>
    </motion.div>
  );
}
