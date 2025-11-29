import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

// Read key from environment — do NOT commit your key into source
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set. Set the environment variable before running.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Explain how AI works in a few words",
    });
    console.log(response?.text || response);
  } catch (err) {
    console.error("API call failed:", err);
  }
}

main();