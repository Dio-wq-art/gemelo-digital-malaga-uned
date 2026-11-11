import React from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';

export const DeckGLOverlay = React.memo(function DeckGLOverlay(props: any) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}, (prevProps, nextProps) => {
  // Shallow compare layers array length and properties
  if (prevProps.layers === nextProps.layers) return true;
  if (!prevProps.layers || !nextProps.layers) return false;
  if (prevProps.layers.length !== nextProps.layers.length) return false;
  return false;
});
