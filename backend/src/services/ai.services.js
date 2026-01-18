import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getSpyWord = async (commonWord, category) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Act as a game designer for a social deduction game. 
        The category is "${category}" and the main word is "${commonWord}". 
        Provide ONE word for a "Spy" player that is highly similar but distinct. 
        Only return the word itself, nothing else.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text ? text.trim() : null;
    } catch (error) {
        console.error("AI Service Error:", error);
        return null; // Fallback to wordsData.json logic
    }
};