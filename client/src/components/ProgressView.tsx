import { useQuery } from "@tanstack/react-query";
import { Habit, UserProgress, HabitStreak } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Trophy, Award, Star, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";

interface ProgressViewProps {
  habits: Habit[];
  progress?: UserProgress;
  streaks: HabitStreak[];
}

export default function ProgressView({ habits, progress, streaks }: ProgressViewProps) {
  // Get weekly progress data
  const { data: weeklyData } = useQuery({
    queryKey: ["/api/progress/weekly"],
    enabled: !!progress,
  });

  // Get pushup progress data
  const { data: pushupData } = useQuery({
    queryKey: ["/api/progress/habit/pushups"],
    enabled: !!progress,
  });

  const currentDay = progress?.currentDay || 1;
  const currentWeek = Math.ceil(currentDay / 7);
  
  // Calculate weekly completion data
  const getWeeklyCompletionData = () => {
    if (!weeklyData) return [];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekMap = new Map();
    
    weeklyData.forEach((day: any) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      
      weekMap.set(dayNames[dayOfWeek], {
        day: dayNames[dayOfWeek],
        completed: day.completedCount || 0,
      });
    });
    
    return dayNames.map(day => weekMap.get(day) || { day, completed: 0 });
  };

  // Get pushup progression data
  const getPushupProgressData = () => {
    if (!pushupData) return [];
    
    return pushupData.slice(-4).map((entry: any, index: number) => ({
      week: `W${index + 1}`,
      pushups: entry.actualValue ? parseInt(entry.actualValue) : 10 + index * 5,
    }));
  };

  // Get top habit streaks
  const getTopStreaks = () => {
    const habitStreakMap = new Map();
    habits.forEach(habit => {
      const streak = streaks.find(s => s.habitId === habit.id);
      habitStreakMap.set(habit.id, {
        ...habit,
        currentStreak: streak?.currentStreak || 0,
        bestStreak: streak?.bestStreak || 0,
      });
    });
    
    return Array.from(habitStreakMap.values())
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 3);
  };

  const weeklyCompletionData = getWeeklyCompletionData();
  const pushupProgressData = getPushupProgressData();
  const topStreaks = getTopStreaks();

  // Calculate average completion rate
  const averageCompletion = weeklyCompletionData.length > 0
    ? (weeklyCompletionData.reduce((sum, day) => sum + day.completed, 0) / weeklyCompletionData.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Weekly Overview */}
      <motion.div
        className="neumorphic rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="font-sora font-semibold text-lg text-[var(--text-primary)] mb-4 text-center">
          Week {currentWeek} Progress
        </h3>
        
        {weeklyCompletionData.length > 0 ? (
          <>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weeklyCompletionData.map((day, index) => {
                const completionRate = day.completed / 9; // Assuming 9 habits
                const bgColor = completionRate >= 0.8 ? "bg-[var(--success)]" 
                              : completionRate >= 0.6 ? "bg-[var(--warning)]"
                              : "bg-[var(--text-muted)]";
                
                return (
                  <div key={day.day} className="text-center">
                    <div className="text-[var(--text-muted)] text-xs mb-1">{day.day}</div>
                    <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center text-white text-xs font-bold`}>
                      {day.completed}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <p className="text-[var(--text-secondary)] text-sm">
                Average: <span className="text-[var(--success)] font-semibold">{averageCompletion}/9</span> habits per day
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Start completing habits to see your weekly progress!</p>
          </div>
        )}
      </motion.div>

      {/* Push-up Progress Chart */}
      <motion.div
        className="neumorphic rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h3 className="font-sora font-semibold text-lg text-[var(--text-primary)] mb-4">
          Push-up Progression
        </h3>
        
        {pushupProgressData.length > 0 ? (
          <>
            <div className="h-32 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pushupProgressData}>
                  <XAxis 
                    dataKey="week" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  />
                  <YAxis hide />
                  <Bar 
                    dataKey="pushups" 
                    fill="url(#pushupGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="pushupGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary-start)" />
                      <stop offset="100%" stopColor="var(--primary-end)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Week 1: {pushupProgressData[0]?.pushups || 10} reps</span>
              <span className="text-[var(--success)] font-semibold">
                Current: {pushupProgressData[pushupProgressData.length - 1]?.pushups || 10} reps
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <div className="text-4xl mb-2">💪</div>
            <p>Complete some push-ups to see your progression!</p>
          </div>
        )}
      </motion.div>

      {/* Habit Streak Rankings */}
      <motion.div
        className="neumorphic rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h3 className="font-sora font-semibold text-lg text-[var(--text-primary)] mb-4">
          Streak Leaders
        </h3>
        <div className="space-y-3">
          {topStreaks.map((habit, index) => {
            const icons = [Trophy, Award, Star];
            const Icon = icons[index] || Star;
            const colors = ["text-[var(--warning)]", "text-[var(--primary-start)]", "text-[var(--primary-start)]"];
            const colorClass = colors[index] || "text-[var(--primary-start)]";
            
            return (
              <div key={habit.id} className="flex items-center justify-between p-3 neumorphic-inset rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                  <div>
                    <div className="text-[var(--text-primary)] font-medium">{habit.displayName}</div>
                    <div className="text-[var(--text-muted)] text-sm">
                      {index === 0 ? "Your longest streak" 
                       : index === 1 ? "Consistent progress"
                       : "Building momentum"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${colorClass} font-bold`}>{habit.currentStreak} days</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Best: {habit.bestStreak}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Achievement Badges */}
      <motion.div
        className="neumorphic rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <h3 className="font-sora font-semibold text-lg text-[var(--text-primary)] mb-4">
          Recent Achievements
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 gradient-bg rounded-full flex items-center justify-center text-white text-xl">
              🔥
            </div>
            <div className="text-[var(--text-primary)] text-sm font-medium">Week Warrior</div>
            <div className="text-[var(--text-muted)] text-xs">7 perfect days</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-[var(--success)] rounded-full flex items-center justify-center text-white text-xl">
              💪
            </div>
            <div className="text-[var(--text-primary)] text-sm font-medium">Strength Builder</div>
            <div className="text-[var(--text-muted)] text-xs">100+ push-ups</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-[var(--warning)] rounded-full flex items-center justify-center text-white text-xl">
              📚
            </div>
            <div className="text-[var(--text-primary)] text-sm font-medium">Knowledge Seeker</div>
            <div className="text-[var(--text-muted)] text-xs">20 day streak</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
