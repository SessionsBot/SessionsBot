import { defineStore } from "pinia";
import type { Component } from "vue";

type NotificationLevel = "default" | "info" | "upgrade" | "warn" | "error"

type NotificationOpts = {
    /** Header text to display within this notification. */
    header: string
    /** Display text to display within this notification. */
    content: string | Component
    // /** **REPLACES TEXT CONTENT ENTIRELY** with provided component! */
    // template?: Component
    /** `Iconify` icon name to display or else `false` to disable. 
     * @default- "tabler:info-square-filled" */
    icon?: false | string
    /** The `level` of this notification, affects certain styling. 
     * @default- "default" */
    level?: NotificationLevel
    /** The amount of seconds this notification should stay visible on screen. To disable, set to `false`.
     * @default- 5s */
    duration?: number | false
    /** DESC */
    actions?: undefined | NotificationAction[]
    /** If this notification should be initially displayed onto the app screen.
     * @default- false */
    // silence?: boolean
}

type NotificationAction = {
    button: {
        title: string,
        icon?: string | undefined,
        class?: string | undefined
    },
    onClick: (e: Event, ctx: { close: () => void }) => any
}

// Util - Create Msg Id:
const generateMsgId = () => crypto.randomUUID().match(/[^-]{10}$/g)?.splice(0, 10).join() as string;


/** CUSTOM App Level Notification System */
const useNotifier = defineStore('notifier', () => {
    // Current Notifications:
    const notifications = ref(new Map<string, NotificationOpts>())

    /***Sends a new notification** using the app notifier. */
    function send(notificationOpts: NotificationOpts) {
        // Generate Msg Id:
        const msgId = generateMsgId();
        // Make Template Raw if Applicable:
        if (typeof notificationOpts.content != 'string') {
            console.info('Component Type!')
            notificationOpts = {
                ...notificationOpts,
                content: markRaw(notificationOpts.content as Component)
            }
        } else console.warn('non component type')
        notifications.value.set(msgId, notificationOpts)
        if (notificationOpts.duration != false) {
            // Hide after Duration:
            const showMs = ((notificationOpts.duration ?? 3) * 1000);
            setTimeout(() => {
                notifications.value.delete(msgId)
            }, showMs)
        }

    }

    /***Hides a notification** by its message id. */
    function hide(msgId: string) {
        notifications.value.delete(msgId)
    }

    // Return States & Methods:
    return {
        notifications,
        send,
        hide
    }
})


export default useNotifier;