import "leaflet";

declare module "leaflet" {
  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: HeatMapOptions
  ): Layer & {
    setLatLngs: (latlngs: Array<[number, number, number]>) => void;
    setOptions: (options: HeatMapOptions) => void;
  };
}
