"use client";

import { useEffect, useState } from "react";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

const JOURS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

interface Configuration {
  id: string;
  jours_ouverture: number[];
  fermetures_exceptionnelles: string[];
  frequence_analyse_surfaces: string;
  jour_analyse_surfaces: number;
}

export function JoursOuverture() {
  const [config, setConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFermeture, setNewFermeture] = useState("");

  useEffect(() => {
    fetch("/api/configuration")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erreur lors du chargement de la configuration");
        setLoading(false);
      });
  }, []);

  async function save(updated: Configuration) {
    setSaving(true);
    try {
      const res = await fetch("/api/configuration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConfig(data);
      toast.success("Configuration enregistrée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function toggleJour(jour: number) {
    if (!config) return;
    const jours = config.jours_ouverture.includes(jour)
      ? config.jours_ouverture.filter((j) => j !== jour)
      : [...config.jours_ouverture, jour].sort((a, b) => a - b);
    const updated = { ...config, jours_ouverture: jours };
    setConfig(updated);
    save(updated);
  }

  function addFermeture() {
    if (!config || !newFermeture) return;
    if (config.fermetures_exceptionnelles.includes(newFermeture)) {
      toast.error("Cette date est déjà ajoutée");
      return;
    }
    const updated = {
      ...config,
      fermetures_exceptionnelles: [
        ...config.fermetures_exceptionnelles,
        newFermeture,
      ].sort(),
    };
    setConfig(updated);
    setNewFermeture("");
    save(updated);
  }

  function removeFermeture(date: string) {
    if (!config) return;
    const updated = {
      ...config,
      fermetures_exceptionnelles: config.fermetures_exceptionnelles.filter(
        (d) => d !== date
      ),
    };
    setConfig(updated);
    save(updated);
  }

  if (loading) {
    return (
      <CollapsibleCard title="Jours d'ouverture">
        <p className="text-sm text-gray-500">Chargement…</p>
      </CollapsibleCard>
    );
  }

  if (!config) return null;

  return (
    <CollapsibleCard title="Jours d'ouverture">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {JOURS.map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`jour-${value}`}
                checked={config.jours_ouverture.includes(value)}
                onCheckedChange={() => toggleJour(value)}
                disabled={saving}
              />
              <Label htmlFor={`jour-${value}`} className="text-sm">
                {label}
              </Label>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Fermetures exceptionnelles
          </Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={newFermeture}
              onChange={(e) => setNewFermeture(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={addFermeture}
              disabled={!newFermeture || saving}
            >
              Ajouter
            </Button>
          </div>
          {config.fermetures_exceptionnelles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.fermetures_exceptionnelles.map((date) => (
                <Badge
                  key={date}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  <button
                    onClick={() => removeFermeture(date)}
                    className="ml-1 hover:text-red-500"
                    disabled={saving}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </CollapsibleCard>
  );
}
