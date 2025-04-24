import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { gender, theme, count } = await req.json();

    const prompt = `
    Generate a list of ${
      count || 10
    } unique baby names that are inspired by the theme "${theme}" and have English origin.
    Each name must be accompanied by a short 1–2 sentence summary that explains the name's origin and meaning.
    Only include names that are truly of English linguistic or historical origin.
    Return only a valid JSON array like this:
    [
      { "name": "Ash", "summary": "An English nature-inspired name referring to the ash tree, symbolizing resilience and wisdom." },
      ...
    ]
    Do not include explanations or extra text — return raw JSON only.
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
