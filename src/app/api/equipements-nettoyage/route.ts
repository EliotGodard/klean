import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("equipements_nettoyage")
    .select("*, categories_nettoyage(nom)")
    .order("nom");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("equipements_nettoyage")
    .insert({
      nom: body.nom,
      categorie_id: body.categorie_id,
      frequence: body.frequence,
      jours: body.jours || null,
    })
    .select("*, categories_nettoyage(nom)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("equipements_nettoyage")
    .update({
      nom: body.nom,
      categorie_id: body.categorie_id,
      frequence: body.frequence,
      jours: body.jours || null,
    })
    .eq("id", body.id)
    .select("*, categories_nettoyage(nom)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();

  const { error } = await supabase
    .from("equipements_nettoyage")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
