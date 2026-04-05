"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertTriangle, ArrowLeft, Camera, X } from "lucide-react";
import { toast } from "sonner";

interface Fournisseur {
  id: string;
  nom: string;
  categorie_produits: string | null;
}

const RAISONS_NC = [
  "Température non respectée",
  "Emballage endommagé",
  "DLC dépassée",
  "Quantité incorrecte",
  "Produit non conforme",
  "Étiquetage manquant",
];

const ACTIONS_CORRECTIVES = [
  "Refus de la marchandise",
  "Acceptation sous réserve",
  "Demande d'avoir",
  "Retour fournisseur",
];

type Step = "fournisseur" | "conformite" | "non-conformite";

export function LivraisonForm({ onDone }: { onDone: () => void }) {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState<Step>("fournisseur");
  const [fournisseurId, setFournisseurId] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [raisons, setRaisons] = useState<string[]>([]);
  const [actionCorrective, setActionCorrective] = useState("");

  useEffect(() => {
    fetch("/api/fournisseurs")
      .then((res) => res.json())
      .then(setFournisseurs)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function saveLivraison(conforme: boolean) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        fournisseur_id: fournisseurId,
        conforme,
        commentaire: commentaire || null,
      };
      if (!conforme) {
        body.raisons = raisons;
        body.action_corrective = actionCorrective;
      }

      const res = await fetch("/api/livraisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const livraison = await res.json();

      // Upload photos
      for (const { file } of photos) {
        const fd = new FormData();
        fd.append("livraison_id", livraison.id);
        fd.append("photo", file);
        await fetch("/api/livraisons/photos", { method: "POST", body: fd });
      }

      toast.success(
        conforme ? "Livraison conforme enregistrée" : "Non-conformité enregistrée"
      );
      onDone();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function handleConforme() {
    saveLivraison(true);
  }

  function handleNonConforme() {
    setStep("non-conformite");
  }

  function handleSubmitNC() {
    if (raisons.length === 0) {
      toast.error("Sélectionnez au moins une raison");
      return;
    }
    if (!actionCorrective) {
      toast.error("Sélectionnez une action corrective");
      return;
    }
    saveLivraison(false);
  }

  function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length > 0) {
      const entries = newFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setPhotos((prev) => [...prev, ...entries]);
    }
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function toggleRaison(raison: string) {
    setRaisons((prev) =>
      prev.includes(raison) ? prev.filter((r) => r !== raison) : [...prev, raison]
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Chargement…</p>;
  }

  return (
    <div className="p-4 space-y-4">
      {step !== "fournisseur" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep(step === "non-conformite" ? "conformite" : "fournisseur")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
      )}

      {step === "fournisseur" && (
        <>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            1. Sélectionner le fournisseur
          </h2>
          {fournisseurs.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun fournisseur. Ajoutez-en dans Paramètres.
            </p>
          ) : (
            <div className="space-y-2">
              {fournisseurs.map((f) => (
                <Card
                  key={f.id}
                  className={`cursor-pointer transition-colors ${
                    fournisseurId === f.id ? "ring-2 ring-green-500" : ""
                  }`}
                  onClick={() => setFournisseurId(f.id)}
                >
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{f.nom}</p>
                    {f.categorie_produits && (
                      <p className="text-xs text-gray-500">{f.categorie_produits}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Button
            className="w-full"
            disabled={!fournisseurId}
            onClick={() => setStep("conformite")}
          >
            Continuer
          </Button>
        </>
      )}

      {step === "conformite" && (
        <>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            2. Conformité de la livraison
          </h2>
          <div>
            <Label htmlFor="liv-comment">Commentaire (optionnel)</Label>
            <Textarea
              id="liv-comment"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Observations…"
            />
          </div>
          <div>
            <Label>Photos (optionnel)</Label>
            <div className="mt-1 space-y-2">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(({ preview }, i) => (
                    <div key={i} className="relative">
                      <img
                        src={preview}
                        alt={`Photo ${i + 1}`}
                        className="rounded-md w-full h-20 object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-3 cursor-pointer text-sm text-gray-500 hover:border-gray-400 transition-colors">
                <Camera className="h-4 w-4" />
                Prendre ou ajouter une photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleAddPhotos}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant="outline"
              onClick={handleConforme}
              disabled={saving}
            >
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              Conforme
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={handleNonConforme}
              disabled={saving}
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Non conforme
            </Button>
          </div>
        </>
      )}

      {step === "non-conformite" && (
        <>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            3. Détail de la non-conformité
          </h2>
          <div className="space-y-3">
            <Label>Raisons *</Label>
            {RAISONS_NC.map((raison) => (
              <div key={raison} className="flex items-center gap-2">
                <Checkbox
                  checked={raisons.includes(raison)}
                  onCheckedChange={() => toggleRaison(raison)}
                />
                <Label className="text-sm">{raison}</Label>
              </div>
            ))}
          </div>
          <div>
            <Label>Action corrective *</Label>
            <Select value={actionCorrective} onValueChange={(v) => v && setActionCorrective(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS_CORRECTIVES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={handleSubmitNC}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer la non-conformité"}
          </Button>
        </>
      )}
    </div>
  );
}
