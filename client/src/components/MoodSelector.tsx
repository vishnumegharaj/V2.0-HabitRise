import { useState } from "react";
import { motion } from "framer-motion";
import { MOOD_EMOJIS, MOOD_LABELS } from "@/lib/constants";

type Mood = keyof typeof MOOD_EMOJIS;

interface MoodSelectorProps {
  selectedMood?: Mood;
  onMoodSelect: (mood: Mood) => void;
}

export default function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
  const moods: Array<{ key: Mood; emoji: string; label: string }> = [
    { key: "amazing", emoji: MOOD_EMOJIS.amazing, label: MOOD_LABELS.amazing },
    { key: "great", emoji: MOOD_EMOJIS.great, label: MOOD_LABELS.great },
    { key: "okay", emoji: MOOD_EMOJIS.okay, label: MOOD_LABELS.okay },
    { key: "meh", emoji: MOOD_EMOJIS.meh, label: MOOD_LABELS.meh },
    { key: "terrible", emoji: MOOD_EMOJIS.terrible, label: MOOD_LABELS.terrible },
  ];

  return (
    <div className="neumorphic rounded-xl p-6">
      <h3 className="font-sora font-semibold text-lg text-[var(--text-primary)] mb-4 text-center">
        How are you feeling today?
      </h3>
      <div className="grid grid-cols-5 gap-3">
        {moods.map((mood) => (
          <motion.button
            key={mood.key}
            onClick={() => onMoodSelect(mood.key)}
            className={`w-12 h-12 rounded-full neumorphic flex items-center justify-center text-2xl transition-all duration-200 ${
              selectedMood === mood.key
                ? "selected bg-[var(--primary-start)]/20 border-2 border-[var(--primary-start)]"
                : "hover:scale-110"
            }`}
            whileHover={{ scale: selectedMood === mood.key ? 1.2 : 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={selectedMood === mood.key ? { scale: 1.2 } : { scale: 1 }}
          >
            {mood.emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
