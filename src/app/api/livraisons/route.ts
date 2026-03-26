import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fournisseurId = searchParams.get("fournisseur_id");
  const conforme = searchParams.get("conforme");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("livraisons")
    .select("*, fournisseurs(nom), non_conformites(*), livraison_photos(*)")
    .order("date", { ascending: false });

  if (fournisseurId) query = query.eq("fournisseur_id", fournisseurId);
  if (conforme !== null && conforme !== "") query = query.eq("conforme", conforme === "true");
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  // 1. Create the livraison
  const { data: livraison, error: livError } = await supabase
    .from("livraisons")
    .insert({
      fournisseur_id: body.fournisseur_id,
      conforme: body.conforme,
      commentaire: body.commentaire || null,
    })
    .select()
    .single();

  if (livError) {
    return NextResponse.json({ error: livError.message }, { status: 500 });
  }

  // 2. If non conforme, create non_conformite
  if (!body.conforme && body.raisons && body.action_corrective) {
    const { error: ncError } = await supabase
      .from("non_conformites")
      .insert({
        livraison_id: livraison.id,
        raisons: body.raisons,
        action_corrective: body.action_corrective,
      });

    if (ncError) {
      return NextResponse.json({ error: ncError.message }, { status: 500 });
    }
  }

  return NextResponse.json(livraison, { status: 201 });
}
