"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CheckCircle2, AlertTriangle, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Equipement {
  id: string;
  nom: string;
  emplacement: string | null;
  temp_min: number;
  temp_max: number;
  heure_releve: string;
}

interface Releve {
  id: string;
  equipement_id: string;
  date: string;
  valeur: number | null;
  conforme: boolean;
  action_corrective: string | null;
  commentaire: string | null;
}

const ACTIONS_CORRECTIVES = [
  "Appeler le technicien",
  "Déplacer les produits",
  "Régler le thermostat",
  "Vérifier la fermeture de porte",
  "Autre",
];

export function TemperatureReleves() {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [releves, setReleves] = useState<Releve[]>([]);
  const [loading, setLoading] = useState(true);

  // Saisie dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [current, setCurrent] = useState<Equipement | null>(null);
  const [saisieMode, setSaisieMode] = useState<"rapide" | "valeur">("rapide");
  const [valeur, setValeur] = useState("");
  const [saving, setSaving] = useState(false);

  // Action corrective dialog
  const [correctiveOpen, setCorrectiveOpen] = useState(false);
  const [actionCorrective, setActionCorrective] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [pendingReleve, setPendingReleve] = useState<{
    equipement_id: string;
    valeur: number | null;
    conforme: boolean;
  } | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    try {
      const [eqRes, relRes] = await Promise.all([
        fetch("/api/equipements-temperature"),
        fetch(`/api/releves-temperature?date=${today}`),
      ]);
      setEquipements(await eqRes.json());
      setReleves(await relRes.json());
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  function getReleve(equipementId: string) {
    return releves.find((r) => r.equipement_id === equipementId);
  }

  function openSaisie(eq: Equipement) {
    if (getReleve(eq.id)) return; // already done
    setCurrent(eq);
    setSaisieMode("rapide");
    setValeur("");
    setDialogOpen(true);
  }

  async function saveReleve(
    equipementId: string,
    valeurNum: number | null,
    conforme: boolean,
    action: string | null,
    comment: string | null
  ) {
    setSaving(true);
    try {
      const res = await fetch("/api/releves-temperature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipement_id: equipementId,
          date: today,
          valeur: valeurNum,
          conforme,
          action_corrective: action,
          commentaire: comment,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Relevé enregistré");
      setDialogOpen(false);
      setCorrectiveOpen(false);
      load();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function handleRapide(conforme: boolean) {
    if (!current) return;
    if (!conforme) {
      setPendingReleve({
        equipement_id: current.id,
        valeur: null,
        conforme: false,
      });
      setActionCorrective("");
      setCommentaire("");
      setDialogOpen(false);
      setCorrectiveOpen(true);
    } else {
      saveReleve(current.id, null, true, null, null);
    }
  }

  function handleValeur() {
    if (!current) return;
    const v = parseFloat(valeur);
    if (isNaN(v)) {
      toast.error("Saisissez une valeur numérique");
      return;
    }
    const conforme = v >= current.temp_min && v <= current.temp_max;
    if (!conforme) {
      setPendingReleve({
        equipement_id: current.id,
        valeur: v,
        conforme: false,
      });
      setActionCorrective("");
      setCommentaire("");
      setDialogOpen(false);
      setCorrectiveOpen(true);
    } else {
      saveReleve(current.id, v, true, null, null);
    }
  }

  function handleCorrective() {
    if (!pendingReleve || !actionCorrective) {
      toast.error("Sélectionnez une action corrective");
      return;
    }
    saveReleve(
      pendingReleve.equipement_id,
      pendingReleve.valeur,
      false,
      actionCorrective,
      commentaire || null
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Chargement…</p>;
  }

  if (equipements.length === 0) {
    return (
      <p className="text-sm text-gray-500 p-4">
        Aucun équipement configuré. Allez dans l&apos;onglet Configuration pour
        en ajouter.
      </p>
    );
  }

  const done = equipements.filter((e) => getReleve(e.id)).length;

  return (
    <>
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-500">
          {done}/{equipements.length} relevés effectués
        </p>

        {equipements.map((eq) => {
          const releve = getReleve(eq.id);
          return (
            <Card
              key={eq.id}
              className={cn(
                "cursor-pointer transition-colors",
                releve && "opacity-70"
              )}
              onClick={() => openSaisie(eq)}
            >
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm">{eq.nom}</p>
                  {eq.emplacement && (
                    <p className="text-xs text-gray-500">{eq.emplacement}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {eq.temp_min}°C — {eq.temp_max}°C
                  </p>
                </div>
                <div className="shrink-0 ml-2">
                  {releve ? (
                    releve.conforme ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    )
                  ) : (
                    <Thermometer className="h-6 w-6 text-gray-300" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Saisie dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{current?.nom}</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Seuils : {current.temp_min}°C — {current.temp_max}°C
              </p>

              <div className="flex gap-2">
                <Button
                  variant={saisieMode === "rapide" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSaisieMode("rapide")}
                >
                  Rapide (OK/KO)
                </Button>
                <Button
                  variant={saisieMode === "valeur" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSaisieMode("valeur")}
                >
                  Valeur mesurée
                </Button>
              </div>

              {saisieMode === "rapide" ? (
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => handleRapide(true)}
                    disabled={saving}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    OK
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => handleRapide(false)}
                    disabled={saving}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    KO
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="temp-val">Température mesurée (°C)</Label>
                    <Input
                      id="temp-val"
                      type="number"
                      step="0.1"
                      value={valeur}
                      onChange={(e) => setValeur(e.target.value)}
                      placeholder="Ex : 3.5"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleValeur}
                    disabled={saving || !valeur}
                  >
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action corrective dialog */}
      <Dialog open={correctiveOpen} onOpenChange={setCorrectiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Action corrective requise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-red-600">
              Température non conforme. Veuillez sélectionner une action
              corrective.
            </p>
            <div>
              <Label>Action corrective *</Label>
              <Select
                value={actionCorrective}
                onValueChange={(v) => v && setActionCorrective(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une action…" />
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
            <div>
              <Label htmlFor="temp-comment">Commentaire</Label>
              <Textarea
                id="temp-comment"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Précisions optionnelles…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCorrectiveOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCorrective}
              disabled={saving || !actionCorrective}
            >
              {saving ? "Enregistrement…" : "Valider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
