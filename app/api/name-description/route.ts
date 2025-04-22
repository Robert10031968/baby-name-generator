import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { name } = await req.json()

  const prompt = `
Write a rich and imaginative description of the baby name "${name}". Combine both factual and poetic elements into one unified paragraph.

Include:
- The origin and etymology of the name (if known)
- Its historical and cultural context
- Notable people who had this name (if any)
- Emotional and symbolic associations the name evokes
- The way it sounds phonetically and the impression it leaves

If the name is newly invented or has no known history, say that it is a fresh and original name with no historical record yet — and suggest that the child bearing it might be the first to write its story.

Write in an elegant, lyrical tone. Make it engaging and meaningful in one cohesive block of text.
`

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    temperature: 0.7,
    maxTokens: 800,
  })

  return NextResponse.json({ description: text })
}
