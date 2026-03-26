"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Fournisseur {
  id: string;
  nom: string;
}

interface NonConformite {
  raisons: string[];
  action_corrective: string;
}

interface Livraison {
  id: string;
  fournisseur_id: string;
  date: string;
  conforme: boolean;
  commentaire: string | null;
  fournisseurs: { nom: string } | null;
  non_conformites: NonConformite[] | null;
}

export function LivraisonsListe() {
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Livraison | null>(null);

  // Filters
  const [filterFournisseur, setFilterFournisseur] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterFournisseur !== "all") params.set("fournisseur_id", filterFournisseur);
      if (filterStatut !== "all") params.set("conforme", filterStatut);

      const [livRes, fournRes] = await Promise.all([
        fetch(`/api/livraisons?${params}`),
        fetch("/api/fournisseurs"),
      ]);
      setLivraisons(await livRes.json());
      setFournisseurs(await fournRes.json());
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [filterFournisseur, filterStatut]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Chargement…</p>;
  }

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filterFournisseur} onValueChange={(v) => v && setFilterFournisseur(v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Fournisseur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les fournisseurs</SelectItem>
              {fournisseurs.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatut} onValueChange={(v) => v && setFilterStatut(v)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="true">Conformes</SelectItem>
              <SelectItem value="false">Non conformes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {livraisons.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune livraison enregistrée.</p>
        ) : (
          livraisons.map((liv) => (
            <Card
              key={liv.id}
              className="cursor-pointer"
              onClick={() => setDetail(liv)}
            >
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm">
                    {liv.fournisseurs?.nom ?? "Fournisseur inconnu"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(liv.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="shrink-0 ml-2">
                  {liv.conforme ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail livraison</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {detail.fournisseurs?.nom}
                </p>
                <Badge variant={detail.conforme ? "secondary" : "destructive"}>
                  {detail.conforme ? "Conforme" : "Non conforme"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(detail.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {detail.commentaire && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Commentaire
                  </p>
                  <p className="text-sm">{detail.commentaire}</p>
                </div>
              )}
              {detail.non_conformites &&
                detail.non_conformites.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      Non-conformité
                    </p>
                    <div>
                      <p className="text-xs text-gray-500">Raisons :</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detail.non_conformites[0].raisons.map((r) => (
                          <Badge key={r} variant="outline" className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        Action corrective :
                      </p>
                      <p className="text-sm font-medium">
                        {detail.non_conformites[0].action_corrective}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
