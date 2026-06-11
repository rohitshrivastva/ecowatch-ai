import Link from "next/link";
import { Droplets, ArrowRight, Waves } from "lucide-react";

const SOLUTIONS = [
  {
    href: "/app/solutions/water",
    title: "Water Management",
    description:
      "Dynamic Water Crisis Intelligence — NDVI/NDWI overlays, drought detection, reservoir monitoring, and AI insights.",
    icon: Droplets,
    accent: "text-cyan-600 bg-cyan-50 border-cyan-200",
    available: true,
  },
  {
    href: "#",
    title: "Climate Risk Scoring",
    description: "Regional climate anomaly detection and risk scoring (coming soon).",
    icon: Waves,
    accent: "text-violet-600 bg-violet-50 border-violet-200",
    available: false,
  },
];

export default function SolutionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-eco-text">Solutions</h1>
        <p className="text-sm text-eco-muted mt-2 max-w-2xl">
          Earth observation and environmental intelligence modules for
          EcoWatch.cloud — built for global coverage and scalable monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SOLUTIONS.map((item) => {
          const Icon = item.icon;
          const inner = (
            <div
              className={`glass-panel p-6 rounded-2xl border transition-shadow h-full ${
                item.available
                  ? "hover:shadow-md cursor-pointer"
                  : "opacity-70 cursor-not-allowed"
              }`}
            >
              <div
                className={`inline-flex p-2.5 rounded-xl border mb-4 ${item.accent}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-eco-text">{item.title}</h2>
              <p className="text-sm text-eco-muted mt-2 leading-relaxed">
                {item.description}
              </p>
              {item.available && (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-eco-primary mt-4">
                  Open module
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </div>
          );

          return item.available ? (
            <Link key={item.href} href={item.href}>
              {inner}
            </Link>
          ) : (
            <div key={item.title}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
