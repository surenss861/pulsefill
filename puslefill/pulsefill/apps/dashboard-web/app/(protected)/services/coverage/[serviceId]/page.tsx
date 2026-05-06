import { ServiceCoverageDrilldownPageClient } from "@/components/services/service-coverage-drilldown-page-client";
import { requireCurrentUser } from "@/lib/get-current-user";

export default async function ServiceCoverageDrilldownPage(props: { params: Promise<{ serviceId: string }> }) {
  await requireCurrentUser();
  const { serviceId } = await props.params;
  return <ServiceCoverageDrilldownPageClient serviceId={serviceId} />;
}
