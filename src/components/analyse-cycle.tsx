"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertTriangle, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Surface {
  id: string;
  nom: string;
}

interface Resultat {
  id: string;
  cycle_id: string;
  surface_id: string;
  satisfaisant: boolean | null;
  plan_action: string | null;
  surfaces: { nom: string } | null;
}

interface Cycle {
  id: string;
  date: string;
  resultats_analyse: Resultat[];
}

/**
 * Weighted random selection favouring surfaces not recently tested.
 * `recentSurfaceIds` contains IDs from the last cycle — they get half weight.
 */
function pickRandomSurfaces(
  surfaces: Surface[],
  count: number,
  recentSurfaceIds: Set<string>
): Surface[] {
  if (surfaces.length <= count) return [...surfaces];

  // Build weighted pool
  const weighted = surfaces.map((s) => ({
    surface: s,
    weight: recentSurfaceIds.has(s.id) ? 1 : 2,
  }));

  const selected: Surface[] = [];
  const remaining = [...weighted];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, w) => sum + w.weight, 0);
    let rand = Math.random() * totalWeight;
    let idx = 0;
    for (let j = 0; j < remaining.length; j++) {
      rand -= remaining[j].weight;
      if (rand <= 0) {
        idx = j;
        break;
      }
    }
    selected.push(remaining[idx].surface);
    remaining.splice(idx, 1);
  }

  return selected;
}

export function AnalyseCycle() {
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Plan d'action dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [currentResultat, setCurrentResultat] = useState<Resultat | null>(null);
  const [planAction, setPlanAction] = useState("");

  const load = useCallback(async () => {
    try {
      const [surfRes, cycleRes] = await Promise.all([
        fetch("/api/surfaces"),
        fetch("/api/cycles-analyse?current=true"),
      ]);
      setSurfaces(await surfRes.json());
      const cycleData = await cycleRes.json();
      setCycle(cycleData);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startNewCycle() {
    if (surfaces.length === 0) {
      toast.error("Aucune surface configurée");
      return;
    }

    setSaving(true);
    try {
      // Get recent surface IDs from current cycle for rotation
      const recentIds = new Set(
        cycle?.resultats_analyse.map((r) => r.surface_id) ?? []
      );

      const selected = pickRandomSurfaces(surfaces, 3, recentIds);
      const today = new Date().toISOString().split("T")[0];

      const res = await fetch("/api/cycles-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          surface_ids: selected.map((s) => s.id),
        }),
      });
      if (!res.ok) throw new Error();

      toast.success("Nouveau cycle créé");
      load();
    } catch {
      toast.error("Erreur lors de la création du cycle");
    } finally {
      setSaving(false);
    }
  }

  async function markSatisfaisant(resultat: Resultat) {
    setSaving(true);
    try {
      const res = await fetch("/api/cycles-analyse", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultat_id: resultat.id,
          satisfaisant: true,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Résultat enregistré");
      load();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function markNonSatisfaisant(resultat: Resultat) {
    setCurrentResultat(resultat);
    setPlanAction("");
    setPlanDialogOpen(true);
  }

  async function submitPlanAction() {
    if (!planAction.trim()) {
      toast.error("Le plan d'action est obligatoire");
      return;
    }
    if (!currentResultat) return;

    setSaving(true);
    try {
      const res = await fetch("/api/cycles-analyse", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultat_id: currentResultat.id,
          satisfaisant: false,
          plan_action: planAction,
        }),
      });
      if (!res.ok) throw new Error();

      toast.success("Résultat et plan d'action enregistrés");
      setPlanDialogOpen(false);
      load();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Chargement…</p>;
  }

  if (surfaces.length === 0) {
    return (
      <p className="text-sm text-gray-500 p-4">
        Aucune surface configurée. Allez dans l&apos;onglet Configuration pour
        en ajouter.
      </p>
    );
  }

  const allDone =
    cycle?.resultats_analyse.every((r) => r.satisfaisant !== null) ?? false;
  const doneCount =
    cycle?.resultats_analyse.filter((r) => r.satisfaisant !== null).length ?? 0;
  const totalCount = cycle?.resultats_analyse.length ?? 0;

  return (
    <>
      <div className="p-4 space-y-4">
        {!cycle || allDone ? (
          <div className="text-center space-y-3 py-6">
            {cycle && allDone && (
              <p className="text-sm text-green-600 font-medium">
                Cycle terminé
              </p>
            )}
            <p className="text-sm text-gray-500">
              {cycle
                ? "Lancez un nouveau cycle pour tester 3 nouvelles surfaces."
                : "Aucun cycle en cours. Lancez une analyse."}
            </p>
            <Button onClick={startNewCycle} disabled={saving}>
              <FlaskConical className="h-4 w-4 mr-2" />
              {saving ? "Création…" : "Lancer un cycle d'analyse"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Cycle du{" "}
                {new Date(cycle.date + "T00:00:00").toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p className="text-sm text-gray-500">
                {doneCount}/{totalCount} analysées
              </p>
            </div>

            {cycle.resultats_analyse.map((r) => {
              const done = r.satisfaisant !== null;
              return (
                <Card
                  key={r.id}
                  className={cn(done && "opacity-60")}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {r.surfaces?.nom ?? "Surface inconnue"}
                      </p>
                      {done && (
                        r.satisfaisant ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )
                      )}
                    </div>

                    {!done && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => markSatisfaisant(r)}
                          disabled={saving}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                          Satisfaisant
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => markNonSatisfaisant(r)}
                          disabled={saving}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                          Non satisfaisant
                        </Button>
                      </div>
                    )}

                    {r.plan_action && (
                      <div className="bg-red-50 rounded p-2">
                        <p className="text-xs font-medium text-red-700">
                          Plan d&apos;action :
                        </p>
                        <p className="text-sm text-red-600">{r.plan_action}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Plan d'action dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan d&apos;action requis</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-red-600">
              Surface non satisfaisante :{" "}
              <strong>{currentResultat?.surfaces?.nom}</strong>
            </p>
            <div>
              <Label htmlFor="plan-action">Plan d&apos;action *</Label>
              <Textarea
                id="plan-action"
                value={planAction}
                onChange={(e) => setPlanAction(e.target.value)}
                placeholder="Décrivez les mesures correctives à mettre en place…"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlanDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={submitPlanAction}
              disabled={saving || !planAction.trim()}
            >
              {saving ? "Enregistrement…" : "Valider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
