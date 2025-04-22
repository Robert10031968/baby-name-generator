import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const {
      id,
      name,
      gender,
      theme,
      email = "guest@example.com",
      meaning,
      origin,
      informativeDescription,
      poeticDescription,
      description,
    } = await req.json()

    // Validate input
    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Prepare the data object with only the required fields
    const favoriteData: any = {
      name,
      user_email: email,
    }

    // Add optional fields if provided
    if (gender) favoriteData.gender = gender
    if (theme) favoriteData.theme = theme
    if (meaning) favoriteData.meaning = meaning
    if (origin) favoriteData.origin = origin
    if (informativeDescription) favoriteData.informativeDescription = informativeDescription
    if (poeticDescription) favoriteData.poeticDescription = poeticDescription
    if (description) favoriteData.description = description

    // If an ID is provided, update the existing favorite
    if (id) {
      const { data, error } = await supabase.from("favorites").update(favoriteData).eq("id", id).select()

      if (error) {
        console.error("Error updating favorite:", error)
        return Response.json({ error: "Failed to update favorite" }, { status: 500 })
      }

      return Response.json({ success: true, data })
    }

    // Otherwise, insert a new favorite
    // First, try to get the table structure to see what columns exist
    const { error: inspectError, data: inspectData } = await supabase.from("favorites").select("*").limit(1)

    // If we have table structure info, only include fields that exist in the schema
    if (!inspectError && inspectData && inspectData.length > 0) {
      const sampleRow = inspectData[0]
      const newFavoriteData: any = {
        name,
        created_at: new Date().toISOString(),
        user_email: email,
      }

      // Only add fields that exist in the schema
      if ("gender" in sampleRow && gender) newFavoriteData.gender = gender
      if ("theme" in sampleRow && theme) newFavoriteData.theme = theme
      if ("meaning" in sampleRow && meaning) newFavoriteData.meaning = meaning
      if ("origin" in sampleRow && origin) newFavoriteData.origin = origin
      if ("informativeDescription" in sampleRow && informativeDescription)
        newFavoriteData.informativeDescription = informativeDescription
      if ("poeticDescription" in sampleRow && poeticDescription) newFavoriteData.poeticDescription = poeticDescription
      if ("description" in sampleRow && description) newFavoriteData.description = description

      // Insert the favorite name
      const { data, error } = await supabase.from("favorites").insert([newFavoriteData]).select()

      if (error) {
        console.error("Error saving favorite:", error)

        // Return a specific error code for schema mismatch
        if (
          error.message &&
          (error.message.includes("column") || error.message.includes("violates not-null constraint"))
        ) {
          return Response.json(
            {
              error: "Schema mismatch",
              details: error.message,
              fallbackToLocal: true,
            },
            { status: 422 },
          )
        }

        return Response.json({ error: "Failed to save favorite" }, { status: 500 })
      }

      return Response.json({ success: true, data })
    } else {
      // If we couldn't inspect the table, add only the basic fields
      favoriteData.created_at = new Date().toISOString()

      // Insert the favorite name
      const { data, error } = await supabase.from("favorites").insert([favoriteData]).select()

      if (error) {
        console.error("Error saving favorite:", error)
        return Response.json(
          {
            error: "Schema mismatch",
            details: error.message,
            fallbackToLocal: true,
          },
          { status: 422 },
        )
      }

      return Response.json({ success: true, data })
    }
  } catch (error) {
    console.error("Error saving favorite:", error)
    return Response.json({ error: "Failed to save favorite" }, { status: 500 })
  }
}
