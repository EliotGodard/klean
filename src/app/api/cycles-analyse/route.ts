import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: fetch current cycle with results, or list all cycles
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const current = searchParams.get("current");

  if (current === "true") {
    // Get the most recent cycle
    const { data: cycle, error } = await supabase
      .from("cycles_analyse")
      .select("*, resultats_analyse(*, surfaces(nom))")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(cycle || null);
  }

  // List all cycles
  const { data, error } = await supabase
    .from("cycles_analyse")
    .select("*, resultats_analyse(*, surfaces(nom))")
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: create a new cycle with random surface selection
export async function POST(request: Request) {
  const body = await request.json();
  const surfaceIds: string[] = body.surface_ids;
  const date: string = body.date;

  // Create cycle
  const { data: cycle, error: cycleError } = await supabase
    .from("cycles_analyse")
    .insert({ date })
    .select()
    .single();

  if (cycleError) {
    return NextResponse.json({ error: cycleError.message }, { status: 500 });
  }

  // Create empty results for selected surfaces
  const resultats = surfaceIds.map((sid) => ({
    cycle_id: cycle.id,
    surface_id: sid,
    satisfaisant: null,
    plan_action: null,
  }));

  const { error: resError } = await supabase
    .from("resultats_analyse")
    .insert(resultats);

  if (resError) {
    return NextResponse.json({ error: resError.message }, { status: 500 });
  }

  // Return the full cycle with results
  const { data, error } = await supabase
    .from("cycles_analyse")
    .select("*, resultats_analyse(*, surfaces(nom))")
    .eq("id", cycle.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT: update a result (satisfaisant + plan_action)
export async function PUT(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("resultats_analyse")
    .update({
      satisfaisant: body.satisfaisant,
      plan_action: body.plan_action || null,
    })
    .eq("id", body.resultat_id)
    .select("*, surfaces(nom)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
