"use client";

import { useEffect, useState } from "react";

function formatLocalTime(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const suffix = date.getHours() < 12 ? "AM" : "PM";
  return `${h}:${date.getMinutes().toString().padStart(2, "0")} ${suffix}`;
}

export function useLocalRegionTime(timezoneOffsetSeconds?: number | null) {
  const [localTime, setLocalTime] = useState<string | null>(null);

  useEffect(() => {
    if (timezoneOffsetSeconds == null) {
      setLocalTime(null);
      return;
    }

    const tick = () => {
      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
      const regionMs = utcMs + timezoneOffsetSeconds * 1000;
      setLocalTime(formatLocalTime(new Date(regionMs)));
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [timezoneOffsetSeconds]);

  return localTime;
}
