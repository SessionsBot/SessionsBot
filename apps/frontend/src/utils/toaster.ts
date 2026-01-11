import { IconifyIconComponent, type IconifyIcon } from "iconify-icon";
import { Info } from "lucide-vue-next";
import { POSITION } from "vue-toastification";
import type { PluginOptions } from "vue-toastification/dist/types/types";

/** Global App Toast / Notification Configuration */
export const toastOptions: PluginOptions = {
    showCloseButtonOnHover: true,
    timeout: 7_000,
    pauseOnHover: true,
    hideProgressBar: true,
    toastClassName: 'font-bold!',
    position: POSITION.BOTTOM_RIGHT,
    toastDefaults: {
        default: {
            toastClassName: 'bg-zinc-800! ring-ring! ring-2! gap-0!',
            bodyClassName: 'font-semibold',
            icon: Info
        }
    }
}