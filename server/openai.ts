import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generateDailyAffirmation(
  mood: string, 
  completedHabits: number, 
  totalHabits: number,
  currentStreak: number
): Promise<string> {
  try {
    const prompt = `Generate a personalized daily affirmation for someone working on a 66-day habit reset journey. 

Context:
- Current mood: ${mood}
- Habits completed today: ${completedHabits}/${totalHabits}
- Current streak: ${currentStreak} days

The affirmation should be:
- Encouraging and motivational
- Specific to their current progress
- Between 2-3 sentences
- Focused on growth mindset and consistency
- Include relevant emoji

Respond with just the affirmation text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "You're doing amazing! Every small step counts toward your transformation. Keep building those powerful habits! 🌟";
  } catch (error) {
    console.error("Error generating affirmation:", error);
    return "You're building incredible momentum with your habits. Every small step you take today is shaping the powerful, disciplined person you're becoming. Trust the process and celebrate your consistency! 🌟";
  }
}

export async function generateJournalPrompts(mood: string, currentDay: number): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful journaling coach. Generate 3 thoughtful journal prompts based on the user's mood and progress. Respond with JSON in this format: { 'prompts': ['prompt1', 'prompt2', 'prompt3'] }"
        },
        {
          role: "user",
          content: `Generate 3 personalized journal prompts for someone on day ${currentDay} of their 66-day habit journey. Their current mood is: ${mood}. Each prompt should be insightful and help them reflect on their progress.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"prompts": []}');
    return result.prompts || [
      "What are you grateful for today?",
      "What challenged you the most today?", 
      "What's your focus for tomorrow?"
    ];
  } catch (error) {
    console.error("Error generating journal prompts:", error);
    return [
      "What are you grateful for today?",
      "What challenged you the most today?", 
      "What's your focus for tomorrow?"
    ];
  }
}

export async function analyzeJournalEntry(content: string): Promise<{
  sentiment: string;
  insights: string[];
  encouragement: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a thoughtful AI coach analyzing journal entries. Provide insights, sentiment analysis, and encouragement. Respond with JSON in this format: { 'sentiment': 'positive|neutral|negative', 'insights': ['insight1', 'insight2'], 'encouragement': 'encouraging message' }"
        },
        {
          role: "user",
          content: `Analyze this journal entry and provide insights: "${content}"`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      sentiment: result.sentiment || "neutral",
      insights: result.insights || ["You're showing great self-awareness in your reflection."],
      encouragement: result.encouragement || "Keep up the great work on your journey!"
    };
  } catch (error) {
    console.error("Error analyzing journal entry:", error);
    return {
      sentiment: "neutral",
      insights: ["You're showing great self-awareness in your reflection."],
      encouragement: "Keep up the great work on your journey!"
    };
  }
}
