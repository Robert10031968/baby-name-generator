import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const prompt = `
Write a poetic and imaginative description of the baby name "${name}".
Your answer must contain **at least 3 distinct paragraphs** and be **at least 150 words long**.

Include:
- The etymology and meaning of the name (if known)
- Its historical or cultural use (real or symbolic)
- Notable people or literary references (if any)
- Emotional and symbolic associations
- Phonetic character and overall impression

Even if the name is common or well-known, do not shorten the answer.
Use lyrical language, rich metaphors and evoke emotional imagery.
This should read like a mini-essay or narrative.

Do not list bullet points. Write in flowing prose.
`.trim();

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        max_tokens: 1200,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are a creative assistant that always writes beautiful, poetic and informative name descriptions. Every response must be at least 150 words long and feel emotionally rich.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const json = await openaiRes.json();
    console.log("🧠 FULL GPT RESPONSE:", JSON.stringify(json, null, 2));
    const text = json?.choices?.[0]?.message?.content;

    if (!text || text.split(" ").length < 50) {
      return NextResponse.json({
        description:
          `This name appears to be fresh and unique. There might be no known history or famous bearers yet — but your child could be the first to shape its story.`,
      });
    }

    return NextResponse.json({ description: text });
  } catch (error) {
    console.error("OpenAI fetch error:", error);
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
