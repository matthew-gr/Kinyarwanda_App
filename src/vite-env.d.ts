/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Without it the app runs on this device only, with no accounts. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable (anon) key. Safe in the browser: row level security guards the data. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** This build's version, package version and commit, such as 0.1.0+1b56573 (vite.config.ts). */
declare const __APP_VERSION__: string;
