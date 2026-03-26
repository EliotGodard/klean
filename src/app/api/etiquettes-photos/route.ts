import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fournisseurId = searchParams.get("fournisseur_id");

  let query = supabase
    .from("etiquettes_photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (fournisseurId) {
    query = query.eq("fournisseur_id", fournisseurId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const fournisseurId = formData.get("fournisseur_id") as string;
  const file = formData.get("photo") as File;

  if (!fournisseurId || !file) {
    return NextResponse.json(
      { error: "fournisseur_id et photo sont requis" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${fournisseurId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("etiquettes")
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("etiquettes").getPublicUrl(fileName);

  // Save reference in DB
  const { data, error } = await supabase
    .from("etiquettes_photos")
    .insert({
      fournisseur_id: fournisseurId,
      photo_url: publicUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
