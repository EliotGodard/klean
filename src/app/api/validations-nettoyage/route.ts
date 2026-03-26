import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  let query = supabase
    .from("validations_nettoyage")
    .select("*")
    .order("created_at", { ascending: false });

  if (date) {
    query = query.eq("date", date);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  // Upsert: if already exists for this equipement+date, update it
  const { data, error } = await supabase
    .from("validations_nettoyage")
    .upsert(
      {
        equipement_id: body.equipement_id,
        date: body.date,
        valide: body.valide,
        validated_at: body.valide ? new Date().toISOString() : null,
      },
      { onConflict: "equipement_id,date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
