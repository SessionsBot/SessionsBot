<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { supabase } from '@/utils/supabase';
    import { toHTML } from '@odiffey/discord-markdown';
    import { processVariableText } from '@sessionsbot/shared';
    import { DateTime } from 'luxon';
    import z from 'zod';


    // Services:
    const auth = useAuthStore();
    const dashboard = useDashboardStore()
    const route = useRoute()

    // Session Data:
    const rawId = computed(() => route.params?.sessionId as string)
    const sessionIdInvalid = ref(false)

    const sessionData = useAsyncState(async (id: string) => {
        if (!id) throw new Error('No Session ID for data fetch provided!')
        const { data, error } = await supabase.from('sessions')
            .select('*, session_rsvp_slots(*, session_rsvps(*))')
            .eq('id', id)
            .maybeSingle()
        if (error) throw error
        else return data
    }, null, {
        immediate: false,
        onError(e) {
            console.error(`[SESSION DATA]: Failed to fetch!`, e)
        },
    })
    const s = computed(() => sessionData.state.value)

    const startDateUTC = computed(() => DateTime.fromISO(String(s?.value?.starts_at_utc), { zone: 'utc' }))

    const parsedDescription = computed(() => {
        const raw = s.value?.description
        if (!raw) return null
        const processed = processVariableText(raw, { displayDate: startDateUTC.value.setZone(s?.value?.time_zone) })
        const html = toHTML(processed, {
            embed: true,
            discordOnly: false,
            discordCallback: {
                role(node) {
                    return `&Role`
                },
                channel(node) {
                    return `#Channel`
                },
                user(node) {
                    return `@User`
                },
                timestamp(node) {
                    if (!isNaN(node.timestamp)) {
                        if (node.style == 'R') {
                            return DateTime.fromSeconds(Number(node.timestamp)).toRelative() ?? "TIMESTAMP"
                        }
                        const styleToken = () => {
                            if (node.style == 't') return 't'
                            else if (node.style == 'T') return 'tt'
                            else if (node.style == 'd') return 'D'
                            else if (node.style == 'D') return 'DDD'
                            else if (node.style == 'f') return `DDD 'at' t`
                            else if (node.style == 'F') return `DDD 'at' t`
                            else return 'f'
                        }
                        return DateTime.fromSeconds(Number(node.timestamp)).toFormat(styleToken())
                    } else return "TIMESTAMP"

                },
                slash(node) {
                    return '/command'
                }
            },
        })
        return html
    })

    onMounted(() => {
        // Validate & Load Session by Id:
        if (rawId.value) {
            // validate
            const validation = z.uuid().safeParse(rawId.value)
            if (validation.success) {
                // Valid Session Id - Attempt Fetch:
                console.info('fetching', validation.data)
                sessionData.executeImmediate(validation.data)
            } else {
                // Invalid Id Format:
                sessionIdInvalid.value = true
            }
        } else {
            // Invalid - No Id Provided:
            sessionIdInvalid.value = true
        }
    })

</script>


<template>
    <main class="flex justify-center items-center flex-col gap-2 p-4">

        <Transition name="zoom">

            <!-- Invalid Id - Card -->
            <div v-if="sessionIdInvalid" class="p-3 rounded-md bg-bg-2 border-2 border-ring-soft flex flex-center">
                INVALID SESSION ID:
                {{ rawId }}
            </div>


            <!-- Session Data View -->
            <div v-else class="flex flex-center p-5">

                <div class="p-4 rounded-md bg-bg-2 border-2 border-ring-soft flex gap-2 flex-center flex-col">

                    <!-- Title & Description -->
                    <div>
                        <!-- Title -->
                        <p class="w-full text-xl font-bold">
                            {{ s?.title }}
                        </p>

                        <!-- Description -->
                        <span v-if="parsedDescription"
                            class="w-full text-sm opacity-65 font-bold flex items-start justify-start">
                            <span class="discord-preview w-full" v-html="parsedDescription" />
                        </span>

                    </div>

                    <!-- Start Date -->
                    <div class="flex w-full flex-col gap-1">
                        <span class="flex items-center gap-px">
                            <Iconify icon="mdi:clock" class="opacity-80" size="20" />
                            <p> Start Date </p>
                        </span>
                        <span class="ml-2 bg-bg-3 rounded-md p-1 px-1.5">
                            {{ DateTime.fromISO(String(s?.starts_at_utc)).toFormat('f') ?? 'Unknown' }}
                        </span>
                    </div>

                    <!-- End Date -->
                    <div v-if="s?.duration_ms && Number(s?.duration_ms)" class="flex w-full flex-col gap-1">
                        <span class="flex items-center gap-px">
                            <Iconify icon="mdi:clock" class="opacity-80" size="20" />
                            <p> End Date </p>
                        </span>
                        <span class="ml-2 bg-bg-3 rounded-md p-1 px-1.5">
                            {{ DateTime.fromISO(String(s?.starts_at_utc)).plus({
                                millisecond: Number(s?.duration_ms)
                            }).toFormat('f') ?? 'Unknown' }}
                        </span>
                    </div>

                    <!-- Time Zone -->
                    <div class="flex w-full flex-col gap-1">
                        <span class="flex items-center gap-px">
                            <Iconify icon="mdi:clock" class="opacity-80" size="20" />
                            <p> Time Zone </p>
                        </span>
                        <span class="ml-2 bg-bg-3 rounded-md p-1 px-1.5">
                            {{ s?.time_zone ?? 'Unknown' }}
                        </span>
                    </div>


                </div>

            </div>
        </Transition>

    </main>
</template>


<style scoped></style>