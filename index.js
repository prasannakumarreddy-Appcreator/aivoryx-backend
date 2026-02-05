import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Gemini backend running");
});

// Gemini AI endpoint
app.post("/ai", async (req, res) => {
  try {
    const userText = req.body.text;

    if (!userText || typeof userText !== "string") {
      return res.json({ reply: "Invalid input" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ reply: "GEMINI_API_KEY missing" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userText }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    res.json({
      reply: reply || "Gemini responded but no text was returned"
    });

  } catch (err) {
    console.error("Gemini error:", err);
    res.json({ reply: "Gemini server error" });
  }
});

// Start server (Render uses 10000)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Gemini backend running on port", PORT);
});
