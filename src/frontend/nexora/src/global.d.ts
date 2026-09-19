// global.d.ts — merged Google global type declarations for NEXORA
// Covers both Google Identity Services (GIS) and Google Maps JavaScript API.

declare global {
  interface Window {
    google?: {
      // ── Google Identity Services (GIS) ─────────────────────────────────────
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };

      // ── Google Maps JavaScript API ──────────────────────────────────────────
      maps?: {
        Map: new (el: HTMLElement, opts: object) => GoogleMapInstance;
        Marker: new (opts: object) => GoogleMarkerInstance;
        InfoWindow: new (opts: object) => GoogleInfoWindowInstance;
        LatLng: new (lat: number, lng: number) => object;
        Animation: { DROP: number };
        event: { addListener: (t: object, ev: string, fn: () => void) => void };
      };
    };
  }

  // Interfaces used for Google Maps (avoids import cycles)
  interface GoogleMapInstance {
    setCenter: (latlng: object) => void;
    setZoom: (z: number) => void;
  }
  interface GoogleMarkerInstance {
    setMap: (m: GoogleMapInstance | null) => void;
    addListener: (ev: string, fn: () => void) => void;
  }
  interface GoogleInfoWindowInstance {
    open: (map: GoogleMapInstance, marker: GoogleMarkerInstance) => void;
    close: () => void;
  }
}

export {};
