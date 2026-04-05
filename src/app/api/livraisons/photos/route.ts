import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const formData = await request.formData();
  const livraisonId = formData.get("livraison_id") as string;
  const file = formData.get("photo") as File;

  if (!livraisonId || !file) {
    return NextResponse.json(
      { error: "livraison_id et photo sont requis" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage (bucket "livraisons" must exist in Supabase)
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${livraisonId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("livraisons")
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("livraisons").getPublicUrl(fileName);

  // Save reference in DB
  const { data, error } = await supabase
    .from("livraison_photos")
    .insert({
      livraison_id: livraisonId,
      photo_url: publicUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
