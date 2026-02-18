import { discordSnowflakeSchema, SubscriptionLimits, type API_DiscordUserIdentity, type API_SessionTemplateBodyInterface, type APIResponseValue } from "@sessionsbot/shared";
import { defineStore } from "pinia";
import { fetchGuildAuditLog, fetchGuildChannels, fetchGuildData, fetchGuildRoles, fetchGuildSessions, fetchGuildSubscription, fetchGuildTemplates } from "./dashboard.api";
import { useAuthStore } from "../auth";
import { DateTime } from "luxon";
import { API } from "@/utils/api";
import { z } from 'zod'
import router from "@/router/router";
import useNotifier from "../notifier";
import LimitReachedAlert from "@/components/notifier/limitReachedAlert.vue";

export type DashboardTabName = 'Sessions' | 'Calendar' | 'Notifications' | 'AuditLog' | 'Preferences';

const useDashboardStore = defineStore('dashboard', () => {
    /** Private Variables */
    const auth = useAuthStore()
    const authKey = computed(() => auth.session?.access_token)


    /** Current - Selected `Guild Id`. */
    const guildId = ref<string | null>(null)

    /** Guild Data - Channels */
    const guildChannels = useAsyncState(() => fetchGuildChannels(guildId.value, authKey.value), undefined, {
        immediate: false,
        onError(e) { console.error('[GUILD CHANNELS] - Fetch Error:', e) },
    })
    /** Guild Data - Roles */
    const guildRoles = useAsyncState(() => fetchGuildRoles(guildId.value, authKey.value), undefined, {
        immediate: false,
        onError(e) { console.error('[GUILD ROLES] - Fetch Error:', e) },
    })
    /** Guild Data - Subscription */
    const guildSubscription = useAsyncState(() => fetchGuildSubscription(guildId.value, authKey.value), undefined, {
        immediate: false,
        onError(e) { console.error('[GUILD SUBSCRIPTION] - Fetch Error:', e) },
    })
    /** Guild Data - Session Templates */
    const guildSessionTemplates = useAsyncState(() => fetchGuildTemplates(guildId.value), undefined, {
        immediate: false,
        onError(e) { console.error('[GUILD TEMPLATES] - Fetch Error:', e) },
    })
    /** Guild Data - Current Sessions */
    const guildCurrentSessions = useAsyncState(() => fetchGuildSessions(guildId.value), undefined, {
        immediate: false,
        onError(e) { console.error('[GUILD SESSIONS] - Fetch Error:', e) },
    })
    /** Guild Data - Audit Logs */
    const guildAuditLogs = useAsyncState(() => fetchGuildAuditLog(guildId.value), undefined, {
        immediate: false,
        onError(e) { console.error('[GUILD AUDIT LOG] - Fetch Error:', e) },
    })
    /** Guild Data - Preferences/Data */
    const guildDbData = useAsyncState(() => fetchGuildData(guildId.value), undefined, {
        immediate: false,
        onError(e) { console.error('[GUILD DATA/PREFERENCES] - Fetch Error:', e) },
    })

    /** Guild Data - From Auth User */
    const userGuildData = computed(() => auth.user?.user_metadata?.guilds?.manageable.find(g => g.id == guildId.value))


    const guildFetchReady = computed(() => {
        if (guildId.value == null) return false
        return Object.values(guildData).every(s => s?.isReady.value == true)
    })
    const guildFetchErrors = computed(() => {
        if (guildId.value == null) return []
        return Object.values(guildData).filter(s => s?.error.value != null)?.map(s => s?.error.value)
    })
    const guildLastFetchDate = ref<DateTime | null>(null)
    /** Selected Guild Data Fetch State - **NESTED** */
    const guildDataState = {
        allReady: guildFetchReady,
        errors: guildFetchErrors,
        fetchedAt: guildLastFetchDate
    }

    /** Selected Guild Data - **NESTED** */
    const guildData = {
        guild: guildDbData,
        channels: guildChannels,
        roles: guildRoles,
        subscription: guildSubscription,
        sessionTemplates: guildSessionTemplates,
        sessions: guildCurrentSessions,
        auditLog: guildAuditLogs
    }


    /** Saved Selection - Choice Class */
    const saveGuildChoice = {
        saveKey: 'SGC_Dashboard',
        /** Gets and returns any saved guild selection's id or null. */
        get() {
            return sessionStorage.getItem(this.saveKey)
        },
        /** Assigns a new saved guild selection by id. */
        set(guildId: string) {
            return sessionStorage.setItem(this.saveKey, guildId)
        },
        /** Assigns the selected dashboard guild to the saved choice, if any. */
        assign() {
            const choice = this.get();
            if (choice) { guildId.value = choice };
        },
        /** Removes any saved selected dashboard guild. */
        clear() {
            return sessionStorage.removeItem(this.saveKey)
        }
    }

    /** Navigation - Nested States/Methods */
    const nav = reactive({
        /** Current "Tab" to display/view within Dashboard UI. */
        currentTab: <DashboardTabName>"Sessions",
        /** Whether or not the Dashboard Nav element is "expanded" or not. */
        expanded: false,
    })


    /** Discord Identities - From User Ids */
    const useDiscordIdentities = () => {
        // Cached Identities:
        type cachedIdentity = API_DiscordUserIdentity & { fetched_at: DateTime }

        const inFlight = ref<Map<string, Promise<cachedIdentity | undefined>>>(new Map())
        const cache = ref<Map<string, cachedIdentity>>(new Map())
        const cacheTimeMs = (15 * 60 * 1000)

        /** Gets a Discord Identity by UserId (using cache). */
        async function get(userId: string) {
            // Confirm User Id:
            const { success: validUserId, error: userIdError } = z.safeParse(discordSnowflakeSchema, userId)
            if (!validUserId) {
                console.warn(`[!] Failed to fetch Discord Identity - INVALID USER ID - ${userId}`, { input_errors: z.treeifyError(userIdError)?.errors })
                return undefined
            }
            // Get & Return Cached User if NOT Expired:
            const cachedUser = cache.value.get(userId)
            if (cachedUser) {
                const expired = Math.abs(cachedUser.fetched_at.diffNow().milliseconds) >= cacheTimeMs
                if (!expired) return cachedUser
            }

            // Already fetching?
            const existing = inFlight.value.get(userId)
            if (existing) return existing

            // Create request
            const request = (async () => {
                try {
                    const result = await API.get<APIResponseValue<API_DiscordUserIdentity>>(
                        `/discord/identity/${userId}`
                    )

                    if (!result.data?.success) return undefined

                    const identity: cachedIdentity = {
                        ...result.data.data,
                        fetched_at: DateTime.now(),
                    } as any

                    cache.value.set(userId, identity)
                    return identity
                } finally {
                    inFlight.value.delete(userId)
                }
            })()

            inFlight.value.set(userId, request)
            return request
        }

        // Return States & Methods:
        return {
            get
        }
    }
    const discordIdentities = useDiscordIdentities()


    /** Session Form - States & Methods: */
    const useSessionForm = () => {
        /** Session (Template) Form - Visibility Boolean */
        const visible = ref(false)

        /** Current session (template) payload/data for editing. */
        const editPayload = ref<API_SessionTemplateBodyInterface | null>(null)
        /** Fn - Starts a new session (template) form edit with provided `payload`. */
        function startEdit(payload: API_SessionTemplateBodyInterface) {
            editPayload.value = payload
        }

        /** Data to pass to the session form on new session creation. */
        const creationPayload = ref<creationPayload>(null);
        type creationPayload = {
            /** The user local zoned start date of the session to begin creation for. */
            startDate?: DateTime
        } | null;

        /** Fn - Attempts to open/create a new session schedule, if subscription allows does so - or else alerts. */
        function createNew(opts?: creationPayload) {
            const subscription = guildSubscription.state.value;
            const maxSchedulesAllowed = subscription?.limits.MAX_SCHEDULES ?? SubscriptionLimits.FREE.MAX_SCHEDULES
            const activeSchedulesCount = guildSessionTemplates.state.value?.length ?? 0

            // Check for MAX Active Schedules already created:
            if (activeSchedulesCount >= maxSchedulesAllowed) {
                // Limit Reached - Alert & Return:
                const notifier = useNotifier();
                notifier.send({
                    header: 'Limit Reached!',
                    content: h(LimitReachedAlert, { limitName: 'Session Schedules' }),
                    level: 'upgrade',
                    duration: 15
                })
                return false

            } else {
                // Apply Creation Payload (if any):
                if (opts) {
                    creationPayload.value = opts;
                }
                // Limit NOT Reached - Open Session Form:
                sessionForm.visible.value = true;
                return true
            }
        }

        return { visible, creationPayload, editPayload, startEdit, createNew }
    }
    const sessionForm = useSessionForm()


    // + WATCH - Guild Id - Fetch & Reset Data on Selected Guild Id Change:
    watch(guildId, async (id) => {
        // Guild Unselected - RESET DATA:
        if (!id) {
            // Reset Data
            for (const state of Object.values(guildData)) {
                state.state.value = undefined
            }
            // Session Form:
            sessionForm.visible.value = false;
            sessionForm.editPayload.value = null;
            return;
        }

        // Auth NOT READY - Wait:
        if (!auth.authReady) {
            // Auth NOT READY - Await Readiness:
            console.warn('[Dashboard Data]: Waiting for auth to be ready for data fetch...');
            // FN - Await Auth Ready to Fetch Data:
            async function waitForAuthReady(timeoutMs = 5000) {
                if (auth.signedIn) return true;
                return await Promise.race([
                    new Promise(resolve => watch(() => auth.authReady, (r) => { if (r) resolve(true) }, { once: true })),
                    new Promise(resolve => setTimeout(() => resolve(false), timeoutMs))
                ])
            }
            await waitForAuthReady();
        }

        // Auth READY - No User - Prompt Sign In:
        if (!auth.signedIn) {
            // No User Signed In - Clear Store - Prompt Sign In:
            console.warn('[Dashboard Data]: Auth Ready - NO USER - Sign in for Dashboard');
            // Get originating Dashboard URL to preserve pre defined actions:
            const redirectBackTo = router.currentRoute.value.fullPath
            auth.signIn(redirectBackTo)
            return;
        }

        // Confirm selected Guild Id is within user's Manageable Guilds:
        const isManageable = auth.user?.user_metadata?.guilds?.manageable?.some(g => g.id == id)
        if (!isManageable) {
            useNotifier().send({
                header: 'Cannot Access Server!',
                icon: 'material-symbols:lock',
                content: `It seems like you're trying to access a server you <b>don't have access to</b>! <br> <div class="italic w-full pt-0.5! px-2 opacity-65">- If you believe this is a mistake please refresh your account data.</div>`,
                level: 'warn',
                actions: [{
                    button: {
                        title: 'View Account',
                        href: '/account'
                    },
                    onClick(e, ctx) {
                        ctx.close()
                    },
                }]
            })
            return guildId.value = null;
        }

        // CHECKS PASSED - Fetch Data for selected Guild Id:
        let promises = [];
        for (const state of Object.values(guildData)) {
            promises.push(state.executeImmediate())
        }
        // Await All States to Fetch:
        console.info('(i) Guild STARTED Fetching at:', DateTime.local().toFormat('M/d/yy tt'))
        const allFetched = await Promise.allSettled(promises)
        // Assign Guild's Last Fetch Date:
        guildLastFetchDate.value = DateTime.now()
        console.info('(i) Guild FINISHED Fetching at:', DateTime.local().toFormat('M/d/yy tt'))

    })


    // + Return States & Methods:
    return {
        nav,

        guildId,
        guildData,
        userGuildData,
        guildDataState,
        saveGuildChoice,

        discordIdentities,
        sessionForm,
    }
})

export default useDashboardStore;