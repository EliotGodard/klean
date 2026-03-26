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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Fournisseur {
  id: string;
  nom: string;
  categorie_produits: string | null;
  telephone: string | null;
  email: string | null;
  numero_agrement: string | null;
  archive: boolean;
}

const emptyForm = {
  nom: "",
  categorie_produits: "",
  telephone: "",
  email: "",
  numero_agrement: "",
};

export function GestionFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fournisseur | null>(null);
  const [deleting, setDeleting] = useState<Fournisseur | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadFournisseurs() {
    try {
      const res = await fetch("/api/fournisseurs");
      const data = await res.json();
      setFournisseurs(data);
    } catch {
      toast.error("Erreur lors du chargement des fournisseurs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFournisseurs();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(f: Fournisseur) {
    setEditing(f);
    setForm({
      nom: f.nom,
      categorie_produits: f.categorie_produits || "",
      telephone: f.telephone || "",
      email: f.email || "",
      numero_agrement: f.numero_agrement || "",
    });
    setDialogOpen(true);
  }

  function openDelete(f: Fournisseur) {
    setDeleting(f);
    setDeleteDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...form, id: editing.id } : form;

      const res = await fetch("/api/fournisseurs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      toast.success(editing ? "Fournisseur modifié" : "Fournisseur ajouté");
      setDialogOpen(false);
      loadFournisseurs();
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
      const res = await fetch("/api/fournisseurs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleting.id }),
      });

      if (!res.ok) throw new Error();

      const result = await res.json();
      if (result.archived) {
        toast.success("Fournisseur archivé (livraisons existantes)");
      } else {
        toast.success("Fournisseur supprimé");
      }

      setDeleteDialogOpen(false);
      setDeleting(null);
      loadFournisseurs();
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Fournisseurs</CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {fournisseurs.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun fournisseur enregistré.
            </p>
          ) : (
            <div className="space-y-3">
              {fournisseurs.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{f.nom}</p>
                    {f.categorie_produits && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {f.categorie_produits}
                      </Badge>
                    )}
                    {(f.telephone || f.email) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {[f.telephone, f.email].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {f.numero_agrement && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Agrément : {f.numero_agrement}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(f)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => openDelete(f)}
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

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom du fournisseur"
              />
            </div>
            <div>
              <Label htmlFor="categorie">Catégorie de produits</Label>
              <Input
                id="categorie"
                value={form.categorie_produits}
                onChange={(e) =>
                  setForm({ ...form, categorie_produits: e.target.value })
                }
                placeholder="Ex : Fruits & légumes"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={form.telephone}
                  onChange={(e) =>
                    setForm({ ...form, telephone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="agrement">N° agrément sanitaire</Label>
              <Input
                id="agrement"
                value={form.numero_agrement}
                onChange={(e) =>
                  setForm({ ...form, numero_agrement: e.target.value })
                }
                placeholder="Optionnel"
              />
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le fournisseur</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer{" "}
            <strong>{deleting?.nom}</strong> ? Si des livraisons sont associées,
            le fournisseur sera archivé.
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
