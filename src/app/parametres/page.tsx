import { PageHeader } from "@/components/page-header";

export default function ParametresPage() {
  return (
    <>
      <PageHeader title="Paramètres" />
      <div className="p-4 space-y-6">
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
            Établissement
          </h2>
          <p className="text-gray-500">Jours d&apos;ouverture, fournisseurs…</p>
        </section>
      </div>
    </>
  );
}
