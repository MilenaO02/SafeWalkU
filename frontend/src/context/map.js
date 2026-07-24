import { createContext, useContext } from 'react';

export const MapContext = createContext(null);
export const useMapConfig = () => useContext(MapContext);

export const defaultMapConfig = {
  centro: [-3.97245, -79.19933],
  zoom: 17,
  markers: [{
    position: [-3.97245, -79.19933],
    title: 'UIDE - Extensión Loja',
    desc: 'Calle Agustín Carrión Palacios, sector Jipiro'
  }],
  circle: null
};
