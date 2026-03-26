"use client";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemperatureReleves } from "@/components/temperature-releves";
import { TemperatureConfig } from "@/components/temperature-config";
import { useState } from "react";

export default function TemperaturePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <PageHeader title="Température" />
      <Tabs defaultValue="releves" className="w-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="releves" className="flex-1">
            Relevés du jour
          </TabsTrigger>
          <TabsTrigger value="config" className="flex-1">
            Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="releves">
          <TemperatureReleves key={refreshKey} />
        </TabsContent>
        <TabsContent value="config">
          <TemperatureConfig onUpdate={() => setRefreshKey((k) => k + 1)} />
        </TabsContent>
      </Tabs>
    </>
  );
}
