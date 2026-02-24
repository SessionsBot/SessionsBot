<script lang="ts" setup>
    import type { Database } from '@sessionsbot/shared';
    import { DateTime } from 'luxon';
    import { getTimeZones } from '@vvo/tzdb'
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { PencilIcon } from 'lucide-vue-next';

    // Incoming Props:
    type IncomingProps = | {
        kind: 'template'
        template?: Database['public']['Tables']['session_templates']['Row']
    } | {
        kind: 'session',
        session?: Database['public']['Tables']['sessions']['Row']
    }
    const props = defineProps<IncomingProps>()

    // Services:
    const dashboard = useDashboardStore();


    // Session Template Data:
    const templateData = computed(() => {
        if (props.kind == 'template') return props.template;
        else return dashboard.guildData.sessionTemplates.state?.find(t => (t.id == props.session?.template_id))
    })

    // Session/Template Next or Last Post Date:
    const postDate = computed(() => {
        if (props.kind == 'session') {
            // Session - Last Post Date
            return DateTime.fromISO(String(props.session?.starts_at_utc))
                .setZone(props.session?.time_zone)
                .minus({ milliseconds: templateData.value?.post_before_ms ?? 0 })
        } else {
            // Template - Next Post Date
            return DateTime.fromISO(String(templateData.value?.next_post_utc))
                .setZone(templateData.value?.time_zone)
        }
    })

    // Session/Template Next or Last Start Date:
    const startDate = computed(() => {
        if (props.kind == 'session') {
            // Session - Last Start Date
            return DateTime.fromISO(String(props.session?.starts_at_utc))
                .setZone(props.session?.time_zone)
        } else {
            // Template - Next Start Date
            return postDate.value?.plus({ milliseconds: templateData.value?.post_before_ms })
        }
    })


    // Session Time Zone Data:
    const sessionZone = computed(() => {
        const zoneName = templateData.value?.time_zone
        if (!zoneName) return null
        else return getTimeZones().find(tz => tz.name == zoneName)
    })

    // Session Signup URL:
    const signupMsgUrl = computed(() => {
        if (props.kind == 'session') {
            return `https://discord.com/channels/${props.session?.guild_id}/${props.session?.thread_id ? props.session?.thread_id : props.session?.channel_id}/${props.session?.panel_id}`
        } else return ''
    })

    // Edit Schedule Fn: 
    function editSchedule() {
        dashboard.sessionForm.startEdit(templateData.value as any)
    }

</script>


<template>
    <div class="session-card" :class="{
        'border-dotted! border-3! rounded-lg!': props.kind == 'template'
    }">

        <!-- Name / Start Time / Zone -->
        <div class="name-and-time">
            <p class="session-title">
                {{ templateData?.title }}
            </p>
            <div class="time-and-zone">
                <p class="session-date">
                    {{ startDate?.toFormat('M/d/yy h:mm a') || '?/?/? ?:??' }}
                </p>
                <p class="session-zone" :title="sessionZone?.name">
                    {{ sessionZone?.abbreviation }}
                </p>
            </div>
        </div>

        <!-- Option Flag/Badge(s) -->
        <div class="option-flags">
            <p class="option-flag" :class="{
                'enabled': templateData?.rrule,
                'disabled': !templateData?.rrule
            }">
                Repeats
            </p>
            <p class="option-flag" :class="{
                'enabled': templateData?.rsvps,
                'disabled': !templateData?.rsvps
            }">
                RSVPS
            </p>
            <p class="option-flag" :class="{
                'enabled': templateData?.native_events,
                'disabled': !templateData?.native_events
            }">
                Events
            </p>
        </div>


        <!-- Posts/ed at / Action Buttons -->
        <div class="action-area">
            <span class="post-time" :title="postDate?.toFormat(`f '- ${sessionZone?.abbreviation}'`)">
                <span v-if="props.kind == 'session'">Posted:</span>
                <span v-else>Posts:</span> {{ postDate?.toFormat('t') }}
                <span class="session-zone text-[10px]!" :title="sessionZone?.name">
                    {{ sessionZone?.abbreviation }}
                </span>
                <span class="w-full flex items-center justify-center">
                    <!-- Posts Soon - Badge -->
                    <div v-if="props.kind == 'template' && DateTime.fromISO(String(props.template?.next_post_utc), { zone: 'utc' }).diffNow('hours').hours < 1"
                        class="px-1.25 py-0.5 border-2 bg-text-1/10 border-ring-soft rounded-full flex w-fit items-center justify-center">
                        <p class="text-amber-400 text-[10px] relative italic font-black">
                            Soon
                        </p>
                    </div>
                </span>
            </span>
            <!-- Edit Button -->
            <Button @click="editSchedule" unstyled class="action-button">
                <PencilIcon hidden :size="22" class="p-0.5! mr-0.5! icon text-amber-400/50!" />
                <div class="icon mr-0.5">
                    <Iconify icon="mdi:pencil" class="text-text-3" />
                </div>
                <p class="inline-flex gap-1 h-full items-center pt-0.5">
                    Edit <span hidden class="hidden sm:inline"> Schedule</span>
                </p>
            </Button>

            <a v-if="props.kind == 'session'" :href="signupMsgUrl" target="_blank">
                <Button unstyled class="action-button flex-row!">
                    <div class="icon mr-0.5">
                        <Iconify icon="mdi:eye" class="text-text-3" />
                    </div>

                    <p class="inline-flex gap-1 h-full items-center pt-0.5">
                        View <span hidden class="hidden sm:inline"> on Discord</span>
                    </p>
                </Button>
            </a>
        </div>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .session-card {
        @apply p-2 sm:grid sm:grid-rows-none sm:grid-cols-[1fr_0.5fr_1fr] bg-bg-3 w-full !h-fit text-center transition-all border-2 border-ring-soft rounded-md;

        &:hover {
            border-color: var(--c-ring-3) !important;
        }

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
                @apply text-text-4/80
            }
        }


        .option-flags {
            @apply flex gap-1 items-center justify-center flex-row sm:flex-col py-2 sm:py-0 flex-wrap;

            .option-flag {
                @apply bg-black/15 border-2 border-ring-soft p-1 py-0.75 rounded-lg font-extrabold text-sm;

                &.disabled {
                    @apply text-text-1/15 border-ring-soft/70 line-through;
                }

                &.enabled {
                    @apply text-text-1/65;
                }
            }

        }


        .action-area {
            @apply flex gap-2.5 sm:gap-2 pb-2 items-center justify-center flex-wrap h-full;

            .post-time {
                @apply text-text-1/75 font-extrabold opacity-70 text-sm p-0.5 pb-2 sm:pb-0 text-center w-full inline-flex truncate items-center justify-center gap-1 flex-wrap;
            }

            .action-button {
                @apply px-2 pr-2.75 py-0.75 rounded-lg active:scale-95 font-bold bg-zinc-500/60 hover:bg-zinc-500/45 cursor-pointer transition-all flex flex-row items-center justify-center border border-text-soft/40 dark:border-none;

                .icon {
                    @apply inline aspect-square min-w-fit !p-0 h-full flex items-center;
                }
            }
        }

    }

</style>