"use client";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyseCycle } from "@/components/analyse-cycle";
import { SurfacesConfig } from "@/components/surfaces-config";
import { useState } from "react";

export default function AnalyseSurfacesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <PageHeader title="Analyse des surfaces" />
      <Tabs defaultValue="analyse" className="w-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="analyse" className="flex-1">
            Analyse
          </TabsTrigger>
          <TabsTrigger value="config" className="flex-1">
            Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analyse">
          <AnalyseCycle key={refreshKey} />
        </TabsContent>
        <TabsContent value="config">
          <SurfacesConfig onUpdate={() => setRefreshKey((k) => k + 1)} />
        </TabsContent>
      </Tabs>
    </>
  );
}
