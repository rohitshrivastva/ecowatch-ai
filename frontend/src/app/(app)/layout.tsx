import PlatformNav from "@/components/platform/PlatformNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-eco-surface/30">
      <PlatformNav />
      <main className="flex-1 page-container py-8">{children}</main>
    </div>
  );
}
