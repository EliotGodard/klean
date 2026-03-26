"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Thermometer,
  Truck,
  SprayCan,
  FlaskConical,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardData {
  temperature: { total: number; done: number; ko: number };
  nettoyage: { total: number; done: number };
  livraisons: { total: number; nc: number };
  surfaces: {
    total: number;
    done: number;
    ns: number;
    cycleDate: string | null;
    plansAction: { surface: string; plan_action: string }[];
  };
  alerts: { type: string; module: string; message: string }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const t = data?.temperature;
  const n = data?.nettoyage;
  const l = data?.livraisons;
  const s = data?.surfaces;

  return (
    <>
      <PageHeader title="Klean" />
      <div className="p-4 space-y-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Actions du jour
        </h2>

        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <div className="space-y-2">
            {data.alerts.map((alert, i) => (
              <Link
                key={i}
                href={`/${alert.module === "temperature" ? "temperature" : alert.module === "livraisons" ? "livraisons" : "analyse-surfaces"}`}
              >
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    alert.type === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {alert.message}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Module cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/temperature">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                <CardTitle className="text-sm">Température</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {loading ? "—" : `${t?.done}/${t?.total}`}
                </p>
                <p className="text-xs text-gray-500">relevés effectués</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/livraisons">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Truck className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm">Livraisons</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {loading ? "—" : l?.total}
                </p>
                <p className="text-xs text-gray-500">contrôlées aujourd&apos;hui</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/nettoyage">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <SprayCan className="h-4 w-4 text-green-500" />
                <CardTitle className="text-sm">Nettoyage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {loading ? "—" : `${n?.done}/${n?.total}`}
                </p>
                <p className="text-xs text-gray-500">effectués</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analyse-surfaces">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <FlaskConical className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm">Surfaces</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {loading ? "—" : `${s?.done}/${s?.total}`}
                </p>
                <p className="text-xs text-gray-500">analysées</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Plans d'action ouverts */}
        {s?.plansAction && s.plansAction.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Plans d&apos;action en cours
            </h3>
            {s.plansAction.map((p, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <p className="text-xs font-medium text-red-600">
                    {p.surface}
                  </p>
                  <p className="text-sm">{p.plan_action}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
