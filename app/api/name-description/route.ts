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
  const { name, short } = await req.json();
  const wikiText = await fetchWikipediaSummary(name);

  let prompt = "";

  if (short) {
    prompt = wikiText
  ? `Using the following text from Wikipedia:\n\n"${wikiText}"\n\nYou are an expert baby name specialist and creative writer.

Your task is to generate a rich, poetic and informative description of the name "${name}" for new parents.

The description should be approximately 150-200 words, written as one cohesive text without sections.

Please include:
- The cultural and linguistic origins of the name (if known)
- Famous people who have this name (if known)
- Symbolic and emotional associations of the name
- Phonetic qualities and the impression the name makes
- The personality traits typically associated with this name

If the name is newly invented or of unknown origin, please write a creative poetic interpretation — inspiring and imaginative.

Do NOT include any section titles.
Write in a flowing, elegant style — engaging and visually beautiful.

Begin.`
  : `You are an expert baby name specialist and creative writer.

Your task is to generate a rich, poetic and informative description of the name "${name}" for new parents.

The description should be approximately 150-200 words, written as one cohesive text without sections.

Please include:
- The cultural and linguistic origins of the name (if known)
- Famous people who have this name (if known)
- Symbolic and emotional associations of the name
- Phonetic qualities and the impression the name makes
- The personality traits typically associated with this name

If the name is newly invented or of unknown origin, please write a creative poetic interpretation — inspiring and imaginative.

Do NOT include any section titles.
Write in a flowing, elegant style — engaging and visually beautiful.

Begin.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: short ? 0.4 : 0.7,
      max_tokens: short ? 600 : 2000,
    });

    const output = completion.choices[0].message.content?.trim() || "";

    if (short) {
      return NextResponse.json({
        meaning: output,
        history: wikiText || "",
        usedWiki: !!wikiText,
      });
    } else {
      return NextResponse.json({
        meaning: "",
        history: output,
        usedWiki: !!wikiText,
      });
    }
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    return NextResponse.json({ error: "Failed to generate description." }, { status: 500 });
  }
}