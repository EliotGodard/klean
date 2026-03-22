import { PageHeader } from "@/components/page-header";

export default function TracabilitePage() {
  return (
    <>
      <PageHeader title="Traçabilité" />
      <div className="p-4">
        <p className="text-gray-500">Aucun fournisseur enregistré.</p>
      </div>
    </>
  );
}
