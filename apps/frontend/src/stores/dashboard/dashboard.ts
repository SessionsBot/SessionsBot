import { discordSnowflakeSchema, SubscriptionLimits, type API_DiscordGuildIdentity, type API_DiscordUserIdentity, type API_SessionTemplateBodyInterface, type APIResponseValue } from "@sessionsbot/shared";
import { defineStore } from "pinia";
import { fetchGuildAuditLog, fetchGuildChannels, fetchGuildData, fetchGuildRoles, fetchGuildSessions, fetchGuildStats, fetchGuildSubscription, fetchGuildTemplates } from "./dashboard.api";
import { useAuthStore } from "../auth";
import { DateTime } from "luxon";
import { API } from "@/utils/api";
import { z } from 'zod'
import router from "@/router/router";
import useNotifier from "../notifier";
import LimitReachedAlert from "@/components/notifier/limitReachedAlert.vue";
import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

export type DashboardTabName = 'Sessions' | 'Calendar' | 'Notifications' | 'AuditLog' | 'Preferences';

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
            immediate: false,
            resetOnExecute: false,
            onError(e) { console.error('[GUILD DATA/PREFERENCES] - Fetch Error:', e) },
        }),

        /** Guild Data - Guild Stats */
        guildStats: useAsyncState(() => fetchGuildStats(guildId.value), undefined, {
            immediate: false,
            resetOnExecute: false,
            onError(e) { console.error('[GUILD DATA/PREFERENCES] - Fetch Error:', e) },
        }),

        /** Guild Data - Channels */
        channels: useAsyncState(() => fetchGuildChannels(guildId.value, authKey.value), undefined, {
            immediate: false,
            resetOnExecute: false,
            onError(e) { console.error('[GUILD CHANNELS] - Fetch Error:', e) },
        }),

        /** Guild Data - Channels */
        roles: useAsyncState(() => fetchGuildRoles(guildId.value, authKey.value), undefined, {
            immediate: false,
            resetOnExecute: false,
            onError(e) { console.error('[GUILD ROLES] - Fetch Error:', e) },
        }),

        /** Guild Data - Subscription */
        subscription: useAsyncState(() => fetchGuildSubscription(guildId.value, authKey.value), undefined, {
            immediate: false,
            resetOnExecute: false,
            onError(e) { console.error('[GUILD SUBSCRIPTION] - Fetch Error:', e) },
        }),

        /** Guild Data - Session Templates */
        sessionTemplates: useAsyncState(() => fetchGuildTemplates(guildId.value), undefined, {
            immediate: false,
            resetOnExecute: false,
            onError(e) { console.error('[GUILD TEMPLATES] - Fetch Error:', e) },
        }),

        /** Guild Data - Sessions */
        sessions: useAsyncState(() => fetchGuildSessions(guildId.value), undefined, {
            immediate: false,
            resetOnExecute: false,
            onError(e) { console.error('[GUILD SESSIONS] - Fetch Error:', e) },
        }),

        /** Guild Data - Audit Logs */
        auditLog: useAsyncState(() => fetchGuildAuditLog(guildId.value), undefined, {
            immediate: false,
            resetOnExecute: false,
            onError(e) { console.error('[GUILD AUDIT LOG] - Fetch Error:', e) },
        })
    }

    /** Guild Data - From Auth User - **`UNTRUSTED`** */
    const userGuildData = computed(() => auth.user?.app_metadata?.guilds?.manageable.find(g => g.id == guildId.value))

    /** Selected Guild Data Fetch States - **NESTED** */
    const guildDataState = {
        allReady: computed(() => {
            if (guildId.value == null) return false
            return Object.values(guildData).every(s => s?.isReady.value == true)
        }),
        initialFetchOk: ref(false),
        errors: computed(() => {
            if (guildId.value == null) return []
            return Object.values(guildData).filter(s => s?.error.value != null)?.map(s => s?.error.value)
        }),
        fetchedAt: ref<DateTime | null>(null)
    }

    async function refetchData(data: keyof typeof guildData) {
        await guildData[data].execute();
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
        const actionMode = ref<'new' | 'edit' | 're-enable'>('new');

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
    const useRealtimeUpdates = () => {
        const debugRealtime = true;
        const retryRealtimeAttempts = ref(0)
        const updateChannel = ref<RealtimeChannel>()

        async function subscribe() {
            try {
                // Prepare
                if (!guildId.value) return console.warn(`[Realtime Updates]: FAILED to subscribe - NO GUILD ID!`)
                if (updateChannel.value) { await supabase.removeChannel(updateChannel.value); updateChannel.value = undefined; }

                // Set Realtime Auth:
                if (!auth.authReady) return console.warn('[Realtime Updates]: FAILED to subscribe - AUTH NOT READY!')
                if (!auth.user || !auth.session || !auth.signedIn) return console.warn('[Realtime Updates]: FAILED to subscribe - NO AUTH USER!')
                const token = auth.session?.access_token
                if (!token) return console.warn('[Realtime Updates]: FAILED to subscribe - NO AUTH TOKEN!')
                await supabase.realtime.setAuth(auth?.session?.access_token)

                // Create / Subscribe to Channel:
                updateChannel.value = supabase.channel(`guild-updates-${guildId.value}`)
                    // Guild:
                    .on('postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'guilds',
                            filter: `id=eq.${guildId.value}`
                        },
                        (payload) => {
                            if (debugRealtime) console.info('[Realtime Updates]: Guild Db Data', { payload })
                            const { eventType, new: newRow, old: oldRow } = payload
                            const guildDbData = guildData.guild.state;
                            guildDbData.value = newRow as any;
                        }
                    )

                    // Guild Stats:
                    .on('postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'guild_stats',
                            filter: `guild_id=eq.${guildId.value}`
                        },
                        (payload) => {
                            if (debugRealtime) console.info('[Realtime Updates]: Guild Stats', { payload })
                            const { eventType, new: newRow, old: oldRow } = payload
                            const guildStats = guildData.guildStats.state;
                            guildStats.value = newRow as any;
                        }
                    )

                    // Session Templates:
                    .on('postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'session_templates',
                            filter: `guild_id=eq.${guildId.value}`
                        },
                        (payload) => {
                            if (debugRealtime) console.info('[Realtime Updates]: Session Templates', { payload })
                            const { eventType, new: newRow, old: oldRow } = payload
                            const guildTemplates = guildData.sessionTemplates.state;
                            if (eventType == 'INSERT') {
                                if (guildTemplates.value?.some(t => t?.id == newRow?.id)) return;
                                guildTemplates.value?.unshift(newRow as any)
                            } else if (eventType == 'UPDATE') {
                                const index = guildTemplates.value?.findIndex(t => t?.id == newRow?.id)
                                if (index != undefined && index !== -1 && guildTemplates.value) {
                                    guildTemplates.value[index] = newRow as any;
                                } else console.warn('[Realtime]: Failed to update guild templates', { newRow, index })
                            } else if (eventType == 'DELETE') {
                                guildTemplates.value = guildTemplates.value?.filter(t => t?.id != oldRow?.id)
                            }
                        }
                    )

                    // Sessions:
                    .on('postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'sessions',
                            filter: `guild_id=eq.${guildId.value}`
                        },
                        (payload) => {
                            if (debugRealtime) console.info('[Realtime Updates]: Sessions', { payload })
                            const { eventType, new: newRow, old: oldRow } = payload
                            const guildSessions = guildData.sessions.state;
                            if (eventType == 'INSERT') {
                                if (guildSessions.value?.some(s => s?.id == newRow?.id)) return;
                                guildSessions.value?.unshift(newRow as any)
                            } else if (eventType == 'UPDATE') {
                                const index = guildSessions.value?.findIndex(t => t?.id == newRow?.id)
                                if (index != undefined && index !== -1 && guildSessions.value) {
                                    guildSessions.value[index] = newRow as any;
                                } else console.warn('[Realtime]: Failed to update guild sessions', { newRow, index })
                            } else if (eventType == 'DELETE') {
                                guildSessions.value = guildSessions.value?.filter(t => t?.id != oldRow?.id)
                            }
                        }
                    )

                    // Audit Logs:
                    .on('postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'audit_logs',
                            filter: `guild_id=eq.${guildId.value}`
                        },
                        (payload) => {
                            if (debugRealtime) console.info('[Realtime Updates]: Audit Logs', { payload, fullUpdate: guildData.auditLog.state.value })
                            const { eventType, new: newRow, old: oldRow } = payload
                            const auditLogs = guildData.auditLog.state;
                            if (auditLogs.value?.some(a => a?.id == newRow?.id)) return;
                            auditLogs.value?.unshift(newRow as any)
                        }
                    )

                    // Subscribe
                    .subscribe(async (s, err) => {
                        // Debug
                        if (debugRealtime) {
                            if (s == REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                                console.info('[Realtime Updates]: ✅ SUBSCRIBED!')
                            } else if (s == REALTIME_SUBSCRIBE_STATES.CLOSED) {
                                console.info('[Realtime Updates]: 🗑️ UNSUBSCRIBED!')
                            } else {
                                console.warn(`[Realtime Error]: ❌ FAILED to Subscribe! - ${s}`, { error: err })
                            }
                        }
                        // Timed Out? - Try Again:
                        if (s == 'TIMED_OUT' || s == 'CHANNEL_ERROR') {
                            console.info('[Realtime Updates]: Attempting to re-subscribe after timeout/error!')

                            if (retryRealtimeAttempts.value >= 3) return console.error(`[Realtime Error]: FAILED to Subscribe AFTER 3 RETRY ATTEMPTS!`, { status: s, error: err })
                            else {
                                retryRealtimeAttempts.value += 1;
                                await supabase.removeAllChannels()
                                await subscribe()
                            }
                        }
                    })

            } catch (err) {
                // Log Failure:
                console.error('[Realtime Updates]: Subscribe Error Caught', err)
            }
        }

        async function unsubscribe() {
            try {
                if (updateChannel.value) { await supabase.removeChannel(updateChannel.value); updateChannel.value = undefined; }
                else console.warn('Tried to unsubscribe from a guild updates channel! - No channel found!')
            } catch (err) {
                // Log Failure:
                console.error('[Realtime Updates]: Unsubscribe Error Caught', err)
            }
        }

        return {
            subscribe,
            unsubscribe
        }
    }
    const guildRealtimeUpdates = useRealtimeUpdates();


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
        const isManageable = auth.user?.app_metadata?.guilds?.manageable?.some(g => g.id == id)
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
        await Promise.allSettled(promises)

        // Check For Errors - Initial Fetch State:
        const hasErrors = Object.values(guildData).some(s => s.error.value != null)
        guildDataState.initialFetchOk.value = !hasErrors

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