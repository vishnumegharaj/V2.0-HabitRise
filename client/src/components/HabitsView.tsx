import { Habit, HabitCompletion } from "@shared/schema";
import HabitCard from "./HabitCard";
import { motion } from "framer-motion";
import { getMotivationalMessage } from "@/lib/habitUtils";

interface HabitsViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  completedCount: number;
  totalHabits: number;
}

export default function HabitsView({ 
  habits, 
  completions, 
  completedCount, 
  totalHabits 
}: HabitsViewProps) {
  const getCompletionForHabit = (habitId: number) => {
    return completions.find(c => c.habitId === habitId);
  };

  const motivationalMessage = getMotivationalMessage(completedCount, totalHabits);
  const completionPercentage = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Daily Habits Grid */}
      <div className="space-y-4">
        {habits.map((habit, index) => (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <HabitCard
              habit={habit}
              completion={getCompletionForHabit(habit.id)}
              streak={0} // TODO: Get from habit streaks
            />
          </motion.div>
        ))}
      </div>

      {/* Daily Completion Summary */}
      <motion.div
        className="neumorphic rounded-xl p-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🎯</div>
          <h3 className="font-sora font-semibold text-lg text-[var(--text-primary)] mb-2">
            Today's Progress
          </h3>
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--success)]">{completedCount}</div>
              <div className="text-[var(--text-muted)] text-xs">Completed</div>
            </div>
            <div className="w-px h-8 bg-[var(--text-muted)]"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--warning)]">{totalHabits - completedCount}</div>
              <div className="text-[var(--text-muted)] text-xs">Remaining</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-[var(--dark-elevated)] rounded-full h-3 overflow-hidden mb-2">
            <motion.div
              className="progress-bar h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          
          <p className="text-[var(--text-secondary)] text-sm">
            {motivationalMessage}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
