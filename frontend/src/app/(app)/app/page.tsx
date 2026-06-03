import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "Dashboard — EcoWatch AI",
  description: "Environmental health overview, AI recommendations, and intelligence maps.",
};

export default async function AppDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  return <Dashboard forceDefaultLocation={params.demo === "1"} />;
}
