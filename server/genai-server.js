import 'dotenv/config';
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());           // allow cross-origin during dev
app.use(express.json());
app.use(express.static("public")); // serve website files

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set; set env var before starting server.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Simple chat endpoint. POST { message: "hi", history: [{role:'user'|'assistant', text:''}, ...] }
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });

    // Build a single prompt from conversation history (lightweight approach).
    const promptParts = history.map(h => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`);
    promptParts.push(`User: ${message}`);
    promptParts.push("Assistant:");
    const prompt = promptParts.join("\n");

    const out = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      maxOutputTokens: 512
    });

    // sdk responses vary; extract main text (check your SDK output shape)
    const reply = out?.text ?? out?.candidates?.[0]?.content?.[0]?.text ?? JSON.stringify(out);

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "chat failed", details: err?.message || err });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`genai server running on http://localhost:${port}`));