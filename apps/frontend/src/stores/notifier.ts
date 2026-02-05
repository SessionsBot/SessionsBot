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

type NotificationTimer = {
    /** Reference to `native` timeout id for notification display. */
    timeoutId: NodeJS.Timeout,
    /** The JS date this notification was first displayed */
    startedAt: Date,
    /** The amount of ms remaining in this notifications display duration. */
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

    const timers = ref(new Map<string, NotificationTimer>())

    /* Starts & stores a new notification timer. **/
    function startTimer(msgId: string, durationMs: number) {
        const startedAt = new Date();

        const timeoutId = setTimeout(() => {
            hide(msgId)
        }, durationMs);

        // Store timer for notification:
        timers.value.set(msgId, {
            timeoutId,
            startedAt,
            remainingMs: durationMs,
            paused: false
        })
    }

    /* Stops & destroys a notification timer. **/
    function stopTimer(msgId: string) {
        // Get Existing Timer:
        const timer = timers.value.get(msgId)
        if (!timer) return
        // Clear Timeout & Remove Reference:
        clearTimeout(timer.timeoutId)
        timers.value.delete(msgId)
    }

    /* Pauses a notification timer. **/
    function pauseTimer(msgId: string) {
        // Get Existing Timer
        const timer = timers.value.get(msgId)
        if (!timer) return
        // Get Elapsed Time:
        const elapsedMs = (new Date().getTime() - timer.startedAt.getTime())
        // Clear Old Timeout:
        clearTimeout(timer.timeoutId);
        // Set Updated Remaining Time & Pause:
        timer.remainingMs = Math.max(0, timer.remainingMs - elapsedMs);
        timer.paused = true;
    }

    /* Resumes a notification timer. **/
    function resumeTimer(msgId: string) {
        // Get Existing Timer:
        const timer = timers.value.get(msgId)
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
    }

    /***Sends a new notification** using the app notifier. */
    function send(notificationOpts: NotificationOpts) {
        // Generate Msg Id:
        const msgId = generateMsgId();
        // Make Template "Raw" if provided:
        if (typeof notificationOpts.content != 'string') {
            notificationOpts = {
                ...notificationOpts,
                content: markRaw(notificationOpts.content as Component)
            }
        }
        notifications.value.set(msgId, notificationOpts)
        if (notificationOpts.duration != false) {
            // Hide after Duration:
            const showMs = ((notificationOpts.duration ?? 5) * 1000);
            startTimer(msgId, showMs)
        }

    }


    /***Hides a notification** by its message id. */
    function hide(msgId: string) {
        stopTimer(msgId)
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