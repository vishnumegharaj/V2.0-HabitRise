import {
  users,
  habits,
  habitCompletions,
  journalEntries,
  userProgress,
  habitStreaks,
  type User,
  type UpsertUser,
  type Habit,
  type InsertHabit,
  type HabitCompletion,
  type InsertHabitCompletion,
  type JournalEntry,
  type InsertJournalEntry,
  type UserProgress,
  type InsertUserProgress,
  type HabitStreak,
  type InsertHabitStreak,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Habit operations
  getUserHabits(userId: string): Promise<Habit[]>;
  createDefaultHabits(userId: string): Promise<Habit[]>;
  updateHabitTarget(habitId: number, newTarget: string): Promise<void>;
  
  // Habit completion operations
  getHabitCompletions(userId: string, date: string): Promise<HabitCompletion[]>;
  toggleHabitCompletion(userId: string, habitId: number, date: string, completed: boolean, actualValue?: string): Promise<HabitCompletion>;
  getHabitCompletionHistory(userId: string, habitId: number, days: number): Promise<HabitCompletion[]>;
  
  // Journal operations
  getJournalEntry(userId: string, date: string): Promise<JournalEntry | undefined>;
  upsertJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getRecentJournalEntries(userId: string, limit: number): Promise<JournalEntry[]>;
  
  // Progress operations
  getUserProgress(userId: string): Promise<UserProgress | undefined>;
  upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateStreak(userId: string, newStreak: number, bestStreak?: number): Promise<void>;
  
  // Habit streak operations
  getHabitStreaks(userId: string): Promise<HabitStreak[]>;
  updateHabitStreak(userId: string, habitId: number, currentStreak: number, lastCompletedDate: string): Promise<void>;
  
  // Analytics
  getWeeklyProgress(userId: string, startDate: string): Promise<any[]>;
  getHabitProgressChart(userId: string, habitName: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Habit operations
  async getUserHabits(userId: string): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.userId, userId)).orderBy(asc(habits.id));
  }

  async createDefaultHabits(userId: string): Promise<Habit[]> {
    const defaultHabits = [
      { name: "wakeup", displayName: "Wake Up Early", emoji: "🛏️", initialTarget: "7:30 AM", currentTarget: "7:30 AM", unit: "time" },
      { name: "running", displayName: "Morning Run", emoji: "🏃‍♂️", initialTarget: "2 KM", currentTarget: "2 KM", unit: "distance" },
      { name: "workout", displayName: "Strength Training", emoji: "💪", initialTarget: "30 mins", currentTarget: "30 mins", unit: "duration" },
      { name: "pushups", displayName: "Push-ups", emoji: "🔥", initialTarget: "10 reps", currentTarget: "10 reps", unit: "reps" },
      { name: "meditation", displayName: "Mindfulness", emoji: "🧘", initialTarget: "5 mins", currentTarget: "5 mins", unit: "duration" },
      { name: "water", displayName: "Hydration", emoji: "💧", initialTarget: "2L", currentTarget: "2L", unit: "volume" },
      { name: "socialmedia", displayName: "Digital Detox", emoji: "📵", initialTarget: "1.5 hrs", currentTarget: "1.5 hrs", unit: "limit" },
      { name: "reading", displayName: "Daily Reading", emoji: "📚", initialTarget: "10 pages", currentTarget: "10 pages", unit: "pages" },
      { name: "situps", displayName: "Core Training", emoji: "🔁", initialTarget: "10 reps", currentTarget: "10 reps", unit: "reps" },
    ];

    const createdHabits = [];
    for (const habit of defaultHabits) {
      const [created] = await db.insert(habits).values({ userId, ...habit }).returning();
      createdHabits.push(created);
    }

    return createdHabits;
  }

  async updateHabitTarget(habitId: number, newTarget: string): Promise<void> {
    await db.update(habits).set({ currentTarget: newTarget }).where(eq(habits.id, habitId));
  }

  // Habit completion operations
  async getHabitCompletions(userId: string, date: string): Promise<HabitCompletion[]> {
    return await db
      .select()
      .from(habitCompletions)
      .where(and(eq(habitCompletions.userId, userId), eq(habitCompletions.date, date)));
  }

  async toggleHabitCompletion(
    userId: string, 
    habitId: number, 
    date: string, 
    completed: boolean, 
    actualValue?: string
  ): Promise<HabitCompletion> {
    const existing = await db
      .select()
      .from(habitCompletions)
      .where(and(
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.habitId, habitId),
        eq(habitCompletions.date, date)
      ));

    if (existing.length > 0) {
      const [updated] = await db
        .update(habitCompletions)
        .set({ completed, actualValue })
        .where(eq(habitCompletions.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(habitCompletions)
        .values({ userId, habitId, date, completed, actualValue })
        .returning();
      return created;
    }
  }

  async getHabitCompletionHistory(userId: string, habitId: number, days: number): Promise<HabitCompletion[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return await db
      .select()
      .from(habitCompletions)
      .where(and(
        eq(habitCompletions.userId, userId),
        eq(habitCompletions.habitId, habitId),
        gte(habitCompletions.date, daysAgo.toISOString().split('T')[0])
      ))
      .orderBy(desc(habitCompletions.date));
  }

  // Journal operations
  async getJournalEntry(userId: string, date: string): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), eq(journalEntries.date, date)));
    return entry;
  }

  async upsertJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const existing = await this.getJournalEntry(entry.userId, entry.date);
    
    if (existing) {
      const [updated] = await db
        .update(journalEntries)
        .set({ ...entry, updatedAt: new Date() })
        .where(eq(journalEntries.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(journalEntries).values(entry).returning();
      return created;
    }
  }

  async getRecentJournalEntries(userId: string, limit: number): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.date))
      .limit(limit);
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    return progress;
  }

  async upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const existing = await this.getUserProgress(progress.userId);
    
    if (existing) {
      const [updated] = await db
        .update(userProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(userProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userProgress).values(progress).returning();
      return created;
    }
  }

  async updateStreak(userId: string, newStreak: number, bestStreak?: number): Promise<void> {
    const updateData: any = { currentStreak: newStreak, updatedAt: new Date() };
    if (bestStreak !== undefined) {
      updateData.bestStreak = bestStreak;
    }
    
    await db.update(userProgress).set(updateData).where(eq(userProgress.userId, userId));
  }

  // Habit streak operations
  async getHabitStreaks(userId: string): Promise<HabitStreak[]> {
    return await db.select().from(habitStreaks).where(eq(habitStreaks.userId, userId));
  }

  async updateHabitStreak(userId: string, habitId: number, currentStreak: number, lastCompletedDate: string): Promise<void> {
    const existing = await db
      .select()
      .from(habitStreaks)
      .where(and(eq(habitStreaks.userId, userId), eq(habitStreaks.habitId, habitId)));

    const updateData = {
      currentStreak,
      lastCompletedDate,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      const newBestStreak = Math.max(existing[0].bestStreak, currentStreak);
      await db
        .update(habitStreaks)
        .set({ ...updateData, bestStreak: newBestStreak })
        .where(eq(habitStreaks.id, existing[0].id));
    } else {
      await db.insert(habitStreaks).values({
        userId,
        habitId,
        ...updateData,
        bestStreak: currentStreak,
      });
    }
  }

  // Analytics
  async getWeeklyProgress(userId: string, startDate: string): Promise<any[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    return await db
      .select({
        date: habitCompletions.date,
        completedCount: sql<number>`count(case when ${habitCompletions.completed} then 1 end)`,
        totalHabits: sql<number>`count(*)`,
      })
      .from(habitCompletions)
      .where(and(
        eq(habitCompletions.userId, userId),
        gte(habitCompletions.date, startDate),
        sql`${habitCompletions.date} <= ${endDate.toISOString().split('T')[0]}`
      ))
      .groupBy(habitCompletions.date)
      .orderBy(asc(habitCompletions.date));
  }

  async getHabitProgressChart(userId: string, habitName: string): Promise<any[]> {
    return await db
      .select({
        date: habitCompletions.date,
        completed: habitCompletions.completed,
        actualValue: habitCompletions.actualValue,
      })
      .from(habitCompletions)
      .innerJoin(habits, eq(habits.id, habitCompletions.habitId))
      .where(and(
        eq(habitCompletions.userId, userId),
        eq(habits.name, habitName)
      ))
      .orderBy(asc(habitCompletions.date))
      .limit(30);
  }
}

export const storage = new DatabaseStorage();
