import { PageHeader } from "@/components/page-header";
import { JoursOuverture } from "@/components/jours-ouverture";
import { GestionFournisseurs } from "@/components/gestion-fournisseurs";
import { NotificationsToggle } from "@/components/notifications-toggle";

export default function ParametresPage() {
  return (
    <>
      <PageHeader title="Paramètres" />
      <div className="p-4 space-y-6">
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Établissement
          </h2>
          <JoursOuverture />
        </section>
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Référentiel
          </h2>
          <GestionFournisseurs />
        </section>
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Rappels
          </h2>
          <NotificationsToggle />
        </section>
      </div>
    </>
  );
}
