import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { id, description } = await req.json();

  if (!id || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  console.log("API input:", { id, description });

  const supabase = createServerSupabaseClient();

  console.log("Supabase instance created");

console.log("Updating Supabase:", { id, description }); // 👈 DODAJ TO

const { error } = await supabase
  .from("favorites")
  .update({ description })
  .eq("id", id);

  if (error) {
    console.error("Error updating description:", error);
    console.error("Supabase error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}