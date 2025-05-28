import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchWikipediaSummary(name: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();

    if (data.extract && !data.extract.includes("may refer to")) {
      return data.extract;
    }

    return null;
  } catch (err) {
    console.error("❌ Wikipedia fetch error:", err);
    return null;
  }
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const wikiText = await fetchWikipediaSummary(name);

  let prompt = "";

  if (wikiText) {
    prompt = `Using the following text from Wikipedia:\n\n"${wikiText}"\n\nGenerate a symbolic, poetic, and informative baby name description for the name "${name}". Include cultural, historical and emotional context.`;
  } else {
    prompt = `Generate a symbolic, poetic, and informative baby name description for the name "${name}". Include origin, meaning, and emotional tone. Length: approx. 600-800 characters.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 700,
    });

    const description = completion.choices[0].message.content;
    return NextResponse.json({ description });
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    return NextResponse.json({ error: "Failed to generate description." }, { status: 500 });
  }
}
