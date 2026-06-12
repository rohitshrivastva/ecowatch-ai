"use client";

import { useCallback, useState } from "react";
import { useInitialLocation } from "@/hooks/useInitialLocation";
import type { LocationSelection } from "@/types/environment";

export function usePlatformLocation(forceDefault = false) {
  const { selection: ipSelection, setSelection: setIpSelection, detecting } =
    useInitialLocation({ forceDefault });
  const [manualSelection, setManualSelection] = useState<LocationSelection | null>(
    null
  );

  const activeLocation = manualSelection ?? ipSelection;

  const setLocation = useCallback(
    (loc: LocationSelection) => {
      setManualSelection(loc);
      setIpSelection(loc);
    },
    [setIpSelection]
  );

  return {
    location: activeLocation,
    setLocation,
    detecting,
  };
}
