import OpenAI from "openai";
import "dotenv/config";

export const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const getOpenAIAPIResponse = async (conversationHistory = []) => {
    // Build messages array with system prompt + conversation history
    const messages = [
        {
            role: "system",
            content: "You are SigmaGPT, a helpful and knowledgeable AI assistant. Provide clear, accurate, and well-structured responses."
        },
        ...conversationHistory
    ];

    try {
        const response = await client.chat.completions.create({
            model: "gpt-5.5",
            messages,
            temperature: 0.7,
            max_completion_tokens: 4096
        });

        return response.choices[0].message.content;
    } catch (err) {
        console.error("OpenAI request failed:", err.message);
        if (err.status === 429) {
            return "This is a mock response because your OpenAI API key has exceeded its quota limit. However, the system is working perfectly! Please update your billing details on OpenAI to see real responses.";
        }
        throw err;
    }
};

export default getOpenAIAPIResponse;