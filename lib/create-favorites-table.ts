import { createServerSupabaseClient } from "./supabase"

export async function ensureFavoritesTableExists() {
  const supabase = createServerSupabaseClient()

  try {
    // First try to use the RPC function
    const { error: rpcError } = await supabase.rpc("create_favorites_table_if_not_exists")

    if (!rpcError) {
      return true // Table exists or was created successfully
    }

    console.warn("RPC function failed, trying direct SQL approach:", rpcError)

    // If RPC fails, try direct SQL approach
    const { error: sqlError } = await supabase.from("favorites").select("id").limit(1)

    if (!sqlError || !sqlError.message.includes('relation "favorites" does not exist')) {
      return true // Table exists
    }

    // Table doesn't exist, create it
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        gender TEXT,
        theme TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      -- Add RLS policies if they don't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'Allow all operations'
        ) THEN
          ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Allow all operations" ON public.favorites
            FOR ALL
            USING (true)
            WITH CHECK (true);
        END IF;
      END
      $$;
    `

    const { error: createError } = await supabase.rpc("exec_sql", { sql: createTableQuery })

    if (createError) {
      console.error("Failed to create favorites table:", createError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error ensuring favorites table exists:", error)
    return false
  }
}
