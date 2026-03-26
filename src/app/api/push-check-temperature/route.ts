import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import webpush from "web-push";

// VAPID keys should be in env vars in production
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@klean.app";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

/**
 * This endpoint checks for overdue temperature readings and sends
 * push notifications. It should be called by a cron job or manually.
 */
export async function POST() {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 }
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Check opening days
  const { data: config } = await supabase
    .from("configuration")
    .select("jours_ouverture, fermetures_exceptionnelles")
    .single();

  if (config) {
    const jsDay = new Date().getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    if (!config.jours_ouverture.includes(dayOfWeek)) {
      return NextResponse.json({ message: "Jour fermé", sent: 0 });
    }
    if (config.fermetures_exceptionnelles?.includes(today)) {
      return NextResponse.json({ message: "Fermeture exceptionnelle", sent: 0 });
    }
  }

  // Get equipment where heure_releve <= now
  const { data: equipements } = await supabase
    .from("equipements_temperature")
    .select("id, nom, heure_releve")
    .lte("heure_releve", now);

  if (!equipements || equipements.length === 0) {
    return NextResponse.json({ message: "Aucun équipement à vérifier", sent: 0 });
  }

  // Get today's readings
  const { data: releves } = await supabase
    .from("releves_temperature")
    .select("equipement_id")
    .eq("date", today);

  const doneIds = new Set(releves?.map((r) => r.equipement_id) ?? []);
  const overdue = equipements.filter((e) => !doneIds.has(e.id));

  if (overdue.length === 0) {
    return NextResponse.json({ message: "Tous les relevés sont à jour", sent: 0 });
  }

  // Get all push subscriptions
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ message: "Aucun abonné push", sent: 0 });
  }

  // Send notifications
  let sent = 0;
  const names = overdue.map((e) => e.nom).join(", ");
  const payload = JSON.stringify({
    title: "Relevé de température en attente",
    body: `${overdue.length} équipement${overdue.length > 1 ? "s" : ""} en attente : ${names}`,
    url: "/temperature",
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        payload
      );
      sent++;
    } catch {
      // Subscription expired — clean up
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", sub.endpoint);
    }
  }

  return NextResponse.json({
    message: `${sent} notification${sent > 1 ? "s" : ""} envoyée${sent > 1 ? "s" : ""}`,
    sent,
    overdue: overdue.map((e) => e.nom),
  });
}
