import Link from "next/link";
import { ArrowRight, Leaf, Map, Sparkles, Shield } from "lucide-react";
import { getAppUrl } from "@/lib/app-url";

const features = [
  {
    icon: Sparkles,
    title: "AI Environmental Assistant",
    description:
      "Get clear risk levels, why they matter, and actionable steps—not dozens of raw metrics.",
  },
  {
    icon: Map,
    title: "Interactive Intelligence Maps",
    description:
      "Explore AQI, temperature, vegetation, and risk heatmaps one layer at a time.",
  },
  {
    icon: Shield,
    title: "Localized Recommendations",
    description:
      "Plantation, cooling, and pollution strategies tailored to your area’s conditions.",
  },
];

export default function MarketingPage() {
  const appUrl = getAppUrl("/app");

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-eco-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-eco-primary uppercase tracking-wider mb-4">
              AI Environmental Assistant
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-eco-text leading-tight mb-6">
              Understand environmental health in seconds
            </h1>
            <p className="text-lg text-eco-muted mb-10 leading-relaxed">
              EcoWatch AI turns complex environmental data into a simple score,
              clear risk level, and actionable recommendations—so you know what
              to do next.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={appUrl}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-eco-primary text-eco-bg font-semibold hover:bg-eco-primary/90 transition-all hover:shadow-lg hover:shadow-eco-primary/20"
              >
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`${appUrl}?demo=1`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-eco-border text-eco-text font-medium hover:border-eco-primary/50 transition-colors"
              >
                Try live demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-panel p-8 lg:p-12 border border-eco-primary/20">
          <div className="aspect-video rounded-xl bg-eco-bg/80 border border-eco-border flex items-center justify-center">
            <div className="text-center p-8">
              <Leaf className="w-12 h-12 text-eco-primary mx-auto mb-4 opacity-80" />
              <p className="text-eco-muted text-sm">
                Dashboard preview — environmental score, AI insights & map
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <h2 className="text-2xl font-bold text-center mb-12">Built for clarity</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="glass-panel p-6 hover:border-eco-primary/30 transition-colors"
            >
              <div className="p-3 rounded-xl bg-eco-primary/10 w-fit mb-4">
                <Icon className="w-6 h-6 text-eco-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-eco-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to explore your environment?</h2>
        <p className="text-eco-muted mb-8 max-w-xl mx-auto">
          Open the dashboard for instant environmental overview, heatmaps, and
          advanced analytics when you need them.
        </p>
        <Link
          href={appUrl}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-eco-accent text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Get started
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
