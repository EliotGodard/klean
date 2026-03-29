import { PageHeader } from "@/components/page-header";
import { JoursOuverture } from "@/components/jours-ouverture";
import { GestionFournisseurs } from "@/components/gestion-fournisseurs";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { TemperatureConfig } from "@/components/temperature-config";
import { NettoyageConfig } from "@/components/nettoyage-config";

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
          <div className="space-y-6">
            <GestionFournisseurs />
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400">Température</h3>
              <TemperatureConfig />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400">Nettoyage</h3>
              <NettoyageConfig />
            </div>
          </div>
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
