"use client";

import { useEffect, useState } from "react";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, X } from "lucide-react";
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

const FREQUENCES = [
  { value: "quotidien", label: "Quotidien" },
  { value: "hebdomadaire", label: "Hebdomadaire" },
  { value: "mensuel", label: "Mensuel" },
];

const JOURS_SEMAINE = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 7, label: "Dim" },
];

const JOURS_MOIS = Array.from({ length: 31 }, (_, i) => i + 1);

const emptyForm = {
  nom: "",
  categorie_id: "",
  frequence: "quotidien",
  jours: [] as number[],
};

export function NettoyageConfig({ onUpdate }: { onUpdate?: () => void }) {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipement | null>(null);
  const [deleting, setDeleting] = useState<Equipement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [catRes, eqRes] = await Promise.all([
        fetch("/api/categories-nettoyage"),
        fetch("/api/equipements-nettoyage"),
      ]);
      setCategories(await catRes.json());
      setEquipements(await eqRes.json());
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addCategorie() {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/categories-nettoyage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newCatName.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Catégorie ajoutée");
      setNewCatName("");
      setCatDialogOpen(false);
      load();
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategorie(id: string) {
    try {
      const res = await fetch("/api/categories-nettoyage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Catégorie supprimée");
      load();
    } catch {
      toast.error("Impossible de supprimer (équipements associés ?)");
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(e: Equipement) {
    setEditing(e);
    setForm({
      nom: e.nom,
      categorie_id: e.categorie_id,
      frequence: e.frequence,
      jours: e.jours || [],
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nom.trim() || !form.categorie_id) {
      toast.error("Nom et catégorie sont obligatoires");
      return;
    }

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing ? { id: editing.id } : {}),
        nom: form.nom,
        categorie_id: form.categorie_id,
        frequence: form.frequence,
        jours: form.frequence !== "quotidien" ? form.jours : null,
      };

      const res = await fetch("/api/equipements-nettoyage", {
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

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch("/api/equipements-nettoyage", {
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
      <CollapsibleCard title="Nettoyage">
        <p className="text-sm text-gray-500">Chargement…</p>
      </CollapsibleCard>
    );
  }

  // Group equipements by categorie
  const grouped = categories
    .map((cat) => ({
      ...cat,
      equipements: equipements.filter((e) => e.categorie_id === cat.id),
    }))
    .filter((g) => g.equipements.length > 0);

  const ungrouped = equipements.filter(
    (e) => !categories.find((c) => c.id === e.categorie_id)
  );

  return (
    <>
      <CollapsibleCard title="Nettoyage">
        <div className="flex justify-end gap-2 mb-3">
          <Button size="sm" variant="outline" onClick={() => setCatDialogOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Catégorie
          </Button>
          <Button size="sm" onClick={openAdd} disabled={categories.length === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
          {/* Categories badges */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((c) => (
                <Badge key={c.id} variant="secondary" className="flex items-center gap-1">
                  {c.nom}
                  <button
                    onClick={() => deleteCategorie(c.id)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">
              Créez d&apos;abord une catégorie (ex : Cuisine, Salle, Sanitaires).
            </p>
          ) : equipements.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun équipement configuré.
            </p>
          ) : (
            <div className="space-y-4">
              {grouped.map((group) => (
                <div key={group.id}>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    {group.nom}
                  </h3>
                  <div className="space-y-3">
                    {group.equipements.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-start justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{e.nom}</p>
                          <p className="text-xs text-gray-500 capitalize mt-1">
                            {e.frequence}
                            {e.jours && e.jours.length > 0 && e.frequence === "hebdomadaire" && (
                              <> · {e.jours.map((j) => JOURS_SEMAINE.find((d) => d.value === j)?.label).join(", ")}</>
                            )}
                            {e.jours && e.jours.length > 0 && e.frequence === "mensuel" && (
                              <> · le {e.jours[0]}</>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => { setDeleting(e); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {ungrouped.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Sans catégorie
                  </h3>
                  <div className="space-y-3">
                    {ungrouped.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-start justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{e.nom}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </CollapsibleCard>

      {/* Add categorie dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="cat-nom">Nom</Label>
            <Input
              id="cat-nom"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ex : Cuisine"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={addCategorie} disabled={saving || !newCatName.trim()}>
              {saving ? "Ajout…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit equipement dialog */}
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
                placeholder="Ex : Four"
              />
            </div>
            <div>
              <Label>Catégorie *</Label>
              <Select
                value={form.categorie_id}
                onValueChange={(v) => v && setForm({ ...form, categorie_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fréquence *</Label>
              <Select
                value={form.frequence}
                onValueChange={(v) => v && setForm({ ...form, frequence: v, jours: [] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.frequence === "hebdomadaire" && (
              <div>
                <Label className="mb-2 block">Jours de la semaine</Label>
                <div className="flex flex-wrap gap-3">
                  {JOURS_SEMAINE.map(({ value, label }) => (
                    <div key={value} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`jour-nett-${value}`}
                        checked={form.jours.includes(value)}
                        onCheckedChange={(checked) => {
                          const jours = checked
                            ? [...form.jours, value].sort((a, b) => a - b)
                            : form.jours.filter((j) => j !== value);
                          setForm({ ...form, jours });
                        }}
                      />
                      <Label htmlFor={`jour-nett-${value}`} className="text-sm">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {form.frequence === "mensuel" && (
              <div>
                <Label className="mb-2 block">Jour du mois</Label>
                <Select
                  value={form.jours.length > 0 ? String(form.jours[0]) : ""}
                  onValueChange={(v) => v && setForm({ ...form, jours: [Number(v)] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOURS_MOIS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Si le jour dépasse la fin du mois, le nettoyage sera déclenché le dernier jour du mois.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : editing ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;équipement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Supprimer <strong>{deleting?.nom}</strong> et son historique ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
