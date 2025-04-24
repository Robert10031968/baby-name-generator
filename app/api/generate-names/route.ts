import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { gender, theme, count } = await req.json();

    const prompt = `
Wygeneruj listę ${count || 10} unikalnych imion ${
      gender === "neutral" ? "" : gender === "female" ? "żeńskich" : "męskich"
    } z krótkim opisem (maksymalnie 1–2 zdania).
Opis powinien zawierać pochodzenie imienia oraz jego ogólne znaczenie.
Zwróć dane w formacie JSON:
[
  { "name": "Aveline", "summary": "Francuskie imię z XI wieku, symbolizujące siłę i światło." },
  ...
]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content || "";

    return NextResponse.json({ namesWithMeanings: JSON.parse(text) });
  } catch (error) {
    console.error("Błąd generowania:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
