import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { JournalEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import MoodSelector from "./MoodSelector";
import { motion } from "framer-motion";
import { Camera, Mic, Sparkles } from "lucide-react";
import { MOOD_EMOJIS, DEFAULT_JOURNAL_PROMPTS } from "@/lib/constants";

type Mood = keyof typeof MOOD_EMOJIS;

interface JournalViewProps {
  currentDay: number;
  completedHabits: number;
  totalHabits: number;
  currentStreak: number;
}

export default function JournalView({ 
  currentDay, 
  completedHabits, 
  totalHabits, 
  currentStreak 
}: JournalViewProps) {
  const [selectedMood, setSelectedMood] = useState<Mood>("great");
  const [journalContent, setJournalContent] = useState("");
  const [aiAffirmation, setAiAffirmation] = useState("");
  const [journalPrompts, setJournalPrompts] = useState<string[]>(DEFAULT_JOURNAL_PROMPTS);
  const { toast } = useToast();

  // Fetch today's journal entry
  const { data: todayEntry } = useQuery<JournalEntry | null>({
    queryKey: ["/api/journal/today"],
  });

  // Fetch recent journal entries
  const { data: recentEntries } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal/recent"],
  });

  // Load existing journal data
  useEffect(() => {
    if (todayEntry) {
      setSelectedMood(todayEntry.mood as Mood);
      setJournalContent(todayEntry.content || "");
      setAiAffirmation(todayEntry.aiAffirmation || "");
    }
  }, [todayEntry]);

  // Generate AI affirmation
  const generateAffirmationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/affirmation", {
        mood: selectedMood,
        completedHabits,
        totalHabits,
        currentStreak,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAiAffirmation(data.affirmation);
    },
  });

  // Generate journal prompts
  const generatePromptsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/prompts", {
        mood: selectedMood,
        currentDay,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setJournalPrompts(data.prompts || DEFAULT_JOURNAL_PROMPTS);
    },
  });

  // Save journal entry
  const saveJournalMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/journal", {
        mood: selectedMood,
        content: journalContent,
        aiAffirmation,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/recent"] });
      toast({
        title: "✅ Journal saved!",
        description: "Your thoughts have been recorded.",
      });
    },
  });

  // Auto-save journal content
  useEffect(() => {
    if (journalContent.trim() || selectedMood !== "great") {
      const timeoutId = setTimeout(() => {
        saveJournalMutation.mutate();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [journalContent, selectedMood, aiAffirmation]);

  // Generate affirmation when mood changes
  useEffect(() => {
    generateAffirmationMutation.mutate();
    generatePromptsMutation.mutate();
  }, [selectedMood]);

  const handlePromptClick = (prompt: string) => {
    const cleanPrompt = prompt.replace(/^[^\s]*\s/, ""); // Remove emoji and first word
    setJournalContent(prev => prev + (prev ? "\n\n" : "") + cleanPrompt + "\n");
  };

  const formatEntryDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${daysAgo} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Mood Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MoodSelector
          selectedMood={selectedMood}
          onMoodSelect={setSelectedMood}
        />
      </motion.div>

      {/* AI-Generated Affirmation */}
      <motion.div
        className="neumorphic rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-medium text-[var(--text-primary)]">Daily Affirmation</h3>
          {generateAffirmationMutation.isPending && (
            <div className="w-4 h-4 gradient-bg rounded-full animate-pulse" />
          )}
        </div>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          {aiAffirmation || "Generating your personalized affirmation..."}
        </p>
      </motion.div>

      {/* Journal Entry */}
      <motion.div
        className="neumorphic rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h3 className="font-sora font-semibold text-lg text-[var(--text-primary)] mb-4">
          Today's Reflection
        </h3>
        
        {/* Journal Prompts */}
        <div className="mb-4 space-y-2">
          {journalPrompts.map((prompt, index) => (
            <Button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              variant="ghost"
              className="w-full text-left p-3 neumorphic-inset rounded-lg text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition-colors justify-start"
            >
              {prompt}
            </Button>
          ))}
        </div>

        {/* Journal Text Area */}
        <div className="neumorphic-inset rounded-lg p-4 mb-4">
          <Textarea
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            className="w-full bg-transparent border-0 text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none min-h-32 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Start writing your thoughts..."
          />
        </div>

        {/* Media Attachments */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="neumorphic rounded-lg p-3 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Camera className="w-4 h-4" />
            <span className="text-sm">Photo</span>
          </Button>
          <Button
            variant="ghost"
            className="neumorphic rounded-lg p-3 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Mic className="w-4 h-4" />
            <span className="text-sm">Voice</span>
          </Button>
        </div>
      </motion.div>

      {/* Recent Entries */}
      <motion.div
        className="neumorphic rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <h3 className="font-sora font-semibold text-lg text-[var(--text-primary)] mb-4">
          Recent Entries
        </h3>
        <div className="space-y-3">
          {recentEntries && recentEntries.length > 0 ? (
            recentEntries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="neumorphic-inset rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-muted)] text-sm">
                    {formatEntryDate(entry.date)}
                  </span>
                  <span className="text-lg">
                    {MOOD_EMOJIS[entry.mood as Mood] || "😊"}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] text-sm line-clamp-2">
                  {entry.content || "No content recorded"}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <p>No previous entries yet.</p>
              <p className="text-sm">Start writing to see your history!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
