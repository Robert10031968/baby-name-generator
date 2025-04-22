import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { id, description } = await req.json()

    // Validate input
    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 })
    }

    if (!description) {
      return Response.json({ error: "Description is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // First check if the description column exists
    const { error: inspectError, data: inspectData } = await supabase.from("favorites").select("*").limit(1)

    // Check if the description column exists in the schema
    const hasDescriptionColumn =
      !inspectError && inspectData && inspectData.length > 0 && "description" in inspectData[0]

    if (!hasDescriptionColumn) {
      // If the column doesn't exist, try to add it
      try {
        const alterTableSQL = `
          ALTER TABLE public.favorites 
          ADD COLUMN IF NOT EXISTS description TEXT;
        `

        await supabase.rpc("exec_sql", { sql: alterTableSQL })

        // Verify the column was added
        const { error: verifyError } = await supabase.from("favorites").update({ description }).eq("id", id)

        if (verifyError) {
          throw new Error("Failed to add description column")
        }
      } catch (error) {
        console.error("Error adding description column:", error)
        return Response.json(
          {
            error: "Could not add description column to database",
            fallbackToLocal: true,
          },
          { status: 500 },
        )
      }
    }

    // Update only the description field
    const { error } = await supabase.from("favorites").update({ description }).eq("id", id)

    if (error) {
      console.error("Error updating description:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error updating description:", error)
    return Response.json({ error: "Failed to update description" }, { status: 500 })
  }
}
