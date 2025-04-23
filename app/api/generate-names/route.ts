import { OpenAIStream, StreamingTextResponse } from "ai";
import { OpenAI } from "openai";

const openai = new OpenAI();

export async function POST(req: Request) {
  const { gender, theme, count } = await req.json();

  const prompt = `
Wygeneruj listę ${count || 10} unikalnych imion ${
    gender === "neutral" ? "" : gender === "female" ? "żeńskich" : "męskich"
  } z krótkim opisem (maksymalnie 1–2 zdania). 
Opis powinien zawierać pochodzenie imienia oraz jego ogólne znaczenie. 
Nie dodawaj długich wstępów ani wyjaśnień.
Zwróć dane w formacie JSON:
[
  { "name": "Aveline", "summary": "Francuskie imię z XI wieku, symbolizujące siłę i światło." },
  ...
]
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages: [{ role: "user", content: prompt }],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
