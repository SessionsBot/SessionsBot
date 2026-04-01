import { supabase } from "@/utils/supabase";
import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from "@supabase/supabase-js";
import { useAuthStore } from "../auth";
import useDashboardStore from "./dashboard";

export const useRealtimeUpdates = () => {
    const auth = useAuthStore();
    const store = useDashboardStore();
    const debugRealtime = true;
    const retryRealtimeAttempts = ref(0)
    const updateChannel = ref<RealtimeChannel>()


    async function subscribe() {
        try {
            // Prepare
            if (!store.guildId) return console.warn(`[Realtime Updates]: FAILED to subscribe - NO GUILD ID!`)
            if (updateChannel.value) {
                // Clear existing
                await supabase.removeChannel(updateChannel.value)
                updateChannel.value = undefined
            }

            // Set Realtime Auth:
            if (!auth.authReady) return console.warn('[Realtime Updates]: FAILED to subscribe - AUTH NOT READY!')
            if (!auth.user || !auth.session || !auth.signedIn) return console.warn('[Realtime Updates]: FAILED to subscribe - NO AUTH USER!')
            const token = auth.session?.access_token
            if (!token) return console.warn('[Realtime Updates]: FAILED to subscribe - NO AUTH TOKEN!')
            await supabase.realtime.setAuth(auth?.session?.access_token)

            // Create / Subscribe to Channel:
            updateChannel.value = supabase.channel(`guild-updates-${store.guildId}`)
                // Guild:
                .on('postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'guilds',
                        filter: `id=eq.${store.guildId}`
                    },
                    (payload) => {
                        if (debugRealtime) console.info('[Realtime Updates]: Guild Db Data', { payload })
                        const { eventType, new: newRow, old: oldRow } = payload
                        store.guildData.guild.state = newRow as any;
                    }
                )
                // Guild Stats:
                .on('postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'guild_stats',
                        filter: `guild_id=eq.${store.guildId}`
                    },
                    (payload) => {
                        if (debugRealtime) console.info('[Realtime Updates]: Guild Stats', { payload })
                        const { eventType, new: newRow, old: oldRow } = payload
                        store.guildData.guildStats.state = newRow as any;
                    }
                )
                // Session Templates:
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'session_templates',
                        filter: `guild_id=eq.${store.guildId}`
                    },
                    (payload) => {
                        if (debugRealtime) console.info('[Realtime Updates]: Session Templates', { payload })
                        const { eventType, new: newRow, old: oldRow } = payload
                        let guildTemplates = store.guildData.sessionTemplates.state ?? [];
                        if (eventType == 'INSERT') {
                            if (guildTemplates?.some(t => t?.id == newRow?.id)) return;
                            guildTemplates?.unshift(newRow as any)
                        } else if (eventType == 'UPDATE') {
                            const index = guildTemplates?.findIndex(t => t?.id == newRow?.id)
                            if (index != undefined && index !== -1) {
                                guildTemplates[index] = newRow as any;
                            } else console.warn('[Realtime]: Failed to update guild templates', { newRow, index })
                        } else if (eventType == 'DELETE') {
                            guildTemplates = guildTemplates?.filter(t => t?.id != oldRow?.id)
                        }
                        // Update Store:
                        store.guildData.sessionTemplates.state = guildTemplates
                    }
                )
                // Sessions:
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'sessions',
                        filter: `guild_id=eq.${store.guildId}`
                    },
                    (payload) => {
                        if (debugRealtime) console.info('[Realtime Updates]: Sessions', { payload })
                        const { eventType, new: newRow, old: oldRow } = payload
                        let guildSessions = store.guildData.sessions?.state ?? []
                        if (eventType == 'INSERT') {
                            if (guildSessions?.some(s => s?.id == newRow?.id)) return;
                            guildSessions?.unshift(newRow as any)
                        } else if (eventType == 'UPDATE') {
                            const index = guildSessions?.findIndex(s => s?.id == newRow?.id)
                            if (index != undefined && index !== -1) {
                                guildSessions[index] = newRow as any;
                            } else console.warn('[Realtime]: Failed to update guild sessions', { newRow, index })
                        } else if (eventType == 'DELETE') {
                            guildSessions = guildSessions?.filter(s => s?.id != oldRow?.id)
                        }
                        // Update Store:
                        store.guildData.sessions.state = guildSessions
                    }
                )
                // Audit Logs:
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'audit_logs',
                        filter: `guild_id=eq.${store.guildId}`
                    },
                    (payload) => {
                        if (debugRealtime) console.info('[Realtime Updates]: Audit Logs', { payload })
                        const { eventType, new: newRow, old: oldRow } = payload
                        let auditLogs = store.guildData.auditLog.state ?? [];
                        if (auditLogs?.some(a => a?.id == newRow?.id)) return;
                        auditLogs?.unshift(newRow as any)
                        // Update Store:
                        store.guildData.auditLog.state = auditLogs
                    }
                )
                // Subscribe
                .subscribe(async (s, err) => {
                    // Handle Status:
                    if (s == REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
                        if (debugRealtime) console.info('[Realtime Updates]: ✅ SUBSCRIBED!')
                        retryRealtimeAttempts.value = 0
                    } else if (s == REALTIME_SUBSCRIBE_STATES.CLOSED) {
                        if (debugRealtime) console.info('[Realtime Updates]: 🗑️ UNSUBSCRIBED!')
                    } else {
                        console.warn(`[Realtime Error]: ❌ FAILED to Subscribe! - ${s}`, ...[err ? { error: err } : null].filter(Boolean))
                    }

                    // Timed Out? - Try Again:
                    if (s == 'TIMED_OUT' || s == 'CHANNEL_ERROR') {
                        if (retryRealtimeAttempts.value >= 3) return console.error(`[Realtime Error]: FAILED to Subscribe - AFTER 3 ATTEMPTS!`, { status: s, error: err })
                        else {
                            // RETRY - Subscribe to channel:
                            retryRealtimeAttempts.value += 1;
                            console.info(`[Realtime Updates]: Attempting to re-subscribe after timeout/error! - Retry ${retryRealtimeAttempts.value}`)
                            if (updateChannel.value) {
                                await supabase.realtime.removeChannel(updateChannel.value)
                                updateChannel.value = undefined;
                            }
                            await new Promise(res => setTimeout(res, 1000 * retryRealtimeAttempts.value))
                            await subscribe()
                        }
                    }
                })

            // Add window close event:
            window.addEventListener('beforeunload', async () => {
                if (updateChannel.value)
                    await unsubscribe()
            })

            // Add window visibility event:
            document.addEventListener('visibilitychange', async () => {
                if (document.hidden && updateChannel.value) {
                    console.info('[Realtime Updates]: Tab hidden - unsubscribing!')
                    await unsubscribe()
                } else {
                    if (store?.guildId && !updateChannel.value && auth?.signedIn && auth?.authReady) {
                        console.log('[Realtime Updates]: Tab visible - re-subscribing!')
                        await subscribe()
                    }
                }
            })

        } catch (err) {
            // Log Failure:
            console.error('[Realtime Updates]: Subscribe Error Caught!', err)
        }
    }

    async function unsubscribe() {
        try {
            if (updateChannel.value) {
                await supabase.removeChannel(updateChannel.value)
                updateChannel.value = undefined
            }
            else console.warn('[Realtime Updates]: Tried to unsubscribe from a guild updates channel! - No channel found!')
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