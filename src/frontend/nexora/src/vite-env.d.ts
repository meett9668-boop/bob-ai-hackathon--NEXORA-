/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google OAuth 2.0 Client ID (Google Identity Services) */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Google Maps JavaScript API key */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** OpenWeatherMap API key for live weather data */
  readonly VITE_WEATHER_API_KEY?: string;
  /** Optional backend API base URL (defaults to Vite proxy) */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
