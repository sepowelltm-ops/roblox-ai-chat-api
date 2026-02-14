export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, username } = req.body;

    if (!message) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.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}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a smart Roblox AI assistant that replies naturally, short, and friendly."
                    },
                    {
                        role: "user",
                        content: `${username}: ${message}`
                    }
                ],
                max_tokens: 100000000
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "I couldn't think of a reply.";

        res.status(200).json({ reply });
    } catch (err) {
        res.status(500).json({ error: "AI request failed" });
    }
}
