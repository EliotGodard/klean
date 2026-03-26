"use client";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NettoyageChecklist } from "@/components/nettoyage-checklist";
import { NettoyageConfig } from "@/components/nettoyage-config";
import { useState } from "react";

export default function NettoyagePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <PageHeader title="Nettoyage" />
      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="checklist" className="flex-1">
            Nettoyage du jour
          </TabsTrigger>
          <TabsTrigger value="config" className="flex-1">
            Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="checklist">
          <NettoyageChecklist key={refreshKey} />
        </TabsContent>
        <TabsContent value="config">
          <NettoyageConfig onUpdate={() => setRefreshKey((k) => k + 1)} />
        </TabsContent>
      </Tabs>
    </>
  );
}
