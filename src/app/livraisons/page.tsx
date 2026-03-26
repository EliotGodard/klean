"use client";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LivraisonForm } from "@/components/livraison-form";
import { LivraisonsListe } from "@/components/livraisons-liste";
import { useState } from "react";

export default function LivraisonsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("recap");

  function handleDone() {
    setRefreshKey((k) => k + 1);
    setActiveTab("recap");
  }

  return (
    <>
      <PageHeader title="Livraisons" />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="recap" className="flex-1">
            Récapitulatif
          </TabsTrigger>
          <TabsTrigger value="ajouter" className="flex-1">
            Nouvelle livraison
          </TabsTrigger>
        </TabsList>
        <TabsContent value="recap">
          <LivraisonsListe key={refreshKey} />
        </TabsContent>
        <TabsContent value="ajouter">
          <LivraisonForm onDone={handleDone} />
        </TabsContent>
      </Tabs>
    </>
  );
}
