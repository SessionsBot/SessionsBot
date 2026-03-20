import { discordSnowflakeSchema, SubscriptionLimits, type API_DiscordGuildIdentity, type API_DiscordUserIdentity, type API_SessionTemplateBodyInterface, type APIResponseValue } from "@sessionsbot/shared";
import { defineStore } from "pinia";
import { fetchGuildAuditLog, fetchGuildChannels, fetchGuildData, fetchGuildEmojis, fetchGuildRoles, fetchGuildSessions, fetchGuildStats, fetchGuildSubscription, fetchGuildTemplates, fetchMigratingTemplates } from "./guildData.api";
import { useAuthStore } from "../auth";
import { DateTime } from "luxon";
import { API } from "@/utils/api";
import { z } from 'zod'
import router from "@/router/router";
import useNotifier from "../notifier";
import LimitReachedAlert from "@/components/notifier/limitReachedAlert.vue";
import { useRealtimeUpdates } from "./realtime.api";

export type DashboardTabName = 'Sessions' | 'Calendar' | 'Notifications' | 'AuditLog' | 'Preferences';

// Default options for guild data fetching:
const _defaultAsyncStateOptions = {
    immediate: false,
    resetOnExecute: false,
} as const


// Dashboard Store:
const useDashboardStore = defineStore('dashboard', () => {
    /** Private Variables */
    const auth = useAuthStore()
    const authKey = computed(() => auth.session?.access_token)

    /** Currently Selected `Guild Id`. */
    const guildId = ref<string | null>(null)

    /** Selected Guild Data - **NESTED** */
    const guildData = {
        /** Guild Data - Preferences / Guild Row */
        guild: useAsyncState(() => fetchGuildData(guildId.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: Guild Row (Preferences) - Fetch Error!', e) }
        }),

        /** Guild Data - Guild Stats */
        guildStats: useAsyncState(() => fetchGuildStats(guildId.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: Guild Stats - Fetch Error!', e) }
        }),

        /** Guild Data - Channels */
        channels: useAsyncState(() => fetchGuildChannels(guildId.value, authKey.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: Guild Channels - Fetch Error!', e) }
        }),

        /** Guild Data - Channels */
        roles: useAsyncState(() => fetchGuildRoles(guildId.value, authKey.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: Guild Roles - Fetch Error!', e) }
        }),

        /** Guild Data - Emojis */
        emojis: useAsyncState(() => fetchGuildEmojis(guildId.value, authKey.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: Guild Emojis - Fetch Error!', e) }
        }),

        /** Guild Data - Subscription */
        subscription: useAsyncState(() => fetchGuildSubscription(guildId.value, authKey.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: Guild Subscription - Fetch Error!', e) }
        }),

        /** Guild Data - Session Templates */
        sessionTemplates: useAsyncState(() => fetchGuildTemplates(guildId.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: Session Templates - Fetch Error!', e) }
        }),

        /** Guild Data - Sessions */
        sessions: useAsyncState(() => fetchGuildSessions(guildId.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: Guild Sessions - Fetch Error!', e) }
        }),

        /** Guild Data - Audit Logs */
        auditLog: useAsyncState(() => fetchGuildAuditLog(guildId.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: Audit Log(s) - Fetch Error!', e) }
        }),

        /** Guild Data - Migrating Templates *(@temporary)* */
        migratingTemplates: useAsyncState(() => fetchMigratingTemplates(guildId.value), undefined, {
            ..._defaultAsyncStateOptions,
            onError(e) { console.error('[DASHBOARD DATA]: MIGRATING TEMPLATES - Fetch Error!', e) }
        })
    }

    /** Guild Data - From Auth **`IDENTITY`** */
    const userGuildData = computed(() => auth.identity?.guilds?.manageable.find(g => g.id == guildId.value))

    /** Selected Guild Data Fetch States - **NESTED** */
    const guildDataState = {
        allReady: computed(() => {
            if (guildId.value == null) return false
            return Object.values(guildData).every(s => s?.isReady.value == true)
        }),
        initialFetchOk: ref(false),
        fetchedAt: ref<DateTime | null>(null),
        errors: computed(() => {
            if (guildId.value == null) return []
            return Object.values(guildData).filter(s => s?.error.value != null)?.map(s => s?.error.value)
        })
    }

    /** **Util:** Refreshes a specified set of `guildData` 
     * @note This does *NOT* trigger dashboard loading UI(s)
     * @see {@link guildData} */
    async function refetchData(data: keyof typeof guildData) {
        await guildData[data].execute();
    }

    /** Saved Selection - Choice Class */
    const saveGuildChoice = {
        saveKey: 'SB_Dashboard_Guild',
        /** Gets and returns any saved guild selection's id or null. */
        get() {
            return localStorage.getItem(this.saveKey)
        },
        /** Assigns a new saved guild selection by id. */
        set(guildId: string) {
            return localStorage.setItem(this.saveKey, guildId)
        },
        /** Assigns the selected dashboard guild to the saved choice, if any. */
        assign() {
            const choice = this.get();
            if (choice) { guildId.value = choice };
        },
        /** Removes any saved selected dashboard guild. */
        clear() {
            return localStorage.removeItem(this.saveKey)
        }
    }

    /** Navigation - Nested States/Methods */
    const nav = reactive({
        /** Current "Tab" to display/view within Dashboard UI. */
        currentTab: <DashboardTabName>"Sessions",
        /** Whether or not the Dashboard Nav element is "expanded" or not. */
        expanded: false,
        /** The session id to bring into focus and highlight. */
        highlightedSessionId: <string | undefined>undefined,
        /** The template id to bring into focus and highlight. */
        highlightedTemplateId: <string | undefined>undefined
    })


    /** Discord Identities - From Ids */
    const useDiscordIdentities = () => {
        // Cached Identities:
        type cachedUserIdentity = API_DiscordUserIdentity & { fetched_at: DateTime }
        type cachedGuildIdentity = API_DiscordGuildIdentity & { fetched_at: DateTime }

        const inFlight_users = ref<Map<string, Promise<cachedUserIdentity | undefined>>>(new Map())
        const cache_users = ref<Map<string, cachedUserIdentity>>(new Map())
        const inFlight_guilds = ref<Map<string, Promise<cachedGuildIdentity | undefined>>>(new Map())
        const cache_guilds = ref<Map<string, cachedGuildIdentity>>(new Map())
        const cacheTimeMs = (15 * 60 * 1000)

        /** Gets a Discord User Identity by UserId (using cache). */
        async function getUser(userId: string) {
            // Confirm User Id:
            const { success: validUserId, error: userIdError } = z.safeParse(discordSnowflakeSchema, userId)
            if (!validUserId) {
                console.warn(`[!] Failed to fetch Discord Identity - INVALID USER ID - ${userId}`, { input_errors: z.treeifyError(userIdError)?.errors })
                return undefined
            }
            // Get & Return Cached User if NOT Expired:
            const cachedUser = cache_users.value.get(userId)
            if (cachedUser) {
                const expired = Math.abs(cachedUser.fetched_at.diffNow().milliseconds) >= cacheTimeMs
                if (!expired) return cachedUser
            }

            // Already fetching?
            const existing = inFlight_users.value.get(userId)
            if (existing) return existing

            // Create request
            const request = (async () => {
                try {
                    const result = await API.get<APIResponseValue<API_DiscordUserIdentity>>(
                        `/discord/identity/user/${userId}`
                    )

                    if (!result.data?.success) return undefined

                    const identity: cachedUserIdentity = {
                        ...result.data.data,
                        fetched_at: DateTime.now(),
                    } as any

                    cache_users.value.set(userId, identity)
                    return identity
                } finally {
                    inFlight_users.value.delete(userId)
                }
            })()

            inFlight_users.value.set(userId, request)
            return request
        }


        /** Gets a Discord Guild Identity by UserId (using cache). */
        async function getGuild(guildId: string) {
            // Confirm Guild Id:
            const { success: validGuildId, error: guildIdError } = z.safeParse(discordSnowflakeSchema, guildId)
            if (!validGuildId) {
                console.warn(`[!] Failed to fetch Discord Identity - INVALID GUILD ID - ${guildId}`, { input_errors: z.treeifyError(guildIdError)?.errors })
                return undefined
            }
            // Get & Return Cached Guild if NOT Expired:
            const cachedGuild = cache_guilds.value.get(guildId)
            if (cachedGuild) {
                const expired = Math.abs(cachedGuild.fetched_at.diffNow().milliseconds) >= cacheTimeMs
                if (!expired) return cachedGuild
            }

            // Already fetching?
            const existing = inFlight_guilds.value.get(guildId)
            if (existing) return existing

            // Create request
            const request = (async () => {
                try {
                    const result = await API.get<APIResponseValue<API_DiscordGuildIdentity>>(
                        `/discord/identity/guild/${guildId}`
                    )

                    if (!result.data?.success) return undefined

                    const identity: cachedGuildIdentity = {
                        ...result.data.data,
                        fetched_at: DateTime.now(),
                    } as any

                    cache_guilds.value.set(guildId, identity)
                    return identity
                } finally {
                    inFlight_guilds.value.delete(guildId)
                }
            })()

            inFlight_guilds.value.set(guildId, request)
            return request
        }

        // Return States & Methods:
        return {
            user: {
                get: getUser
            },
            guild: {
                get: getGuild
            }
        }
    }
    const discordIdentities = useDiscordIdentities()


    /** Session Form - States & Methods: */
    const useSessionForm = () => {
        /** Session (Template) Form - Visibility Boolean */
        const visible = ref(false)

        /** The current 'action' the session form will perform */
        const actionMode = ref<'new' | 'edit' | 're-enable' | 're-enable-migrating'>('new');

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
            /** If to only check if this guild can create a new session - returns `boolean` - does NOT open form. */
            check_only?: true
        } | null;

        /** Fn - Attempts to open/create a new session schedule, if subscription allows does so - or else alerts. */
        function createNew(opts?: creationPayload) {
            const subscription = guildData.subscription.state.value;
            const maxSchedulesAllowed = subscription?.limits.MAX_SCHEDULES ?? SubscriptionLimits.FREE.MAX_SCHEDULES
            const activeSchedulesCount = guildData.sessionTemplates.state.value?.length ?? 0

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
                if (opts?.check_only) return true
                sessionForm.visible.value = true;
                return true
            }
        }

        return { visible, actionMode, creationPayload, editPayload, startEdit, createNew }
    }
    const sessionForm = useSessionForm()


    /** DB - Guild Updates - REALTIME */
    const guildRealtimeUpdates = useRealtimeUpdates()


    // + WATCH - Guild Id - Fetch & Reset Data on Selected Guild Id Change:
    watch(guildId, async (id) => {
        // Guild Unselected - RESET DATA:
        if (!id) {
            // Reset Data
            for (const state of Object.values(guildData)) {
                state.state.value = undefined
                state.isReady.value = false
                state.isLoading.value = false
                state.error.value = undefined
            }
            guildDataState.initialFetchOk.value = false;
            await guildRealtimeUpdates.unsubscribe()
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
        const isManageable = auth.identity?.guilds?.manageable?.some(g => g.id == id)
        if (!isManageable) {
            // Unaccessible Guild Alert:
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
        await Promise.allSettled(promises)

        // Check For Errors - Initial Fetch State:
        const hasErrors = Object.values(guildData).some(s => s.error.value != null)
        guildDataState.initialFetchOk.value = !hasErrors
        if (hasErrors) return

        // Subscribe to Changes:
        await guildRealtimeUpdates.subscribe()

        // Assign Guild's Last Fetch Date:
        guildDataState.fetchedAt.value = DateTime.now()
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

        refetchData,

        discordIdentities,
        sessionForm,
    }

})

export default useDashboardStore;