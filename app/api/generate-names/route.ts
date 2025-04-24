import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { gender, theme, count } = await req.json();

    const prompt = `
    Generate a list of ${count || 10} unique ${
      gender === "neutral" ? "" : gender === "female" ? "female" : "male"
    } baby names.
    Each name must be accompanied by a short 1–2 sentence summary that includes its origin and general meaning.
    Return only a valid JSON array, like this:
    [
      { "name": "Aveline", "summary": "A French name from the 11th century, symbolizing strength and light." },
      ...
    ]
    Do not include any introductory text, comments or explanation. Only return raw JSON.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content || "";
    console.log("🔍 Odpowiedź z OpenAI:\n", text);
    return NextResponse.json({ namesWithMeanings: JSON.parse(text) });
  } catch (error) {
    console.error("Błąd generowania:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
