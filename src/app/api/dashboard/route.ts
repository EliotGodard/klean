import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;
  const dayOfMonth = now.getDate();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  try {
    // All queries in parallel
    const [
      equipTempRes,
      relevesRes,
      equipNettRes,
      validationsRes,
      livraisonsRes,
      cycleRes,
    ] = await Promise.all([
      supabase.from("equipements_temperature").select("id"),
      supabase.from("releves_temperature").select("id, conforme").eq("date", today),
      supabase.from("equipements_nettoyage").select("id, frequence, jours"),
      supabase.from("validations_nettoyage").select("id, equipement_id, valide").eq("date", today),
      supabase.from("livraisons").select("id, conforme").gte("date", `${today}T00:00:00`).lte("date", `${today}T23:59:59`),
      supabase
        .from("cycles_analyse")
        .select("id, date, resultats_analyse(id, satisfaisant, plan_action, surfaces(nom))")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Temperature
    const tempTotal = equipTempRes.data?.length ?? 0;
    const tempDone = relevesRes.data?.length ?? 0;
    const tempKo = relevesRes.data?.filter((r) => !r.conforme).length ?? 0;

    // Nettoyage: count equipment due today
    const nettDueToday =
      equipNettRes.data?.filter((e) => {
        if (e.frequence === "quotidien") return true;
        if (!e.jours || e.jours.length === 0) return false;
        if (e.frequence === "mensuel") {
          const targetDay = e.jours[0];
          if (targetDay > lastDayOfMonth) return dayOfMonth === lastDayOfMonth;
          return dayOfMonth === targetDay;
        }
        return e.jours.includes(dayOfWeek);
      }) ?? [];
    const nettTotal = nettDueToday.length;
    const nettDone =
      validationsRes.data?.filter(
        (v) => v.valide && nettDueToday.some((e) => e.id === v.equipement_id)
      ).length ?? 0;

    // Livraisons
    const livTotal = livraisonsRes.data?.length ?? 0;
    const livNc = livraisonsRes.data?.filter((l) => !l.conforme).length ?? 0;

    // Analyse surfaces
    const cycle = cycleRes.data;
    const surfResultats = cycle?.resultats_analyse ?? [];
    const surfTotal = surfResultats.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const surfDone = surfResultats.filter((r: any) => r.satisfaisant !== null).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const surfNs = surfResultats.filter((r: any) => r.satisfaisant === false).length;
    const plansAction = surfResultats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.satisfaisant === false && r.plan_action)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({
        surface: r.surfaces?.nom,
        plan_action: r.plan_action,
      }));

    // Alerts
    const alerts: { type: string; module: string; message: string }[] = [];

    if (tempKo > 0) {
      alerts.push({
        type: "error",
        module: "temperature",
        message: `${tempKo} relevé${tempKo > 1 ? "s" : ""} non conforme${tempKo > 1 ? "s" : ""}`,
      });
    }
    if (tempTotal > 0 && tempDone < tempTotal) {
      alerts.push({
        type: "warning",
        module: "temperature",
        message: `${tempTotal - tempDone} relevé${tempTotal - tempDone > 1 ? "s" : ""} en attente`,
      });
    }
    if (livNc > 0) {
      alerts.push({
        type: "error",
        module: "livraisons",
        message: `${livNc} livraison${livNc > 1 ? "s" : ""} non conforme${livNc > 1 ? "s" : ""}`,
      });
    }
    if (surfNs > 0) {
      alerts.push({
        type: "error",
        module: "surfaces",
        message: `${surfNs} surface${surfNs > 1 ? "s" : ""} non satisfaisante${surfNs > 1 ? "s" : ""}`,
      });
    }

    return NextResponse.json({
      temperature: { total: tempTotal, done: tempDone, ko: tempKo },
      nettoyage: { total: nettTotal, done: nettDone },
      livraisons: { total: livTotal, nc: livNc },
      surfaces: {
        total: surfTotal,
        done: surfDone,
        ns: surfNs,
        cycleDate: cycle?.date ?? null,
        plansAction,
      },
      alerts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
