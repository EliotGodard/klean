"use client";

import { useEffect, useState, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Camera, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Fournisseur {
  id: string;
  nom: string;
  categorie_produits: string | null;
  telephone: string | null;
  email: string | null;
  numero_agrement: string | null;
}

interface EtiquettePhoto {
  id: string;
  fournisseur_id: string;
  photo_url: string;
  created_at: string;
}

export default function TracabilitePage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Fournisseur | null>(null);
  const [photos, setPhotos] = useState<EtiquettePhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/fournisseurs")
      .then((res) => res.json())
      .then(setFournisseurs)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function loadPhotos(fournisseurId: string) {
    setPhotosLoading(true);
    try {
      const res = await fetch(
        `/api/etiquettes-photos?fournisseur_id=${fournisseurId}`
      );
      setPhotos(await res.json());
    } catch {
      toast.error("Erreur lors du chargement des photos");
    } finally {
      setPhotosLoading(false);
    }
  }

  function openFournisseur(f: Fournisseur) {
    setSelected(f);
    loadPhotos(f.id);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("fournisseur_id", selected.id);
      formData.append("photo", file);

      const res = await fetch("/api/etiquettes-photos", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();

      toast.success("Photo enregistrée");
      loadPhotos(selected.id);
    } catch {
      toast.error("Erreur lors de l'envoi de la photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const filtered = fournisseurs.filter(
    (f) =>
      f.nom.toLowerCase().includes(search.toLowerCase()) ||
      f.categorie_produits?.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <>
        <PageHeader title="Traçabilité" />
        <div className="p-4 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>

          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="font-medium">{selected.nom}</p>
              {selected.categorie_produits && (
                <Badge variant="secondary">{selected.categorie_produits}</Badge>
              )}
              {selected.telephone && (
                <p className="text-sm text-gray-500">
                  Tél : {selected.telephone}
                </p>
              )}
              {selected.email && (
                <p className="text-sm text-gray-500">
                  Email : {selected.email}
                </p>
              )}
              {selected.numero_agrement && (
                <p className="text-sm text-gray-500">
                  Agrément : {selected.numero_agrement}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Étiquettes
            </h3>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-1" />
                {uploading ? "Envoi…" : "Prendre une photo"}
              </Button>
            </div>
          </div>

          {photosLoading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : photos.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune étiquette.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo) => (
                <Card
                  key={photo.id}
                  className="overflow-hidden cursor-pointer"
                  onClick={() => setPreviewUrl(photo.photo_url)}
                >
                  <img
                    src={photo.photo_url}
                    alt="Étiquette"
                    className="w-full h-32 object-cover"
                  />
                  <CardContent className="p-2">
                    <p className="text-xs text-gray-500">
                      {new Date(photo.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Étiquette</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Étiquette"
                className="w-full rounded"
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Traçabilité" />
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un fournisseur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">
            {fournisseurs.length === 0
              ? "Aucun fournisseur enregistré. Ajoutez-en dans Paramètres."
              : "Aucun résultat."}
          </p>
        ) : (
          filtered.map((f) => (
            <Card
              key={f.id}
              className="cursor-pointer"
              onClick={() => openFournisseur(f)}
            >
              <CardContent className="p-3">
                <p className="font-medium text-sm">{f.nom}</p>
                {f.categorie_produits && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {f.categorie_produits}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
