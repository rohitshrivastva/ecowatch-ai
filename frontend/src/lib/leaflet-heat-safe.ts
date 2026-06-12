/**
 * Guards leaflet.heat against IndexSizeError when the map canvas is 0×0
 * (e.g. ResizeObserver / invalidateSize during layout).
 */
import L from "leaflet";
import "leaflet.heat";

let patched = false;

function mapSizeValid(map: L.Map | undefined): boolean {
  if (!map) return false;
  const size = map.getSize();
  if (size.x <= 0 || size.y <= 0) return false;
  const container = map.getContainer();
  return container.clientWidth > 0 && container.clientHeight > 0;
}

export function ensureSafeHeatLayer(): void {
  if (patched) return;

  const HeatLayer = (L as typeof L & { HeatLayer?: { prototype: Record<string, unknown> } })
    .HeatLayer;
  if (!HeatLayer?.prototype) return;

  const proto = HeatLayer.prototype as {
    _reset: () => void;
    _redraw: () => void;
  };

  const originalReset = proto._reset;
  const originalRedraw = proto._redraw;

  proto._reset = function (this: L.Layer & { _map?: L.Map; _canvas?: HTMLCanvasElement; _frame?: unknown }) {
    if (!mapSizeValid(this._map)) {
      this._frame = null;
      return;
    }
    originalReset.call(this);
  };

  proto._redraw = function (this: L.Layer & { _map?: L.Map; _canvas?: HTMLCanvasElement; _frame?: unknown }) {
    if (!mapSizeValid(this._map)) {
      this._frame = null;
      return;
    }
    const canvas = this._canvas;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      this._frame = null;
      return;
    }
    try {
      originalRedraw.call(this);
    } catch {
      this._frame = null;
    }
  };

  patched = true;
}

ensureSafeHeatLayer();

export type SafeHeatLayer = L.Layer & {
  setLatLngs: (latlngs: [number, number, number][]) => SafeHeatLayer;
  setOptions: (options: L.HeatMapOptions) => SafeHeatLayer;
  _canvas?: HTMLCanvasElement;
};

export function createHeatLayer(
  latlngs: [number, number, number][],
  options: L.HeatMapOptions
): SafeHeatLayer {
  ensureSafeHeatLayer();
  return L.heatLayer(latlngs, options) as SafeHeatLayer;
}
