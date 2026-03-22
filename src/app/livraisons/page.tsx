import { PageHeader } from "@/components/page-header";

export default function LivraisonsPage() {
  return (
    <>
      <PageHeader title="Livraisons" />
      <div className="p-4">
        <p className="text-gray-500">Aucune livraison enregistrée.</p>
      </div>
    </>
  );
}
