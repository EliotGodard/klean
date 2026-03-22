import { PageHeader } from "@/components/page-header";

export default function TemperaturePage() {
  return (
    <>
      <PageHeader title="Température" />
      <div className="p-4">
        <p className="text-gray-500">Aucun équipement configuré.</p>
      </div>
    </>
  );
}
