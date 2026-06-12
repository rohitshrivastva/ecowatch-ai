"use client";

import { useCallback, useEffect, useState } from "react";
import { useInitialLocation } from "@/hooks/useInitialLocation";
import type { LocationSelection } from "@/types/environment";

const STORAGE_KEY = "ecowatch-selected-location";

function readStoredLocation(): LocationSelection | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocationSelection;
    if (
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude)
    ) {
      return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

function storeLocation(loc: LocationSelection) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    /* quota / private mode */
  }
}

export function usePlatformLocation(forceDefault = false) {
  const [manualSelection, setManualSelection] =
    useState<LocationSelection | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!forceDefault) {
      const stored = readStoredLocation();
      if (stored) setManualSelection(stored);
    }
    setHydrated(true);
  }, [forceDefault]);

  const skipIpDetect = forceDefault || (hydrated && !!manualSelection);

  const { selection: ipSelection, setSelection: setIpSelection, detecting } =
    useInitialLocation({ forceDefault, skip: skipIpDetect });

  const activeLocation = manualSelection ?? ipSelection;

  const setLocation = useCallback(
    (loc: LocationSelection) => {
      setManualSelection(loc);
      setIpSelection(loc);
      storeLocation(loc);
    },
    [setIpSelection]
  );

  const isDetecting = !hydrated || (skipIpDetect ? false : detecting);

  return {
    location: activeLocation,
    setLocation,
    detecting: isDetecting,
    hydrated,
  };
}
