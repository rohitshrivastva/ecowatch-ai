"use client";

import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";

const STATUS_LINES = [
  "Analyzing environmental conditions…",
  "Analyzing air quality…",
  "Assessing vegetation cover…",
  "Calculating environmental risk…",
  "Generating AI insights…",
];

export default function EnvironmentalLoading({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={
        compact
          ? "flex items-center gap-3 text-sm text-eco-muted"
          : "flex flex-col items-center justify-center gap-4 py-6"
      }
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-eco-primary/20 animate-env-pulse" />
        <div className="relative p-3 rounded-full bg-eco-primary/10 border border-eco-primary/30">
          <Leaf className="w-6 h-6 text-eco-primary animate-env-float" />
        </div>
      </div>
      <p
        className={
          compact
            ? "text-eco-primary font-medium animate-pulse"
            : "text-eco-text font-medium text-center animate-pulse"
        }
        key={lineIndex}
      >
        {STATUS_LINES[lineIndex]}
      </p>
    </div>
  );
}
