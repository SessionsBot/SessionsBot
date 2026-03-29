<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { processVariableText, type Database, type FullSessionData } from '@sessionsbot/shared'
    import { DateTime } from 'luxon'
    import RsvpDetailsList from './RsvpDetailsList.vue';
    import AddToCalendarPopover from './AddToCalendarPopover.vue';
    import type { PopoverMethods } from 'primevue';
    import { externalUrls } from '@/stores/nav';
    import { ExternalLinkIcon } from 'lucide-vue-next';
    import { getDiscordHtml } from '@/utils/discordHtml';

    // Incoming Props:
    const props = defineProps<{
        session: FullSessionData | undefined
    }>()
    // Session Prop - Shorthand
    const s = computed(() => props.session)

    // Services:
    const auth = useAuthStore();
    const dashboard = useDashboardStore();

    // Self Identity:
    const selfIdentity = computed(() => auth.identity)

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
        return getDiscordHtml(processed)
    })


    // Add to Calendar - Popover:
    const addToCalPopover = ref<PopoverMethods>()

</script>


<template>

    <!-- Details Card -->
    <div class="p-4 max-w-75 w-[90%] rounded-md bg-bg-2 border-2 border-ring-soft flex gap-2 flex-center flex-col">

        <!-- Title - Header -->
        <div class="flex flex-center flex-col gap-2">
            <!-- Title -->
            <p class="w-full text-2xl font-bold">
                {{ s?.title }}
            </p>
        </div>

        <!-- Badges -->
        <!-- Delayed Session -->
        <div v-if="s?.status == 'delayed'" class="flex-center flex-row gap-px text-amber-600">
            <Iconify icon="tabler:clock-up" size="20" />
            <p class="font-bold uppercase italic">
                Delayed!
            </p>
        </div>
        <!-- Canceled Session -->
        <div v-if="s?.status == 'canceled'" class="flex-center flex-row text-invalid-1">
            <Iconify icon="basil:cancel-outline" />
            <p class="font-bold uppercase italic">
                Canceled!
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
                {{ startDateUTC?.setZone(s?.time_zone)?.offsetNameShort ?? '' }} - {{ s?.time_zone ?? 'Unknown' }}
            </span>
        </div>

        <!-- RSVPS -->
        <div v-if="s?.session_rsvp_slots?.length" class="flex w-full flex-col gap-1">
            <span class="flex items-center gap-px">
                <Iconify icon="mdi:user-check" class="opacity-80" size="20" />
                <p> RSVPs </p>
            </span>
            <span class="ml-2 bg-bg-3 rounded-md p-1 px-1.5 flex flex-center">
                <span v-if="!auth.signedIn" class="flex-center gap-1">
                    <Iconify icon="mdi:eye-off-outline" size="16" class="opacity-65" />
                    <p v-if="!auth.signedIn" class="italic text-sm py-1 opacity-55">
                        Sign in to view...
                    </p>
                </span>
                <RsvpDetailsList :rsvps="s?.session_rsvp_slots ?? []" />
            </span>
        </div>


        <!-- Server -->
        <div class="flex w-full flex-col gap-1">
            <span class="flex items-center gap-px">
                <DiscordIcon class="scale-90" />
                <p> Server </p>
            </span>
            <span class="ml-2 bg-bg-3 rounded-md p-1 px-1.5 flex flex-center flex-row flex-wrap gap-1">
                <span v-if="!auth.signedIn" class="flex-center gap-1">
                    <Iconify icon="mdi:eye-off-outline" size="16" class="opacity-65" />
                    <p v-if="!auth.signedIn" class="italic text-sm py-1 opacity-55">
                        Sign in to view...
                    </p>
                </span>
                <span v-else class="flex-center flex-row gap-1 py-0.75">
                    <img :src="guildIdentity?.iconUrl ? String(guildIdentity?.iconUrl) : '/discord-grey.png'"
                        class="size-6.25 bg-bg-3/30 rounded-md border-2 border-ring-soft" />
                    <p> {{ guildIdentity?.name || 'Unknown Server?' }} </p>
                </span>

            </span>
        </div>


        <!-- Actions -->
        <span class="flex-center flex-col w-full gap-2 py-2.5">
            <!-- Open In Sever - If Applicable -->
            <span class="flex flex-center w-full" v-if="selfIdentity?.guilds?.all?.find(g => g?.id == s?.guild_id)">
                <a v-if="auth.signedIn && auth.identity?.guilds.all.find(g => g?.id == s?.guild_id)"
                    :href="`https://discord.com/channels/${s?.guild_id}/${s?.thread_id ?? s?.channel_id}/${s?.panel_id}`"
                    target="_blank">
                    <Button unstyled
                        class="button-base bg-text-1/5 border border-ring-soft px-1 mt-1 hover:bg-text-1/10 active:scale-95">
                        <DiscordIcon class="size-5 opacity-70" />
                        <p class="text-sm font-semibold opacity-75">
                            View in Discord
                        </p>
                    </Button>
                </a>
            </span>

            <!-- Add to Calendar -->
            <Button @click="addToCalPopover?.show" unstyled title="Add to Calendar"
                class="button-base bg-text-1/5 border border-ring-soft px-1 hover:bg-text-1/10 active:scale-95">
                <Iconify icon="solar:calendar-add-bold" size="18" class="size-5! opacity-70" />
                <p class="text-sm font-semibold opacity-75">
                    Add to Calendar
                </p>
            </Button>


            <!-- Secondary - Invite the Bot -->
            <a :href="externalUrls.inviteBot"
                class="text-xs opacity-55 hover:opacity-75 hover:underline transition-all flex-center flex-row  mt-1.5 gap-1">
                Invite the Bot
                <Iconify icon="gridicons:external" size="12" />
            </a>
        </span>


        <!-- Add to calendar - Popover -->
        <Popover unstyled ref="addToCalPopover" class="p-2" :pt="{ arrow: {} }">
            <AddToCalendarPopover :eventData="s" />
        </Popover>


    </div>


</template>


<style scoped></style>