import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("configuration")
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("configuration")
    .update({
      jours_ouverture: body.jours_ouverture,
      fermetures_exceptionnelles: body.fermetures_exceptionnelles,
      frequence_analyse_surfaces: body.frequence_analyse_surfaces,
      jour_analyse_surfaces: body.jour_analyse_surfaces,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
