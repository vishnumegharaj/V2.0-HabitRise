import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateDailyAffirmation, generateJournalPrompts, analyzeJournalEntry } from "./openai";
import { insertHabitCompletionSchema, insertJournalEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Initialize user data
  app.post('/api/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has habits
      const existingHabits = await storage.getUserHabits(userId);
      if (existingHabits.length > 0) {
        return res.json({ message: "User already initialized" });
      }

      // Create default habits
      const habits = await storage.createDefaultHabits(userId);
      
      // Create initial progress record
      const progress = await storage.upsertUserProgress({
        userId,
        currentDay: 1,
        startDate: new Date().toISOString().split('T')[0],
        totalDaysCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
      });

      res.json({ habits, progress });
    } catch (error) {
      console.error("Error initializing user:", error);
      res.status(500).json({ message: "Failed to initialize user data" });
    }
  });

  // Get user habits
  app.get('/api/habits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habits = await storage.getUserHabits(userId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  // Get today's habit completions
  app.get('/api/habits/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0];
      const completions = await storage.getHabitCompletions(userId, today);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching today's completions:", error);
      res.status(500).json({ message: "Failed to fetch today's completions" });
    }
  });

  // Toggle habit completion
  app.post('/api/habits/:habitId/toggle', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habitId = parseInt(req.params.habitId);
      const { completed, actualValue } = req.body;
      const today = new Date().toISOString().split('T')[0];

      const completion = await storage.toggleHabitCompletion(userId, habitId, today, completed, actualValue);
      
      // Update habit streak if completed
      if (completed) {
        // Get recent completions to calculate streak
        const history = await storage.getHabitCompletionHistory(userId, habitId, 30);
        let currentStreak = 0;
        
        // Calculate consecutive days from today backwards
        const sortedHistory = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        for (const record of sortedHistory) {
          if (record.completed) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        await storage.updateHabitStreak(userId, habitId, currentStreak, today);
      }

      res.json(completion);
    } catch (error) {
      console.error("Error toggling habit:", error);
      res.status(500).json({ message: "Failed to toggle habit completion" });
    }
  });

  // Get user progress
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      const streaks = await storage.getHabitStreaks(userId);
      res.json({ progress, streaks });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Get weekly progress
  app.get('/api/progress/weekly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate } = req.query;
      const weekStart = startDate as string || new Date().toISOString().split('T')[0];
      
      const weeklyData = await storage.getWeeklyProgress(userId, weekStart);
      res.json(weeklyData);
    } catch (error) {
      console.error("Error fetching weekly progress:", error);
      res.status(500).json({ message: "Failed to fetch weekly progress" });
    }
  });

  // Get habit progress chart
  app.get('/api/progress/habit/:habitName', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { habitName } = req.params;
      
      const chartData = await storage.getHabitProgressChart(userId, habitName);
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching habit progress:", error);
      res.status(500).json({ message: "Failed to fetch habit progress" });
    }
  });

  // Get today's journal entry
  app.get('/api/journal/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0];
      const entry = await storage.getJournalEntry(userId, today);
      res.json(entry || null);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  // Save journal entry
  app.post('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0];
      
      const validatedData = insertJournalEntrySchema.parse({
        ...req.body,
        userId,
        date: today,
      });

      const entry = await storage.upsertJournalEntry(validatedData);
      res.json(entry);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid journal data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save journal entry" });
      }
    }
  });

  // Get recent journal entries
  app.get('/api/journal/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 5;
      const entries = await storage.getRecentJournalEntries(userId, limit);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching recent entries:", error);
      res.status(500).json({ message: "Failed to fetch recent journal entries" });
    }
  });

  // Generate AI affirmation
  app.post('/api/ai/affirmation', isAuthenticated, async (req: any, res) => {
    try {
      const { mood, completedHabits, totalHabits, currentStreak } = req.body;
      
      const affirmation = await generateDailyAffirmation(mood, completedHabits, totalHabits, currentStreak);
      res.json({ affirmation });
    } catch (error) {
      console.error("Error generating affirmation:", error);
      res.status(500).json({ message: "Failed to generate affirmation" });
    }
  });

  // Generate journal prompts
  app.post('/api/ai/prompts', isAuthenticated, async (req: any, res) => {
    try {
      const { mood, currentDay } = req.body;
      
      const prompts = await generateJournalPrompts(mood, currentDay);
      res.json({ prompts });
    } catch (error) {
      console.error("Error generating prompts:", error);
      res.status(500).json({ message: "Failed to generate journal prompts" });
    }
  });

  // Analyze journal entry
  app.post('/api/ai/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const { content } = req.body;
      
      const analysis = await analyzeJournalEntry(content);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing journal:", error);
      res.status(500).json({ message: "Failed to analyze journal entry" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
