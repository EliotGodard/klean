import { PageHeader } from "@/components/page-header";
import { TemperatureReleves } from "@/components/temperature-releves";

export default function TemperaturePage() {
  return (
    <>
      <PageHeader title="Température" />
      <TemperatureReleves />
    </>
  );
}
