import { defineStore } from "pinia";
import type { Component } from "vue";

// Notification Types:
type NotificationLevel = "default" | "info" | "upgrade" | "success" | "warn" | "error"

type NotificationOpts = {
    /** Header text to display within this notification. */
    header: string
    /** Display text to display within this notification. */
    content: string | Component | null
    /** `Iconify` icon name to display or else `false` to disable. 
     * @default- "tabler:info-square-filled" */
    icon?: false | string
    /** The `level` of this notification, affects certain styling. 
     * @default- "default" */
    level?: NotificationLevel
    /** The amount of seconds this notification should stay visible on screen. To disable, set to `false`.
     * @default- 7s */
    duration?: number | false
    /** Optional - Action Button(s) to include within the notification. */
    actions?: undefined | NotificationAction[]
    /** Option - Append additional css classes to various notification elements. */
    classes?: {
        root?: string,
        header?: string,
        headerIcon?: string,
        content?: string
    }

    // - In Progress
    /** If this notification should be initially displayed onto the app screen.
     * @default- false */
    // silence?: boolean
}

type NotificationAction = {
    /** The button data for display. */
    button: {
        /** The text title for this button */
        title: string,
        /** The `Iconify` icon name for this button. */
        icon?: string | undefined,
        /** Class names to apply to the button root element. */
        class?: string | undefined
        /** Optional - adds a <a> link wrap around the button to the specified url.
         * @startsWith `+` open in new tab */
        href?: string | undefined
    },
    /** Function to execute when the button is clicked. */
    onClick?: (e: Event, ctx: { close: () => void }) => any
}

type NotificationTimer = {
    /** Reference to `native` timeout id for notification display timer. */
    timeoutId: NodeJS.Timeout,
    /** The JS date this notification timer started/resumed on. */
    startedAt: Date,
    /** The amount of ms remaining in this notifications display duration timer from `startedAt`. */
    remainingMs: number,
    /** Boolean representing weather this notification display timer is paused or not. */
    paused: boolean
}

// Util - Create Msg Id:
const generateMsgId = () => crypto.randomUUID().match(/[^-]{10}$/g)?.splice(0, 10).join() as string;


/** CUSTOM App Level Notification System */
const useNotifier = defineStore('notifier', () => {
    // Current Notifications:
    const notifications = ref(new Map<string, NotificationOpts>())

    // Nested - Notification Timer(s) States & Methods:
    const useTimers = () => {
        /** Map containing all active notification display timers. */
        const all = ref(new Map<string, NotificationTimer>());

        /* Starts & stores a new notification timer. **/
        function start(msgId: string, durationMs: number) {
            const startedAt = new Date();

            const timeoutId = setTimeout(() => {
                hide(msgId)
            }, durationMs);

            // Store timer for notification:
            all.value.set(msgId, {
                timeoutId,
                startedAt,
                remainingMs: durationMs,
                paused: false
            })
        }

        /* Stops & destroys a notification timer. **/
        function stop(msgId: string) {
            // Get Existing Timer:
            const timer = all.value.get(msgId)
            if (!timer) return
            // Clear Timeout & Remove Reference:
            clearTimeout(timer.timeoutId)
            all.value.delete(msgId)
            // Destroy Notification (if exists)
            if (notifications.value.get(msgId)) {
                notifications.value.delete(msgId)
            }
        }

        /* Pauses a notification timer. **/
        function pause(msgId: string) {
            // Get Existing Timer
            const timer = all.value.get(msgId)
            if (!timer) return
            // Get Elapsed Time:
            const elapsedMs = (new Date().getTime() - timer.startedAt.getTime())
            // Clear Old Timeout:
            clearTimeout(timer.timeoutId);
            // Set Updated Remaining Time & Pause:
            timer.remainingMs = Math.max(0, timer.remainingMs - elapsedMs);
            timer.paused = true;
            // Debug:
            // console.info(`Pausing timer for ${msgId}`, timer)
        }

        /* Resumes a notification timer. **/
        function resume(msgId: string) {
            // Get Existing Timer:
            const timer = all.value.get(msgId)
            if (!timer || !timer.paused) return
            // If Timer is already Completed:
            if (timer.remainingMs <= 0) {
                hide(msgId)
                return
            }
            // Update Timer Started At Date & Unpause:
            timer.startedAt = new Date()
            timer.paused = false
            // Update New Timeout:
            timer.timeoutId = setTimeout(() => {
                hide(msgId)
            }, timer.remainingMs)
            // Debug:
            // console.info(`Resuming timer for ${msgId}`, timer)
        }

        // Return Timer States & Methods:
        return {
            all,
            start,
            stop,
            resume,
            pause
        }
    }
    const timers = useTimers()


    /***Sends a new notification** using the app notifier. */
    function send(notificationOpts: NotificationOpts) {
        // Generate Msg Id:
        const msgId = generateMsgId();
        // Make Template "Raw" if provided:
        if (notificationOpts.content != null && typeof notificationOpts.content != 'string') {
            notificationOpts = {
                ...notificationOpts,
                content: markRaw(notificationOpts.content as Component)
            }
        }

        // Prevent Duplicates:
        for (const [id, existing] of notifications.value.entries()) {
            if (
                existing.header === notificationOpts.header &&
                (
                    (typeof existing.content == 'object' &&
                        typeof notificationOpts.content == 'object' &&
                        existing.content?.template == notificationOpts.content?.template)
                    || (typeof notificationOpts.content == 'string' && notificationOpts.content == existing.content)
                ) &&
                existing.level === notificationOpts.level
            ) {
                console.warn("Prevented duplicate notification");
                return;
            }
        }

        // Send/Add Notification:
        notifications.value.set(msgId, notificationOpts);

        // If Duration - Start Timer
        if (notificationOpts.duration != false) {
            // Hide after Duration:
            const showMs = ((notificationOpts.duration ?? 7) * 1000);
            timers.start(msgId, showMs)
        }

    }


    /***Hides a notification** by its message id. */
    function hide(msgId: string) {
        timers.stop(msgId)
        notifications.value.delete(msgId)
    }


    // Return States & Methods:
    return {
        notifications,
        timers,
        send,
        hide
    }
})


export default useNotifier;