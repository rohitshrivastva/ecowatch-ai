"use client";

import { useEffect, useRef, useState } from "react";
import { resolveInitialLocation } from "@/lib/geo";
import type { LocationSelection } from "@/types/environment";

export function useInitialLocation(options?: {
  forceDefault?: boolean;
  skip?: boolean;
}) {
  const [selection, setSelection] = useState<LocationSelection | null>(null);
  const [detecting, setDetecting] = useState(true);
  const abortRef = useRef(false);

  useEffect(() => {
    if (options?.skip) {
      setDetecting(false);
      return;
    }

    abortRef.current = false;
    setDetecting(true);

    const controller = new AbortController();
    const failSafe = window.setTimeout(() => controller.abort(), 10000);

    void resolveInitialLocation({
      forceDefault: options?.forceDefault,
      signal: controller.signal,
    }).then((loc) => {
      if (abortRef.current) return;
      setSelection(loc);
      setDetecting(false);
    });

    return () => {
      abortRef.current = true;
      controller.abort();
      window.clearTimeout(failSafe);
    };
  }, [options?.forceDefault, options?.skip]);

  return { selection, setSelection, detecting };
}
