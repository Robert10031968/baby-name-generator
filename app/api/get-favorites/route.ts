import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(req: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Try to get favorites
    const { data, error } = await supabase.from("favorites").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching favorites:", error)
      return Response.json({ favorites: [] })
    }

    // Ensure each favorite has at least the required fields
    const processedFavorites = data.map((favorite) => {
      return {
        id: favorite.id || crypto.randomUUID(),
        name: favorite.name,
        gender: favorite.gender || undefined,
        theme: favorite.theme || undefined,
        created_at: favorite.created_at || new Date().toISOString(),
        user_email: favorite.user_email || "guest@example.com",
        meaning: favorite.meaning || "Information not available",
        origin: favorite.origin || "Unknown",
        informativeDescription: favorite.informativeDescription || null,
        poeticDescription: favorite.poeticDescription || null,
        description: favorite.description || null,
      }
    })

    return Response.json({ favorites: processedFavorites || [] })
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return Response.json({ favorites: [] })
  }
}
