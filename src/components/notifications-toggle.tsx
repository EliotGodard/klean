"use client";

import { useEffect, useState } from "react";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function NotificationsToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setLoading(false);
      return;
    }
    setSupported(true);

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
      setLoading(false);
    });
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID key not configured");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = sub.toJSON();
      await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      setSubscribed(true);
      toast.success("Notifications activées");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'activer les notifications");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Notifications désactivées");
    } catch {
      toast.error("Erreur lors de la désinscription");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <CollapsibleCard title="Notifications">
        <p className="text-sm text-gray-500">
          Les notifications push ne sont pas supportées par ce navigateur.
        </p>
      </CollapsibleCard>
    );
  }

  return (
    <CollapsibleCard title="Notifications">
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Recevez un rappel si un relevé de température n&apos;a pas été
          effectué à l&apos;heure prévue.
        </p>
        <Button
          variant={subscribed ? "outline" : "default"}
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          className="w-full"
        >
          {subscribed ? (
            <>
              <BellOff className="h-4 w-4 mr-2" />
              Désactiver les notifications
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Activer les notifications
            </>
          )}
        </Button>
      </div>
    </CollapsibleCard>
  );
}
