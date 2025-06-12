// Using Together AI API for Llama 3.1 8B Instruct (free tier available)
const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || process.env.LLAMA_API_KEY || "";

// Fallback to Hugging Face API if Together AI is not available
const HF_API_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct";
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";

async function callLlamaAPI(messages: any[], maxTokens: number = 150): Promise<string> {
  // Try Together AI first if API key is available
  if (TOGETHER_API_KEY) {
    try {
      const response = await fetch(TOGETHER_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct-Turbo",
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      }
    } catch (error) {
      console.error("Together AI error:", error);
    }
  }

  // Fallback to Hugging Face if available
  if (HF_API_KEY) {
    try {
      const prompt = messages.map(m => m.content).join('\n\n');
      const response = await fetch(HF_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data[0]?.generated_text || "";
      }
    } catch (error) {
      console.error("Hugging Face API error:", error);
    }
  }

  // If no API keys or all fail, throw error
  throw new Error("No AI API keys configured or all APIs failed");
}

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

    const content = await callLlamaAPI([{ role: "user", content: prompt }], 150);
    
    return content || "You're building incredible momentum with your habits. Every small step you take today is shaping the powerful, disciplined person you're becoming. Trust the process and celebrate your consistency! 🌟";
  } catch (error) {
    console.error("Error generating affirmation:", error);
    return "You're building incredible momentum with your habits. Every small step you take today is shaping the powerful, disciplined person you're becoming. Trust the process and celebrate your consistency! 🌟";
  }
}

export async function generateJournalPrompts(mood: string, currentDay: number): Promise<string[]> {
  try {
    const prompt = `Generate 3 personalized journal prompts for someone on day ${currentDay} of their 66-day habit journey. Their current mood is: ${mood}. Each prompt should be insightful and help them reflect on their progress.

Respond with exactly 3 prompts, one per line, no numbering or formatting. Example:
What are you grateful for today?
What challenged you the most today?
What's your focus for tomorrow?`;

    const content = await callLlamaAPI([{ role: "user", content: prompt }], 200);
    
    if (content) {
      const prompts = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^\d+\./))
        .slice(0, 3);
      
      if (prompts.length >= 3) {
        return prompts;
      }
    }
    
    return [
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
    const prompt = `Analyze this journal entry and provide insights: "${content}"

Please analyze the sentiment (positive/neutral/negative), provide 2 insights about the person's mindset or progress, and give an encouraging message.

Respond in this format:
Sentiment: [positive/neutral/negative]
Insight 1: [insight about their mindset]
Insight 2: [insight about their progress]
Encouragement: [encouraging message]`;

    const response = await callLlamaAPI([{ role: "user", content: prompt }], 300);
    
    if (response) {
      const lines = response.split('\n').map(line => line.trim());
      const sentimentLine = lines.find(line => line.startsWith('Sentiment:'));
      const insight1Line = lines.find(line => line.startsWith('Insight 1:'));
      const insight2Line = lines.find(line => line.startsWith('Insight 2:'));
      const encouragementLine = lines.find(line => line.startsWith('Encouragement:'));
      
      const sentiment = sentimentLine?.replace('Sentiment:', '').trim().toLowerCase() || "neutral";
      const insight1 = insight1Line?.replace('Insight 1:', '').trim() || "You're showing great self-awareness in your reflection.";
      const insight2 = insight2Line?.replace('Insight 2:', '').trim() || "Your commitment to growth is inspiring.";
      const encouragement = encouragementLine?.replace('Encouragement:', '').trim() || "Keep up the great work on your journey!";
      
      return {
        sentiment: ["positive", "neutral", "negative"].includes(sentiment) ? sentiment : "neutral",
        insights: [insight1, insight2],
        encouragement
      };
    }
    
    return {
      sentiment: "neutral",
      insights: ["You're showing great self-awareness in your reflection.", "Your commitment to growth is inspiring."],
      encouragement: "Keep up the great work on your journey!"
    };
  } catch (error) {
    console.error("Error analyzing journal entry:", error);
    return {
      sentiment: "neutral",
      insights: ["You're showing great self-awareness in your reflection.", "Your commitment to growth is inspiring."],
      encouragement: "Keep up the great work on your journey!"
    };
  }
}
