/**
 * VendorMapEmbed
 * ---------------------------------------------------------------------------
 * Embeds a Google Map using ONLY the public Google Maps embed/query iframe URL
 * pattern (no API key, no external SDKs, no JS Maps API). This works because
 * Google provides a simple `q=lat,lng(label)&output=embed` endpoint that
 * renders a map + marker. Directions and full map features are delegated to
 * normal Google Maps URLs which will seamlessly open the native Maps app on
 * mobile or a new browser tab on desktop.
 *
 * Security / Safety:
 * - No dynamic HTML injection; user-provided `label` is URL-encoded.
 * - Uses referrerPolicy (default: no-referrer-when-downgrade).
 * - Opens external links with `rel="noopener noreferrer"` + `target="_blank"`.
 *
 * Accessibility:
 * - Provides descriptive titles & aria-labels including vendor label.
 * - Graceful fallback UI when coordinates are invalid.
 * - Keyboard accessible links styled as buttons.
 */
import React, { useState, useMemo, useCallback } from 'react';

export type VendorMapEmbedProps = {
  lat: number;
  lng: number;
  label?: string;
  zoom?: number; // sensible default 15
  width?: string; // container width (CSS value)
  height?: string; // container height (CSS value)
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onMapLoad?: () => void;
};

const isValidLat = (lat: unknown): lat is number => typeof lat === 'number' && isFinite(lat) && lat >= -90 && lat <= 90;
const isValidLng = (lng: unknown): lng is number => typeof lng === 'number' && isFinite(lng) && lng >= -180 && lng <= 180;

const DEFAULT_ZOOM = 15;
const DEFAULT_WIDTH = '100%';
const DEFAULT_HEIGHT = '400px';
const DEFAULT_REFERRER_POLICY: React.HTMLAttributeReferrerPolicy = 'no-referrer-when-downgrade';

export default function VendorMapEmbed({
  lat,
  lng,
  label,
  zoom = DEFAULT_ZOOM,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className = '',
  referrerPolicy = DEFAULT_REFERRER_POLICY,
  onMapLoad,
}: VendorMapEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  const encodedLabel = useMemo(() => encodeURIComponent(label || 'Location'), [label]);
  const coordsValid = isValidLat(lat) && isValidLng(lng);

  const iframeSrc = useMemo(() => {
    if (!coordsValid) return '';
    // Pattern: https://www.google.com/maps?q={lat},{lng}({label})&z={zoom}&output=embed
    return `https://www.google.com/maps?q=${lat},${lng}(${encodedLabel})&z=${zoom}&output=embed`;
  }, [coordsValid, lat, lng, encodedLabel, zoom]);

  const openMapsUrl = useMemo(() => coordsValid ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : '' , [coordsValid, lat, lng]);
  const directionsUrl = useMemo(() => coordsValid ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : '' , [coordsValid, lat, lng]);
  const fallbackSearchUrl = useMemo(() => `https://www.google.com/maps/search/?api=1&query=${encodedLabel}`, [encodedLabel]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onMapLoad?.();
  }, [onMapLoad]);

  if (!coordsValid) {
    return (
      <div
        className={`w-full rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-2 ${className}`}
        aria-live="polite"
      >
        <p className="text-sm text-gray-700 font-medium">Map unavailable: invalid coordinates.</p>
        <p className="text-xs text-gray-600">Provided values must be within valid latitude (-90 to 90) and longitude (-180 to 180) ranges.</p>
        <a
          href={fallbackSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400 focus:ring-offset-2"
          aria-label={`Open Google Maps search for ${label || 'location'}`}
        >
          Open Google Maps Search
        </a>
      </div>
    );
  }

  return (
    <figure className={`flex flex-col gap-3 ${className}`} style={{ width }}>
      <div className="relative" style={{ width: '100%', height }}>
        {!loaded && (
          <div
            className="absolute inset-0 animate-pulse bg-gray-100 flex items-center justify-center text-xs text-gray-500"
            aria-label="Loading map"
            role="status"
          >
            Loading map…
          </div>
        )}
        <iframe
          title={`Map for ${label || 'location'}`}
          aria-label={`Google Map showing ${label || 'location'} at latitude ${lat} longitude ${lng}`}
          src={iframeSrc}
          width={width}
          height={height}
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy={referrerPolicy}
          onLoad={handleLoad}
          className="rounded-lg w-full h-full"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={openMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open in Google Maps: ${label || 'location'}`}
          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400 focus:ring-offset-2"
        >
          Open in Google Maps
        </a>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Get directions to ${label || 'location'}`}
          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-400 focus:ring-offset-2"
        >
          Get Directions
        </a>
      </div>
      <figcaption className="text-xs text-gray-500">
        Open in Google Maps for full features and directions.
      </figcaption>
    </figure>
  );
}

/* --------------------------------------------------------------------------
Usage Example (JSX / TSX):

<VendorMapEmbed
  lat={28.6139}
  lng={77.2090}
  label="Vendor HQ"
  zoom={16}
  height="360px"
  onMapLoad={() => console.log('Map iframe loaded')}
/>

Unit Test Suggestions (Jest / Vitest + RTL):
1. Renders iframe with correct src containing encoded label & coordinates.
2. "Get Directions" link has correct destination URL.
3. Fallback UI appears when lat/lng invalid (e.g., lat=999).
4. onMapLoad called after iframe load (can mock load event).
*/
