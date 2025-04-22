import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { theme, gender } = await req.json()

    // Validate input
    if (!theme) {
      return Response.json({ names: [], error: "Theme is required" }, { status: 400 })
    }

    // Determine gender prompt part
    let genderPrompt = ""
    if (gender === "boy") {
      genderPrompt = "boy (masculine)"
    } else if (gender === "girl") {
      genderPrompt = "girl (feminine)"
    } else {
      genderPrompt = "gender-neutral"
    }

    // Generate names using OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Generate 6 unique baby names for a ${genderPrompt} baby with the theme or inspiration: "${theme}".
      
      For each name, include:
      1. The name itself
      2. Its meaning
      3. Its origin or cultural background
      4. An informative description that includes origin, meaning, famous people with this name, history, and cultural significance
      5. A poetic description that includes the sound and feel of the name, emotional associations, mythological or natural connections, and a possible symbol that corresponds to the name
      
      Return the results as a JSON array of objects with the following structure:
      [
        {
          "name": "Name",
          "meaning": "Brief description of what the name means",
          "origin": "Cultural or linguistic origin of the name",
          "informativeDescription": "Detailed informative description covering origin, meaning, famous people, history, and cultural significance",
          "poeticDescription": "Lyrical description covering sound, emotional associations, connections, and symbolism"
        }
      ]
      
      Be creative but authentic with the meanings and origins. If creating a modern or invented name, provide a plausible meaning and origin based on linguistic patterns.`,
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Parse the response to get the names array
    let namesWithMeanings = []
    try {
      // The response should be a JSON array, but we'll handle potential formatting issues
      const cleanedText = text.trim().replace(/```json|```/g, "")
      namesWithMeanings = JSON.parse(cleanedText)

      // Ensure we have an array of objects
      if (!Array.isArray(namesWithMeanings)) {
        namesWithMeanings = []
      }
    } catch (error) {
      console.error("Failed to parse AI response:", error)
      return Response.json(
        {
          names: [],
          error: "Failed to parse AI response",
        },
        { status: 500 },
      )
    }

    return Response.json({ namesWithMeanings })
  } catch (error) {
    console.error("Error generating names:", error)
    return Response.json(
      {
        names: [],
        error: "Failed to generate names. Please try again.",
      },
      { status: 500 },
    )
  }
}
