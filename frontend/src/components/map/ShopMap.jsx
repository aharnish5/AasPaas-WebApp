import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

// Expect MAPBOX access token OR fallback to no map
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

/**
 * ShopMap
 * Renders shops as markers. Accepts center {lat, lon}, radiusMeters and shops array.
 * Draws a circle to visualize radius (approximate using a geojson circle).
 */
export default function ShopMap({ center, radiusMeters = 3000, shops = [], height = 400 }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const hasToken = Boolean(MAPBOX_TOKEN && MAPBOX_TOKEN.trim().length > 0);

  // Generate circle polygon around center (simple 64-point approximation)
  function makeCircle({ lon, lat }, radiusM) {
    const points = 64;
    const coords = [];
    const R = 6378137; // Earth radius meters
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const dx = radiusM * Math.cos(angle);
      const dy = radiusM * Math.sin(angle);
      // Convert meters offset to lon/lat deltas
      const dLon = (dx / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
      const dLat = (dy / R) * (180 / Math.PI);
      coords.push([lon + dLon, lat + dLat]);
    }
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [coords] },
    };
  }

  useEffect(() => {
    if (!hasToken) return; // gracefully skip map rendering
    if (!containerRef.current || !center?.lat || !center?.lon) return;
    // Initialize map once
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [center.lon, center.lat],
        zoom: 12,
      });
    } else {
      mapRef.current.setCenter([center.lon, center.lat]);
    }
  }, [center?.lat, center?.lon, hasToken]);

  // Update radius overlay & markers
  useEffect(() => {
    if (!hasToken) return;
    if (!mapRef.current || !center?.lat || !center?.lon) return;
    const map = mapRef.current;

    const circleFeature = makeCircle({ lon: center.lon, lat: center.lat }, radiusMeters);

    // Circle layer source update
    if (map.getSource('radius-circle')) {
      map.getSource('radius-circle').setData(circleFeature);
    } else {
      map.addSource('radius-circle', { type: 'geojson', data: circleFeature });
      map.addLayer({
        id: 'radius-circle-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.12 },
      });
      map.addLayer({
        id: 'radius-circle-outline',
        type: 'line',
        source: 'radius-circle',
        paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-opacity': 0.5 },
      });
    }

    // Clear existing markers
    const existing = document.querySelectorAll('.shop-marker');
    existing.forEach(el => el.remove());

    shops.forEach((shop) => {
      const [lon, lat] = shop.location?.coordinates || [];
      if (typeof lon !== 'number' || typeof lat !== 'number') return;
      const el = document.createElement('div');
      el.className = 'shop-marker';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.background = '#ef4444';
      el.style.boxShadow = '0 0 0 2px white';
      el.style.cursor = 'pointer';
      el.title = shop.name;
      el.addEventListener('click', () => {
        new mapboxgl.Popup({ offset: 8 })
          .setLngLat([lon, lat])
          .setHTML(`<div style="min-width:160px"><strong>${shop.name}</strong><br/>${shop.address?.locality || ''} ${shop.dist?.calculated ? `<br/><em>${(shop.dist.calculated/1000).toFixed(2)} km</em>`: ''}</div>`)
          .addTo(map);
      });
      new mapboxgl.Marker(el).setLngLat([lon, lat]).addTo(map);
    });
  }, [shops, radiusMeters, center?.lat, center?.lon, hasToken]);
  if (!hasToken) {
    return (
      <div style={{ width: '100%', height }} className="rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center text-sm text-gray-500 bg-gray-50">
        Map preview disabled (no Mapbox token)
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height }} className="rounded-xl overflow-hidden border border-gray-200" />;
}
