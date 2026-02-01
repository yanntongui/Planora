
import { GoogleGenAI, Type } from '@google/genai';

const API_KEY = process.env.API_KEY;

const CATEGORY_IDS = [
  'foodAndDining', 'transport', 'shopping', 'entertainment',
  'billsAndUtilities', 'health', 'income', 'general'
];

export const suggestCategory = async (label: string): Promise<string> => {
  if (!API_KEY) {
    console.error("API key is not available for category suggestion.");
    return 'general'; // Fallback
  }

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true
  } as any);

  const prompt = `Based on the transaction label "${label}", what is the most appropriate category?`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "The most appropriate category ID.",
              enum: CATEGORY_IDS
            }
          },
          required: ["category"]
        }
      },
    });

    const result = JSON.parse(response.text.trim());
    return result.category || 'general';
  } catch (error) {
    console.error("Error suggesting category with AI:", error);
    return 'general'; // Fallback on error
  }
};
