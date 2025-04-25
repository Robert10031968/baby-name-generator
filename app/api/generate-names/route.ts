import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildPrompt(theme: string, gender: string, count: number) {
  const baseCount = count || 10;
  const themeLower = theme.toLowerCase();

  if (
    themeLower.includes("mix of") ||
    themeLower.includes("combine") ||
    themeLower.includes("blend")
  ) {
    return `
Create a list of ${baseCount} creative baby names that are blends or variations of the names: ${theme}.
Each name should sound natural and beautiful.
Return only raw JSON in this format:
[
  { "name": "Ancinna", "summary": "A blend of Anna and Marcin, symbolizing unity and originality." },
  ...
]
Do not include comments, explanations, or introductions.
    `;
  }

  if (themeLower.includes("english") || themeLower.includes("angielskie")) {
    return `
Generate a list of ${baseCount} baby names that match the theme "${theme}" and are of English origin only.
Each name should have a short summary (1–2 sentences) with its origin and meaning.
Return raw JSON:
[
  { "name": "Ash", "summary": "An English name inspired by the ash tree, symbolizing resilience and wisdom." },
  ...
]
Do not add any introductory text or formatting.
    `;
  }

  // default
  return `
Generate a list of ${baseCount} unique ${
    gender === "neutral" ? "gender-neutral" : gender
  } baby names inspired by the theme "${theme}".
Each name should include a short summary (1–2 sentences) explaining the name's origin and meaning.
Return raw JSON like:
[
  { "name": "Nova", "summary": "A modern name inspired by the stars, symbolizing brightness and new beginnings." },
  ...
]
Do not include any extra commentary or explanation.
  `;
}

export async function POST(req: Request) {
  try {
    const { gender, theme, count } = await req.json();
    const prompt = buildPrompt(theme, gender, count);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content || "";
    console.log("🔍 OpenAI Response:", text);

    return NextResponse.json({ namesWithMeanings: JSON.parse(text) });
  } catch (error) {
    console.error("❌ Generation Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
