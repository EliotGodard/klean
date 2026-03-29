"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Equipement {
  id: string;
  nom: string;
  emplacement: string | null;
  temp_min: number;
  temp_max: number;
}

interface Configuration {
  id: string;
  heure_releve_temperature: string;
}

const emptyForm = {
  nom: "",
  emplacement: "",
  temp_min: "",
  temp_max: "",
};

export function TemperatureConfig({
  onUpdate,
}: {
  onUpdate?: () => void;
}) {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [heureReleve, setHeureReleve] = useState("08:00");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipement | null>(null);
  const [deleting, setDeleting] = useState<Equipement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [eqRes, cfgRes] = await Promise.all([
        fetch("/api/equipements-temperature"),
        fetch("/api/configuration"),
      ]);
      setEquipements(await eqRes.json());
      const cfg = await cfgRes.json();
      setConfig(cfg);
      setHeureReleve(cfg.heure_releve_temperature?.slice(0, 5) ?? "08:00");
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(e: Equipement) {
    setEditing(e);
    setForm({
      nom: e.nom,
      emplacement: e.emplacement || "",
      temp_min: String(e.temp_min),
      temp_max: String(e.temp_max),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const min = parseFloat(form.temp_min);
    const max = parseFloat(form.temp_max);
    if (isNaN(min) || isNaN(max)) {
      toast.error("Les températures doivent être des nombres");
      return;
    }
    if (min >= max) {
      toast.error("La température min doit être inférieure à la max");
      return;
    }

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing ? { id: editing.id } : {}),
        nom: form.nom,
        emplacement: form.emplacement,
        temp_min: min,
        temp_max: max,
      };

      const res = await fetch("/api/equipements-temperature", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();

      toast.success(editing ? "Équipement modifié" : "Équipement ajouté");
      setDialogOpen(false);
      load();
      onUpdate?.();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function saveHeureReleve(heure: string) {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/configuration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, heure_releve_temperature: heure }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConfig(data);
      setHeureReleve(data.heure_releve_temperature?.slice(0, 5) ?? "08:00");
      toast.success("Heure de relevé enregistrée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch("/api/equipements-temperature", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleting.id }),
      });
      if (!res.ok) throw new Error();

      toast.success("Équipement supprimé");
      setDeleteDialogOpen(false);
      setDeleting(null);
      load();
      onUpdate?.();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-500">Chargement…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Heure de relevé</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-3">
            <Label htmlFor="global-heure" className="text-sm shrink-0">
              Heure de relevé pour tous les équipements
            </Label>
            <Input
              id="global-heure"
              type="time"
              className="w-32"
              value={heureReleve}
              onChange={(e) => setHeureReleve(e.target.value)}
              disabled={saving}
            />
            <Button
              size="sm"
              onClick={() => saveHeureReleve(heureReleve)}
              disabled={saving || heureReleve === (config?.heure_releve_temperature?.slice(0, 5) ?? "08:00")}
            >
              {saving ? "…" : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Températures</CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {equipements.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun équipement configuré.
            </p>
          ) : (
            <div className="space-y-3">
              {equipements.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{e.nom}</p>
                    {e.emplacement && (
                      <p className="text-xs text-gray-500 mt-1">{e.emplacement}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {e.temp_min}°C — {e.temp_max}°C
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => {
                        setDeleting(e);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l'équipement" : "Nouvel équipement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="eq-nom">Nom *</Label>
              <Input
                id="eq-nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex : Chambre froide 1"
              />
            </div>
            <div>
              <Label htmlFor="eq-emplacement">Emplacement</Label>
              <Input
                id="eq-emplacement"
                value={form.emplacement}
                onChange={(e) =>
                  setForm({ ...form, emplacement: e.target.value })
                }
                placeholder="Ex : Cuisine"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="eq-min">T° min (°C) *</Label>
                <Input
                  id="eq-min"
                  type="number"
                  step="0.1"
                  value={form.temp_min}
                  onChange={(e) =>
                    setForm({ ...form, temp_min: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="eq-max">T° max (°C) *</Label>
                <Input
                  id="eq-max"
                  type="number"
                  step="0.1"
                  value={form.temp_max}
                  onChange={(e) =>
                    setForm({ ...form, temp_max: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : editing ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;équipement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Supprimer <strong>{deleting?.nom}</strong> et tous ses relevés
            associés ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
