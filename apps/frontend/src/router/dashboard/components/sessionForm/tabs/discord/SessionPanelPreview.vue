<script lang="ts" setup>
    import { XIcon } from 'lucide-vue-next';
    import type { NewSession_ValueTypes } from '../../sesForm.vue';
    import { API_GuildPreferencesDefaults, processVariableText, RegExp_DiscordEmojiId } from '@sessionsbot/shared';
    import { DateTime } from 'luxon';
    import { getDiscordHtml } from '@/utils/discordHtml';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { externalUrls } from '@/stores/nav';


    // Incoming props & modals:
    const visible = defineModel<boolean>('visible')
    const props = defineProps<{
        sessionData: (NewSession_ValueTypes & { timeZone: { name: string, value: string } })
    }>()

    // Services:
    const dashboard = useDashboardStore()

    // Guild Data
    const guildAccentColor = computed(() => dashboard.guildData.guild.state?.accent_color ?? API_GuildPreferencesDefaults.accent_color)
    const guildCalendarButton = computed(() => dashboard.guildData.guild.state?.calendar_button)
    const guildPublicSessions = computed(() => dashboard.guildData.guild.state?.public_sessions)
    const guildShowWatermark = computed(() => dashboard.guildData.subscription.state?.limits.SHOW_WATERMARK)

    // Session Data:
    const s = computed(() => props.sessionData)

    // Start Date:
    const startInZone = computed(() =>
        DateTime.fromJSDate(s.value?.startDate, { zone: 'local' })
            ?.setZone(s?.value.timeZone?.value, { keepLocalTime: true })
    )

    // End Date:
    const endInZone = computed(() => s.value?.endDate
        ? DateTime.fromJSDate(s.value?.endDate, { zone: 'local' })
            ?.setZone(s?.value.timeZone?.value, { keepLocalTime: true })
        : null
    )

    // Parsed Desc:
    const descriptionHtml = computed(() => {
        const raw = s.value?.description
        if (!raw || !raw?.length) return null;
        const processed = processVariableText(raw)
        return getDiscordHtml(processed)
    })

    // Custom RSVP Slot Emojis:
    function resolveCustomEmojiUrl(id: string) {
        const fallback = '/discord-grey.png'
        const c = dashboard.guildData.emojis.state?.find(e => e.value == id)?.url
        return c || fallback
    }

</script>


