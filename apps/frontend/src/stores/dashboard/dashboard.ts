import { type API_SessionTemplateBodyInterface } from "@sessionsbot/shared";
import { defineStore } from "pinia";
import { fetchGuildAuditLog, fetchGuildChannels, fetchGuildRoles, fetchGuildSessions, fetchGuildSubscription, fetchGuildTemplates } from "./dashboard.api";
import { useAuthStore } from "../auth";

type DashboardTabName = 'Sessions' | 'Calendar' | 'Notifications' | 'AuditLog' | 'Preferences';

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

    /** Selected Guild Data - **NESTED** */
    const guildData = {
        channels: guildChannels,
        roles: guildRoles,
        subscription: guildSubscription,
        sessionTemplates: guildSessionTemplates,
        sessions: guildCurrentSessions,
        auditLog: guildAuditLogs
    }

    const userGuildData = computed(() => auth.user?.user_metadata?.guilds?.manageable.find(g => g.id == guildId.value))
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

        return { visible, editPayload, startEdit }
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
            auth.signIn('/dashboard')
            return;
        }

        // CHECKS PASSED - Fetch Data for selected Guild Id:
        for (const state of Object.values(guildData)) {
            state.execute()
        }

    })


    // + Return States & Methods:
    return {
        nav,

        guildId,
        guildData,
        userGuildData,
        saveGuildChoice,

        sessionForm,
    }
})

export default useDashboardStore;