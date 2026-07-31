import { createContext, useContext } from 'react';

export const MapContext = createContext(null);
export const useMapConfig = () => useContext(MapContext);

export const defaultMapConfig = {
  centro: [-3.97245, -79.19933],
  zoom: 17,
  markers: [],
  circle: null,
  polygons: [],
  polyline: null,
  heatmapPoints: []
};