<template>
    <Dialog :visible class="border-2! border-ring-soft! m-7! w-[90%]! max-w-155!" modal block-scroll>
        <template #container>
            <!-- Header -->
            <div class="w-full flex items-center justify-between flex-row p-2 border-b-2 border-ring-soft">
                <span class="flex item-center gap-1">
                    <Iconify icon="tabler:eye-share" />
                    <p class="font-bold text-lg">
                        Session Panel Preview
                    </p>
                </span>
                <Button @click="visible = false" unstyled title="Close Preview"
                    class="border button-base border-ring-soft p-1 rounded-md aspect-square group">
                    <XIcon :size="18" class="opacity-50 group-hover:opacity-95 transition-all" />
                </Button>
            </div>

            <!-- Main Content -->
            <div class="w-full flex items-start flex-row gap-2.5 p-3.5 overflow-auto!">
                <!-- Bot Icon -->
                <img :src="'/logo.png'" class="size-10.5 flex rounded-full" />

                <!-- Bot Message -->
                <span class="flex flex-col gap-1 grow">
                    <!-- Bot Message Title -->
                    <p class="font-bold">
                        Sessions
                    </p>

                    <!-- Message/Component(s) Container -->
                    <span class="panel-container">
                        <!-- Accent Bar -->
                        <div class="h-full w-1.25 left-0 top-0 absolute" :style="{ background: guildAccentColor }" />

                        <!-- Title-->
                        <p class="font-bold w-full text-xl">
                            {{ s?.title }}
                        </p>

                        <!-- Description -->
                        <div v-if="descriptionHtml" v-html="descriptionHtml" class="w-full discord-preview" />

                        <div class="w-[98%] h-0.25 my-2 bg-bg-3" />

                        <!-- Start/End Dates -->
                        <div class="flex flex-row items-start gap-2.25 justify-between w-full px-1">
                            <!-- Section Content -->
                            <div class="flex flex-col gap-px flex-wrap grow">
                                <!-- Start Date -->
                                <span class="flex items-center gap-1 w-full">
                                    <img src="@/assets/botEmojis/clock.png" class="size-4.75" />
                                    <p class="font-bold"> Starts at: </p>
                                </span>
                                <span
                                    v-html="getDiscordHtml(`> <t:${startInZone?.toUnixInteger() ?? 0}:d> | <t:${startInZone?.toUnixInteger() ?? 0}:t> `)"
                                    class="discord-preview *:mt-1.5! *:pt-0!" />
                                <!-- End Date -->
                                <span v-if="endInZone" class="flex items-center gap-1 w-full">
                                    <img src="@/assets/botEmojis/clock.png" class="size-4.75" />
                                    <p class="font-bold"> Ends at: </p>
                                </span>
                                <span v-if="endInZone"
                                    v-html="getDiscordHtml(`> <t:${endInZone?.toUnixInteger() ?? 0}:d> | <t:${endInZone?.toUnixInteger() ?? 0}:t> `)"
                                    class="discord-preview *:mt-1.5! *:pt-0!" />
                            </div>
                            <!-- Section Button -->
                            <div class="flex w-fit h-full">
                                <Button v-if="guildCalendarButton" unstyled title="Add to Calendar"
                                    class="button-base px-3.25 py-1.25 rounded-lf border bg-text-1/5 border-ring-soft/30">
                                    <img src="@/assets/botEmojis/calendar.png"
                                        class="size-4.75 inline opacity-80 aspect-square" />
                                </Button>
                            </div>
                        </div>

                        <div class="w-[98%] h-0.25 my-2 bg-bg-3" />

                        <!-- RSVP Section(s) w/ Divider -->
                        <span v-if="s.rsvps?.length" v-for="r in s.rsvps" class="flex w-full flex-col gap-1">
                            <div class="flex flex-row items-start gap-2.25 justify-between w-full px-1">
                                <!-- RSVP Slot Data -->
                                <div class="flex flex-col gap-0 flex-wrap grow">
                                    <span class="flex items-center gap-1 w-full">
                                        <!-- Slot Emoji -->
                                        <img v-if="r?.emoji && RegExp_DiscordEmojiId.test(r?.emoji)"
                                            title="Custom Emoji" :src="resolveCustomEmojiUrl(r?.emoji)"
                                            class="size-4.5 rounded" />
                                        <p v-else-if="r?.emoji"> {{ r?.emoji }} </p>
                                        <!-- Slot Name -->
                                        <p class="font-bold"> {{ r?.name }} </p>
                                    </span>
                                    <span v-html="getDiscordHtml(`> No RSVPs `)"
                                        class="discord-preview *:mt-0! *:pt-0! mt-1" />
                                </div>
                                <!-- RSVP Button -->
                                <div class="flex w-fit h-full">
                                    <Button unstyled title="RSVP"
                                        class="button-base px-3.25 py-1.25 rounded-lf border bg-text-1/5 border-ring-soft/30">
                                        <img src="@/assets/botEmojis/user-success.png"
                                            class="size-4.75 inline opacity-80 aspect-square" />
                                    </Button>
                                </div>
                            </div>

                            <div class="w-[98%] h-0.25 my-2 bg-bg-3" />
                        </span>

                        <!-- Action Row -->
                        <div class="flex w-full items-center gap-3 px-1 flex-row">
                            <!-- Location -->
                            <Button v-if="s?.url" unstyled title="Location"
                                class="button-base gap-1 px-2.5 py-1 rounded-lf border bg-text-1/5 border-ring-soft/30">
                                <img src="@/assets/botEmojis/link.png"
                                    class="size-4.75 inline opacity-80 aspect-square" />
                                <p class="font-semibold">
                                    Location
                                </p>
                            </Button>
                            <!-- View Online -->
                            <Button v-if="guildPublicSessions" unstyled title="View Online"
                                class="button-base gap-1 px-2.5 py-1 rounded-lf border bg-text-1/5 border-ring-soft/30">
                                <img src="@/assets/botEmojis/eye.png"
                                    class="size-4.75 inline opacity-80 aspect-square" />
                                <p class="font-semibold">
                                    View Online
                                </p>
                            </Button>
                        </div>

                        <!-- Watermark -->
                        <div v-if="guildShowWatermark" class="w-full text-[13px] flex gap-0 flex-col text-xs/tight">

                            <div class="w-[98%] h-0.25 my-2 bg-bg-3" />

                            <span class="flex w-full flex-row items-center gap-1 mt-1 relative bottom-1">
                                <img src="/logo.png" class="rounded size-4" />
                                <span class="opacity-85"> Powered by <span class="text-link hover:underline">Sessions
                                        Bot</span></span>

                            </span>
                            <a :href="externalUrls.discordStore" target="_blank"
                                class="opacity-70 text-[11px] hover:underline">
                                <Iconify icon="system-uicons:arrow-up" class="inline size-3 stroke-[2.5]" />Want to
                                remove this? — Upgrade Subscription
                            </a>
                        </div>


                    </span>

                </span>

            </div>

            <!-- Footer -->
            <div class="w-full flex-center p-2 border-t-2 border-ring-soft">
                <p class="opacity-50 text-xs">
                    The actual message sent may differ slightly!
                </p>
            </div>

        </template>
    </Dialog>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .panel-container {
        @apply p-3 pl-4 gap-1 text-sm bg-bg-2 border border-ring-soft/40 rounded-md relative w-fit flex items-center flex-col overflow-clip;
    }


</style>