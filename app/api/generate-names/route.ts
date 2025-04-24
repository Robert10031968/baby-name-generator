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
    } baby names with a short summary (1–2 sentences max).
    Each summary should include the name's origin and general meaning.
    Return the data as JSON in this format:
    [
      { "name": "Aveline", "summary": "A French name from the 11th century, symbolizing strength and light." },
      ...
    ]
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
