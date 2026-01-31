
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

/**
 * Converts a File object to a Base64 string suitable for the Gemini API.
 */
async function fileToGenerativePart(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data url prefix (e.g. "data:image/jpeg;base64,") if present
            const base64 = base64String.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Sends the receipt image to Gemini and returns a formatted command string.
 */
export const scanReceipt = async (file: File): Promise<string | null> => {
    if (!API_KEY) {
        console.error("API Key missing for receipt scanning.");
        return null;
    }

    try {
        const base64Data = await fileToGenerativePart(file);
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        // Prompt designed to output a command string compatible with our parser
        const prompt = `
        Analyze this receipt image.
        Extract the Total Amount and the Merchant Name.
        
        Output ONLY a single text line in this format:
        AMOUNT MERCHANT_NAME
        
        Example: "25.50 Starbucks" or "120.00 Walmart"
        
        If you cannot read the receipt or find the total, return exactly: ERROR
        Do not add any other text, markdown, or explanation.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType: file.type, data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        const text = response.text?.trim();
        
        if (!text || text === 'ERROR') {
            return null;
        }

        // Clean up potential markdown or extra spaces
        return text.replace(/\*\*/g, '').trim();

    } catch (error) {
        console.error("Receipt scanning failed:", error);
        return null;
    }
};
