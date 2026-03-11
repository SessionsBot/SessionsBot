<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { toHTML } from '@odiffey/discord-markdown'
    import { processVariableText, type Database, type FullSessionData } from '@sessionsbot/shared'
    import { DateTime } from 'luxon'

    // Incoming Props:
    const props = defineProps<{
        session: Database['public']['Tables']['sessions']['Row'] | FullSessionData | null
    }>()
    // Session Prop - Shorthand
    const s = computed(() => props.session)

    // Services:
    const auth = useAuthStore();
    const dashboard = useDashboardStore();

    // Guild Identity:
    const guildIdentity = computedAsync(async () => {
        if (s.value?.guild_id != null) {
            const i = await dashboard.discordIdentities.guild.get(s.value.guild_id)
            return i
        } else return undefined
    })

    // Session Start UTC
    const startDateUTC = computed(() => DateTime.fromISO(String(s?.value?.starts_at_utc), { zone: 'utc' }))

    // Session Description (if any)
    const parsedDescription = computed(() => {
        const raw = s.value?.description
        if (!raw) return null
        const processed = processVariableText(raw, { displayDate: startDateUTC.value.setZone(s?.value?.time_zone) })
        const html = toHTML(processed, {
            embed: true,
            discordOnly: false,
            discordCallback: {
                role(node) { return `@Role` },
                channel(node) { return `#Channel` },
                user(node) { return `@User` },
                slash(node) { return '/command' },
                timestamp(node) {
                    if (!isNaN(node.timestamp)) {
                        if (node.style == 'R') {
                            return DateTime.fromSeconds(Number(node.timestamp))?.toRelative() ?? "TIMESTAMP"
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
                        return DateTime.fromSeconds(Number(node.timestamp))?.toFormat(styleToken())
                    } else return "TIMESTAMP"

                }
            }
        })
        return html
    })

</script>


<template>
    <div class="flex flex-center p-5 grow">

        <div class="p-4 rounded-md bg-bg-2 border-2 border-ring-soft flex gap-2 flex-center flex-col">

            <!-- Title - Header -->
            <div class="flex flex-center flex-col gap-2">
                <!-- Title -->
                <p class="w-full text-2xl font-bold">
                    {{ s?.title }}
                </p>
            </div>


            <!-- Description -->
            <div v-if="parsedDescription" class="flex w-full flex-col gap-1">
                <span class="flex items-center gap-px">
                    <Iconify icon="mdi:text" class="opacity-80" size="20" />
                    <p> Description </p>
                </span>
                <span class="ml-2 bg-bg-3 rounded-md p-1 px-1.5 block! discord-preview" v-html="parsedDescription" />
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

            <!-- RSVPS -->
            <div class="flex w-full flex-col gap-1">
                <span class="flex items-center gap-px">
                    <Iconify icon="mdi:user-check" class="opacity-80" size="20" />
                    <p> RSVPs </p>
                </span>
                <span class="ml-2 bg-bg-3 rounded-md p-1 px-1.5 flex flex-center">

                    <Button v-if="!auth.signedIn" title="Sign into account" @click="auth.signIn($route.fullPath)"
                        unstyled class="button-base button-primary active:scale-95 py-0.5 my-1">
                        <DiscordIcon class="scale-90 opacity-80" />
                        Sign in to view
                    </Button>

                    <p v-else class="opacity-55 italic text-xs py-12">
                        (rsvps here)
                    </p>

                </span>
            </div>


            <!-- Server -->
            <div class="flex w-full flex-col gap-1">
                <span class="flex items-center gap-px">
                    <DiscordIcon class="scale-90" />
                    <p> Server </p>
                </span>
                <span class="ml-2 bg-bg-3 rounded-md p-2 px-1.5 flex flex-center flex-row flex-wrap gap-1">
                    <img :src="guildIdentity?.iconUrl ? String(guildIdentity?.iconUrl) : '/discord-grey.png'"
                        class="size-6.25 bg-bg-3/30 rounded-md border-2 border-ring-soft" />

                    <p> {{ guildIdentity?.name || 'Unknown Server?' }} </p>

                    <!-- Open In Sever - If Applicable -->
                    <span class="flex flex-center w-full">
                        <a v-if="auth.signedIn && auth.identity?.guilds.all.find(g => g?.id == s?.guild_id)"
                            :href="`https://discord.com/channels/${s?.guild_id}/${s?.thread_id ?? s?.channel_id}/${s?.panel_id}`"
                            target="_blank">
                            <Button unstyled class="button-secondary button-base px-1 mt-1">
                                <DiscordIcon class="size-5" />
                                <p class="text-sm font-semibold">
                                    View in Discord
                                </p>
                            </Button>
                        </a>
                    </span>
                </span>
            </div>




        </div>
    </div>
</template>


<style scoped></style>