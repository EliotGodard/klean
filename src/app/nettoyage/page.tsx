import { PageHeader } from "@/components/page-header";
import { NettoyageChecklist } from "@/components/nettoyage-checklist";

export default function NettoyagePage() {
  return (
    <>
      <PageHeader title="Nettoyage" />
      <NettoyageChecklist />
    </>
  );
}
