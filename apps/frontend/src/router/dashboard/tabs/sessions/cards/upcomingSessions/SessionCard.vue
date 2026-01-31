<script lang="ts" setup>
    import type { Database } from '@sessionsbot/shared';
    import { DateTime } from 'luxon';
    import { getTimeZones } from '@vvo/tzdb'
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { PencilIcon, Trash2Icon } from 'lucide-vue-next';


    // Incoming Props:
    const props = defineProps<{
        session: Database['public']['Tables']['sessions']['Row']
    }>()
    const { session } = props;

    // Services:
    const dashboard = useDashboardStore();

    // Session Template Data

    const sessionTemplateData = computed(() => dashboard.guildData.sessionTemplates.state?.find((t) => t.id === session.template_id))
    // Session Date - IN SESSION ZONE:
    const sessionStart = computed(() => DateTime.fromISO(session.starts_at_utc, { zone: session.time_zone }))
    const sessionPost = computed(() => {
        return sessionStart.value.minus({ milliseconds: sessionTemplateData.value?.post_before_ms })
    })
    // Session Time Zone Data:
    const sessionZone = computed(() => {
        const zoneName = session.time_zone
        if (!zoneName) return null
        else return getTimeZones().find(tz => tz.name == zoneName)
    })

    // Session Signup URL:
    const signupMsgUrl = computed(() => `https://discord.com/channels/${session.guild_id}/${session?.thread_id ? session?.thread_id : session?.channel_id}/${session.signup_id}`)

    // Edit Schedule Fn:
    function editSchedule() {
        if (sessionTemplateData.value) {
            dashboard.sessionForm.startEdit(sessionTemplateData.value as any)
        } else console.warn('[!] - No session template data found for edit!')
    }

</script>


<template>
    <div class="session-card">

        <!-- Name / Start Time / Zone -->
        <div class="name-and-time">
            <p class="session-title">
                {{ session.title }}
            </p>
            <div class="time-and-zone">
                <p class="session-date">
                    {{ sessionStart?.toFormat('M/d/yy h:mm a') || '?/?/? ?:??' }}
                </p>
                <p class="session-zone" :title="sessionZone?.name">
                    {{ sessionZone?.abbreviation }}
                </p>
            </div>
        </div>

        <!-- Option Flag/Badge(s) -->
        <div class="option-flags">
            <p class="option-flag" :class="{
                'enabled': sessionTemplateData?.rrule,
                'disabled': !sessionTemplateData?.rrule
            }">
                Repeats
            </p>
            <p class="option-flag" :class="{
                'enabled': sessionTemplateData?.rsvps,
                'disabled': !sessionTemplateData?.rsvps
            }">
                RSVPS
            </p>
            <p class="option-flag" :class="{
                'enabled': sessionTemplateData?.native_events,
                'disabled': !sessionTemplateData?.native_events
            }">
                Events
            </p>
        </div>


        <!-- Posts/ed at / Action Buttons -->
        <div class="action-area">
            <p class="post-time" :title="sessionPost.toFormat(`f '- ${sessionZone?.abbreviation}'`)">
                Post <i class="pi pi-clock relative top-0.5 mr-0.5" />: {{ sessionPost.toFormat('t') }}
            </p>
            <!-- Edit Button -->
            <Button @click="editSchedule" unstyled class="action-button bg-amber-500/50! hover:bg-amber-500/40!">
                <PencilIcon :size="22" class="p-0.5! mr-0.5! icon" />
                <p class="inline-flex h-full items-center pt-0.5">
                    Edit Schedule
                </p>
            </Button>
            <a v-if="signupMsgUrl" :href="signupMsgUrl" target="_blank">
                <Button unstyled class="action-button">
                    <DiscordIcon class="size-5 mr-0.5! relative bottom-px icon" />
                    <p class="inline-flex h-full items-center pt-0.5">
                        View on Discord
                    </p>
                </Button>
            </a>
        </div>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .session-card {
        @apply p-2 grid grid-rows-[1fr_0.5fr_1fr] sm:grid-rows-none sm:grid-cols-[1fr_0.5fr_1fr] bg-black/20 border-ring w-full !h-fit text-center transition-all border-2 hover:border-white/40 rounded;

        .name-and-time {
            @apply flex grow-2 gap-2 p-1 items-center justify-center text-center flex-col flex-wrap;

            .session-title {
                @apply font-black uppercase text-2xl sm:text-xl
            }

            .time-and-zone {
                @apply flex gap-0.75 items-center justify-center flex-row flex-wrap;
            }

            .session-date,
            .session-zone {
                @apply text-sm font-extrabold uppercase opacity-70
            }

            .session-zone {
                @apply text-zinc-400
            }
        }


        .option-flags {
            @apply flex gap-1 items-center justify-center flex-row sm:flex-col py-2 sm:py-0 flex-wrap;

            .option-flag {
                @apply bg-black/15 border-2 border-ring/50 p-1 py-0.75 rounded-lg font-extrabold text-sm;

                &.disabled {
                    @apply text-white/15 border-ring/30 line-through;
                }

                &.enabled {
                    @apply text-white/65;
                }
            }

        }


        .action-area {
            @apply flex gap-2.5 items-center justify-center flex-wrap w-full pb-2 sm:pb-1;

            .post-time {
                @apply text-white/75 font-extrabold opacity-70 text-sm p-0.5 text-center w-full;
            }

            .action-button {
                @apply px-1 pr-1.5 py-0.75 active:scale-95 font-bold bg-zinc-500 hover:bg-zinc-600 cursor-pointer transition-all rounded-md block;

                .icon {
                    @apply inline aspect-square min-w-fit !p-0 h-full flex items-center;
                }
            }
        }

    }

</style>