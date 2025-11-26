import { POSITION } from "vue-toastification";
import type { ToastOptions } from "vue-toastification/dist/types/types";

/** Global App Toast / Notification Configuration */
export const toastOptions: ToastOptions = {
    showCloseButtonOnHover: true,
    timeout: 7_000,
    pauseOnHover: true,
    hideProgressBar: true,
    toastClassName: 'font-bold!',
    position: POSITION.BOTTOM_RIGHT
}