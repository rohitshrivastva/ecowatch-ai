import EnvironmentalDashboard from "@/components/platform/EnvironmentalDashboard";

export const metadata = {
  title: "Dashboard — EcoWatch",
  description:
    "Environmental health score and unified overview of air, water, climate, and weather.",
};

export default async function AppDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  return <EnvironmentalDashboard forceDefaultLocation={params.demo === "1"} />;
}
