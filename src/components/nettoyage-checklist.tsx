"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Categorie {
  id: string;
  nom: string;
}

interface Equipement {
  id: string;
  nom: string;
  categorie_id: string;
  frequence: string;
  jours: number[] | null;
  categories_nettoyage: { nom: string } | null;
}

interface Validation {
  id: string;
  equipement_id: string;
  date: string;
  valide: boolean;
}

function isDueToday(eq: Equipement, dayOfWeek: number, today: Date): boolean {
  if (eq.frequence === "quotidien") return true;
  if (!eq.jours || eq.jours.length === 0) return false;
  if (eq.frequence === "mensuel") {
    const dayOfMonth = today.getDate();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const targetDay = eq.jours[0];
    // If target day exceeds last day of month, trigger on last day
    if (targetDay > lastDayOfMonth) return dayOfMonth === lastDayOfMonth;
    return dayOfMonth === targetDay;
  }
  return eq.jours.includes(dayOfWeek);
}

export function NettoyageChecklist() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  // JS: 0=Sunday, convert to 1=Monday...7=Sunday
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  const load = useCallback(async () => {
    try {
      const [catRes, eqRes, valRes] = await Promise.all([
        fetch("/api/categories-nettoyage"),
        fetch("/api/equipements-nettoyage"),
        fetch(`/api/validations-nettoyage?date=${today}`),
      ]);
      setCategories(await catRes.json());
      setEquipements(await eqRes.json());
      setValidations(await valRes.json());
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const dueToday = equipements.filter((e) => isDueToday(e, dayOfWeek, now));
  const doneCount = dueToday.filter((e) =>
    validations.find((v) => v.equipement_id === e.id && v.valide)
  ).length;

  async function toggleValidation(equipementId: string, currentlyDone: boolean) {
    try {
      const res = await fetch("/api/validations-nettoyage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipement_id: equipementId,
          date: today,
          valide: !currentlyDone,
        }),
      });
      if (!res.ok) throw new Error();
      load();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Chargement…</p>;
  }

  if (dueToday.length === 0) {
    return (
      <p className="text-sm text-gray-500 p-4">
        Aucun nettoyage prévu aujourd&apos;hui. Allez dans Configuration pour
        ajouter des équipements.
      </p>
    );
  }

  // Group by category
  const grouped = categories
    .map((cat) => ({
      ...cat,
      equipements: dueToday.filter((e) => e.categorie_id === cat.id),
    }))
    .filter((g) => g.equipements.length > 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {doneCount}/{dueToday.length} effectués
        </p>
        {doneCount === dueToday.length && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Terminé</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${(doneCount / dueToday.length) * 100}%` }}
        />
      </div>

      {grouped.map((group) => (
        <div key={group.id}>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
            {group.nom}
          </h3>
          <div className="space-y-2">
            {group.equipements.map((eq) => {
              const isDone = validations.some(
                (v) => v.equipement_id === eq.id && v.valide
              );
              return (
                <Card
                  key={eq.id}
                  className={isDone ? "opacity-60" : undefined}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={() => toggleValidation(eq.id, isDone)}
                    />
                    <Label
                      className={`text-sm flex-1 ${isDone ? "line-through text-gray-400" : ""}`}
                    >
                      {eq.nom}
                    </Label>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
