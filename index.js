import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔍 Health check (Render needs this)
app.get("/", (req, res) => {
  res.send("AI server is running");
});

// 🤖 AI endpoint
app.post("/ai", async (req, res) => {
  try {
    const userText = req.body.text;

    if (!userText || typeof userText !== "string") {
      return res.status(400).json({
        intent: "UNKNOWN",
        reply: "Invalid input"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        intent: "UNKNOWN",
        reply: "OPENAI_API_KEY missing"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: [
            {
              role: "system",
              content: `
You are an Android launcher assistant.

If the user wants to call someone, respond in JSON like:
{
  "intent": "CALL_CONTACT",
  "name": "<contact name>",
  "type": "any"
}

Otherwise, respond normally in plain English.
`
            },
            {
              role: "user",
              content: userText
            }
          ]
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({
        intent: "UNKNOWN",
        reply: "OpenAI API error"
      });
    }

    const rawText =
      data.output_text ??
      data.output?.[0]?.content?.find(c => c.type === "output_text")?.text;

    if (!rawText) {
      return res.json({
        intent: "UNKNOWN",
        reply: "No AI response"
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return res.json({
        intent: "UNKNOWN",
        reply: rawText
      });
    }

    res.json({
      intent: parsed.intent || "UNKNOWN",
      reply:
        parsed.reply ||
        (parsed.intent === "CALL_CONTACT"
          ? `Calling ${parsed.name}`
          : "Okay")
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      intent: "UNKNOWN",
      reply: "Server crashed"
    });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
