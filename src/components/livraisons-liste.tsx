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
import { CheckCircle2, AlertTriangle, Phone, Mail, Tag, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Fournisseur {
  id: string;
  nom: string;
}

interface FournisseurDetail {
  nom: string;
  categorie_produits: string | null;
  telephone: string | null;
  email: string | null;
  numero_agrement: string | null;
}

interface NonConformite {
  raisons: string[];
  action_corrective: string;
}

interface LivraisonPhoto {
  id: string;
  photo_url: string;
}

interface Livraison {
  id: string;
  fournisseur_id: string;
  date: string;
  conforme: boolean;
  commentaire: string | null;
  fournisseurs: FournisseurDetail | null;
  non_conformites: NonConformite | NonConformite[] | null;
  livraison_photos: LivraisonPhoto[] | null;
}

function getNonConformite(nc: NonConformite | NonConformite[] | null): NonConformite | null {
  if (!nc) return null;
  if (Array.isArray(nc)) return nc.length > 0 ? nc[0] : null;
  return nc;
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
            <div className="space-y-4">
              {/* Header: supplier name + conformity badge */}
              <div className="flex items-center justify-between">
                <p className="font-medium text-base">
                  {detail.fournisseurs?.nom}
                </p>
                <Badge variant={detail.conforme ? "secondary" : "destructive"}>
                  {detail.conforme ? "Conforme" : "Non conforme"}
                </Badge>
              </div>

              {/* Date */}
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

              {/* Supplier details */}
              {detail.fournisseurs && (
                <div className="space-y-1 rounded-md bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Fournisseur
                  </p>
                  {detail.fournisseurs.categorie_produits && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-3.5 w-3.5 text-gray-400" />
                      <span>{detail.fournisseurs.categorie_produits}</span>
                    </div>
                  )}
                  {detail.fournisseurs.numero_agrement && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span>Agrément : {detail.fournisseurs.numero_agrement}</span>
                    </div>
                  )}
                  {detail.fournisseurs.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <a href={`tel:${detail.fournisseurs.telephone}`} className="text-blue-600 underline">
                        {detail.fournisseurs.telephone}
                      </a>
                    </div>
                  )}
                  {detail.fournisseurs.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <a href={`mailto:${detail.fournisseurs.email}`} className="text-blue-600 underline">
                        {detail.fournisseurs.email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Comment */}
              {detail.commentaire && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Commentaire
                  </p>
                  <p className="text-sm mt-1">{detail.commentaire}</p>
                </div>
              )}

              {/* Non-conformity details */}
              {(() => {
                const nc = getNonConformite(detail.non_conformites);
                if (!nc) return null;
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      Non-conformité
                    </p>
                    <div>
                      <p className="text-xs text-gray-500">Raisons :</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {nc.raisons.map((r) => (
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
                        {nc.action_corrective}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Photos */}
              {detail.livraison_photos &&
                detail.livraison_photos.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                      <ImageIcon className="h-3.5 w-3.5 inline mr-1" />
                      Photos ({detail.livraison_photos.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {detail.livraison_photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={photo.photo_url}
                            alt="Photo livraison"
                            className="rounded-md w-full h-24 object-cover border"
                          />
                        </a>
                      ))}
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
