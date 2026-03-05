import type { ClientRequest } from "http";

export { }

declare global {

    // Import Meta - Env Vars:
    interface ImportMetaEnv {
        readonly VITE_SUPABASE_URL: string
        readonly VITE_SUPABASE_KEY: string
        readonly VITE_GTAG_ID: string
    }
    interface ImportMeta {
        readonly env: ImportMetaEnv
    }


    // gtag - google analytics
    interface Window {
        dataLayer: unknown[];
        gtag: (...args: any[]) => void;
    }
    const gtag: (...args: any[]) => void;

    /** Current App Version from `package.json` */
    const __APP_VERSION: string
}
