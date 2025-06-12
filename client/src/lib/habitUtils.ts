import { Habit, HabitCompletion } from "@shared/schema";

export function calculateHabitStreak(completions: HabitCompletion[]): number {
  if (completions.length === 0) return 0;
  
  // Sort by date descending (most recent first)
  const sorted = completions
    .filter(c => c.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (sorted.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sorted.length; i++) {
    const completionDate = new Date(sorted[i].date);
    completionDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export function getProgressiveTarget(habitName: string, currentDay: number): string {
  const week = Math.ceil(currentDay / 7);
  
  switch (habitName) {
    case "wakeup":
      // Start at 7:30 AM, decrease by 30 mins every 2 weeks
      const wakeupHour = 7;
      const wakeupMinute = Math.max(0, 30 - Math.floor((week - 1) / 2) * 30);
      const finalHour = wakeupMinute === 0 && week > 4 ? wakeupHour - Math.floor((week - 5) / 2) : wakeupHour;
      return `${Math.max(5, finalHour)}:${wakeupMinute.toString().padStart(2, '0')} AM`;
      
    case "running":
      // Start at 2 KM, increase by 0.5 KM every week, max 6 KM
      const distance = Math.min(6, 2 + (week - 1) * 0.5);
      return `${distance.toFixed(1)} KM`;
      
    case "workout":
      // Start at 30 mins, increase by 15 mins every 2 weeks, max 90 mins
      const workoutDuration = Math.min(90, 30 + Math.floor((week - 1) / 2) * 15);
      return `${workoutDuration} mins`;
      
    case "pushups":
      // Start at 10, increase by +5 every 3 days
      const pushups = 10 + Math.floor((currentDay - 1) / 3) * 5;
      return `${pushups} reps`;
      
    case "meditation":
      // Start at 5 mins, increase by 2.5 mins every 2 weeks, max 20 mins
      const meditationDuration = Math.min(20, 5 + Math.floor((week - 1) / 2) * 2.5);
      return `${meditationDuration} mins`;
      
    case "water":
      // Start at 2L, increase by 0.25L every 3 weeks, max 3L
      const waterAmount = Math.min(3, 2 + Math.floor((week - 1) / 3) * 0.25);
      return `${waterAmount.toFixed(2)}L`;
      
    case "socialmedia":
      // Start at 1.5 hrs, decrease by 15 mins every 2 weeks, min 10 mins
      const socialMediaMins = Math.max(10, 90 - Math.floor((week - 1) / 2) * 15);
      const hours = Math.floor(socialMediaMins / 60);
      const mins = socialMediaMins % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;
      
    case "reading":
      // Always 10 pages
      return "10 pages";
      
    case "situps":
      // Start at 10, increase by 5 every week
      const situps = 10 + (week - 1) * 5;
      return `${situps} reps`;
      
    default:
      return "Complete";
  }
}

export function updateHabitTargets(habits: Habit[], currentDay: number): Habit[] {
  return habits.map(habit => ({
    ...habit,
    currentTarget: getProgressiveTarget(habit.name, currentDay),
  }));
}

export function calculateCompletionPercentage(completions: HabitCompletion[], totalHabits: number): number {
  if (totalHabits === 0) return 0;
  const completedCount = completions.filter(c => c.completed).length;
  return Math.round((completedCount / totalHabits) * 100);
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return "🔥";
  if (streak >= 21) return "⚡";
  if (streak >= 14) return "💪";
  if (streak >= 7) return "🌟";
  if (streak >= 3) return "✨";
  return "💎";
}

export function getMotivationalMessage(completedCount: number, totalCount: number): string {
  const percentage = (completedCount / totalCount) * 100;
  
  if (percentage === 100) return "Perfect day! You're unstoppable! 🏆";
  if (percentage >= 80) return "Amazing progress! Keep crushing it! 🔥";
  if (percentage >= 60) return "Great momentum! You're doing awesome! 💪";
  if (percentage >= 40) return "Good start! Keep building that streak! ⭐";
  if (percentage >= 20) return "Every step counts! You've got this! 💎";
  return "Just getting started! Let's build some momentum! 🚀";
}
