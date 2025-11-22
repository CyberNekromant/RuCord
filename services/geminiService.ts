import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize Gemini client:", error);
}

export const generateAIResponse = async (prompt: string, contextMessages: string[] = []): Promise<string> => {
  if (!aiClient) {
    return "Gemini API key not configured.";
  }

  try {
    // Construct a context-aware prompt
    const history = contextMessages.length > 0 
      ? `Context from recent chat history:\n${contextMessages.join('\n')}\n\n`
      : '';
    
    const fullPrompt = `${history}User says: ${prompt}\n\nYou are a helpful, witty AI assistant inside a chat application called RuCord. Keep responses concise and conversational (under 2000 characters). Format with Markdown if needed.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    return response.text || "Hmm, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

export const summarizeChat = async (messages: string[]): Promise<string> => {
    if (!aiClient) return "API Key missing.";
    if (messages.length === 0) return "Nothing to summarize.";

    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following chat conversation in Russian, highlighting key points:\n\n${messages.join('\n')}`,
        });
        return response.text || "Could not summarize.";
    } catch (e) {
        return "Error summarizing.";
    }
}

export const explainText = async (text: string): Promise<string> => {
  if (!aiClient) return "API Key missing.";
  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain the following text simply and briefly in Russian (or translate if it's not in Russian): "${text}"`,
    });
    return response.text || "Could not explain.";
  } catch (e) {
    return "Error explaining text.";
  }
}