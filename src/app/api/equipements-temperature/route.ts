import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("equipements_temperature")
    .select("*")
    .order("nom");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("equipements_temperature")
    .insert({
      nom: body.nom,
      emplacement: body.emplacement || null,
      temp_min: body.temp_min,
      temp_max: body.temp_max,
      heure_releve: body.heure_releve,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("equipements_temperature")
    .update({
      nom: body.nom,
      emplacement: body.emplacement || null,
      temp_min: body.temp_min,
      temp_max: body.temp_max,
      heure_releve: body.heure_releve,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();

  const { error } = await supabase
    .from("equipements_temperature")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
