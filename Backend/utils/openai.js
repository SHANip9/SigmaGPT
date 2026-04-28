import "dotenv/config";

const getOpenAIAPIResponse = async (message, conversationHistory = []) => {
    // Build messages array - include conversation history for context
    const messages = [
        {
            role: "system",
            content: "You are SigmaGPT, a helpful and knowledgeable AI assistant. Provide clear, accurate, and well-structured responses."
        },
        ...conversationHistory,
        { role: "user", content: message }
    ];

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-5.5",
            messages,
            temperature: 0.7,
            max_tokens: 4096
        })
    };

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", options);
        const data = await response.json();

        // Handle API-level errors (invalid key, rate limit, etc.)
        if (data.error) {
            console.error("OpenAI API Error:", data.error.message);
            throw new Error(data.error.message);
        }

        return data.choices[0].message.content;
    } catch (err) {
        console.error("OpenAI request failed:", err.message);
        throw err;
    }
};

export default getOpenAIAPIResponse;