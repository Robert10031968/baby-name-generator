import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(req: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Create the table directly using SQL
    const { error } = await supabase.from("favorites").select("id").limit(1)

    if (error && error.message.includes('relation "favorites" does not exist')) {
      // Table doesn't exist, create it
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.favorites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          gender TEXT,
          theme TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow all operations" ON public.favorites
          FOR ALL
          USING (true)
          WITH CHECK (true);
      `

      // Execute the SQL directly
      const { error: createError } = await supabase.rpc("exec_sql", { sql: createTableSQL })

      if (createError) {
        console.error("Error creating table:", createError)
        return Response.json({ success: false, error: createError.message })
      }

      return Response.json({ success: true, message: "Table created successfully" })
    }

    return Response.json({ success: true, message: "Table already exists" })
  } catch (error) {
    console.error("Error creating table:", error)
    return Response.json({ success: false, error: error.message })
  }
}
