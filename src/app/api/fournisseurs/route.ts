import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("fournisseurs")
    .select("*")
    .eq("archive", false)
    .order("nom");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("fournisseurs")
    .insert({
      nom: body.nom,
      categorie_produits: body.categorie_produits || null,
      telephone: body.telephone || null,
      email: body.email || null,
      numero_agrement: body.numero_agrement || null,
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
    .from("fournisseurs")
    .update({
      nom: body.nom,
      categorie_produits: body.categorie_produits || null,
      telephone: body.telephone || null,
      email: body.email || null,
      numero_agrement: body.numero_agrement || null,
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

  // Check if fournisseur has associated livraisons
  const { count } = await supabase
    .from("livraisons")
    .select("id", { count: "exact", head: true })
    .eq("fournisseur_id", id);

  if (count && count > 0) {
    // Archive instead of delete
    const { data, error } = await supabase
      .from("fournisseurs")
      .update({ archive: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...data, archived: true });
  }

  // No livraisons — hard delete
  const { error } = await supabase
    .from("fournisseurs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
