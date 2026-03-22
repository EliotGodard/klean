import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Truck, SprayCan, FlaskConical } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Klean" />
      <div className="p-4 space-y-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Actions du jour
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Thermometer className="h-4 w-4 text-red-500" />
              <CardTitle className="text-sm">Température</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-gray-500">relevés effectués</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Truck className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm">Livraisons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-gray-500">contrôlées</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <SprayCan className="h-4 w-4 text-green-500" />
              <CardTitle className="text-sm">Nettoyage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-gray-500">effectués</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <FlaskConical className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-sm">Surfaces</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-gray-500">analysées</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
