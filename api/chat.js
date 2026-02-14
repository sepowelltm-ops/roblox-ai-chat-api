export default async function handler(req, res) {
    try {
        // Allow browser testing
        if (req.method === "GET") {
            return res.status(200).json({
                status: "API online. Send POST with message + username."
            });
        }

        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const { message, username } = req.body || {};

        if (!message) {
            return res.status(400).json({ error: "Missing message" });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "OPENAI_API_KEY not set in Vercel environment variables"
            });
        }

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                input: `You are a smart Roblox AI assistant. Reply naturally and briefly.\n\n${username}: ${message}`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({
                error: "OpenAI request failed",
                details: data
            });
        }

        const reply =
            data.output?.[0]?.content?.[0]?.text ||
            "I couldn't generate a response.";

        return res.status(200).json({ reply });

    } catch (err) {
        console.error("CRASH:", err);
        return res.status(500).json({
            error: "Server crash",
            details: err.message
        });
    }
}
