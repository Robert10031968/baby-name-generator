import { createServerSupabaseClient } from "@/lib/supabase"

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Delete the favorite with the specified ID
    const { error } = await supabase.from("favorites").delete().eq("id", id)

    if (error) {
      console.error("Error deleting favorite:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, message: "Favorite deleted successfully" })
  } catch (error) {
    console.error("Error deleting favorite:", error)
    return Response.json({ error: "Failed to delete favorite" }, { status: 500 })
  }
}
