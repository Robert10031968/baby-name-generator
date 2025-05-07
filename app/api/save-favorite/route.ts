import { createServerSupabaseClient } from "@/lib/supabase";

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
    } = await req.json();

    console.log("➡️ Save Favorite - received:", {
      name,
      gender,
      theme,
      email,
      description,
      informativeDescription,
      poeticDescription,
    });

    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createServerSupabaseClient();

    const favoriteData: Record<string, any> = {
      name,
      user_email: email,
    };

    if (gender) favoriteData.gender = gender;
    if (theme) favoriteData.theme = theme;
    if (meaning) favoriteData.meaning = meaning;
    if (origin) favoriteData.origin = origin;
    if (informativeDescription) favoriteData.informativeDescription = informativeDescription;
    if (poeticDescription) favoriteData.poeticDescription = poeticDescription;
    if (description) favoriteData.description = description;

    // UPDATE jeśli jest ID
    if (id) {
      const { data, error } = await supabase
        .from("favorites")
        .update(favoriteData)
        .eq("id", id)
        .select();

      if (error) {
        console.error("❌ [UPDATE] Error updating favorite:", error.message || error);
        return new Response(JSON.stringify({ error: "Failed to update favorite" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // INSERT jeśli brak ID
    const { error: inspectError, data: inspectData } = await supabase.from("favorites").select("*").limit(1);

    if (!inspectError && inspectData && inspectData.length > 0) {
      const sampleRow = inspectData[0];
      const newFavoriteData: Record<string, any> = {
        name,
        created_at: new Date().toISOString(),
        user_email: email,
      };

      if ("gender" in sampleRow && gender) newFavoriteData.gender = gender;
      if ("theme" in sampleRow && theme) newFavoriteData.theme = theme;
      if ("meaning" in sampleRow && meaning) newFavoriteData.meaning = meaning;
      if ("origin" in sampleRow && origin) newFavoriteData.origin = origin;
      if ("informativeDescription" in sampleRow && informativeDescription)
        newFavoriteData.informativeDescription = informativeDescription;
      if ("poeticDescription" in sampleRow && poeticDescription)
        newFavoriteData.poeticDescription = poeticDescription;
      if ("description" in sampleRow && description) newFavoriteData.description = description;

      const { data, error } = await supabase.from("favorites").insert([newFavoriteData]).select();

      if (error) {
        console.error("❌ [INSERT] Error saving favorite:", error.message || error);
        return new Response(JSON.stringify({ error: "Failed to save favorite" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      favoriteData.created_at = new Date().toISOString();

      const { data, error } = await supabase.from("favorites").insert([favoriteData]).select();

      if (error) {
        console.error("❌ [FALLBACK] Error saving favorite:", error.message || error);
        return new Response(JSON.stringify({ error: "Failed to save favorite" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("❌ [CATCH] Unexpected error saving favorite:", error.message || error);
    return new Response(JSON.stringify({ error: "Failed to save favorite" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}