<script lang="ts" setup>
    import type { APIResponseValue, Database } from '@sessionsbot/shared';
    import { DateTime } from 'luxon';
    import { getTimeZones } from '@vvo/tzdb'
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { PencilIcon, Trash2Icon } from 'lucide-vue-next';
    import { useConfirm } from 'primevue';
    import type { MultiButtonAction } from '@/components/MultiButton.vue';
    import useNotifier from '@/stores/notifier';
    import { API } from '@/utils/api';
    import { useAuthStore } from '@/stores/auth';
    import { externalUrls } from '@/stores/nav';

    // Incoming Props:
    const props = defineProps<{
        template?: Database['public']['Tables']['session_templates']['Row']
    }>()
    const t = computed(() => props.template)

    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore();
    const notifier = useNotifier();
    const confirm = useConfirm();


    // Session/Template Next or Last Post Date:
    const postDate = computed(() => DateTime.fromISO(String(props.template?.next_post_utc))
        .setZone(props?.template?.time_zone)
    )

    // Template - Next Start Date
    const startDate = computed(() => postDate.value?.plus({ milliseconds: props.template?.post_before_ms ?? 0 }))


    // Session Time Zone Data:
    const sessionZone = computed(() => {
        const zoneName = props.template?.time_zone
        if (!zoneName) return null
        else return getTimeZones().find(tz => tz.name == zoneName)
    })


    // Computed - Last Session Occurrence Id:
    const lastSessionOccurrence = computed(() => dashboard.guildData.sessions.state
        ?.sort((a, b) => DateTime.fromISO(b?.starts_at_utc, { zone: 'utc' }).toUnixInteger() - DateTime.fromISO(a?.starts_at_utc, { zone: 'utc' }).toUnixInteger())
        ?.find(s => s.template_id == props.template?.id)
    )

    // Split Button - Edit - Extra Actions:
    const buttonExtraActions: MultiButtonAction[] = [
        {
            label: 'View Last Occurrence',
            icon: 'mdi:history',
            disabled: !!lastSessionOccurrence.value,
            fn: async () => {
                // Get last known session from template:
                if (lastSessionOccurrence.value)
                    dashboard.nav.highlightedSessionId = lastSessionOccurrence.value?.id
            },
        },
        {
            label: 'Duplicate',
            icon: 'mdi:layers',
            fn: async () => {
                // Attempt a new "edit"
                const allowed = dashboard.sessionForm.createNew({ check_only: true })
                if (allowed) {
                    dashboard.sessionForm.startEdit(t.value as any)
                    await nextTick()
                    // Set as "new" action mode:
                    dashboard.sessionForm.actionMode = 'new'
                }
            },
        },
        {
            label: 'Delete',
            icon: 'mdi:trash',
            classes: { root: 'text-invalid-1' },
            fn: () => {
                const r = confirm.require({
                    header: 'Are you sure?',
                    message: `
                        <p>
                            You're about to <strong>permanently delete</strong> this <b>schedule</b>
                            & any previous session(s) that stems from it.
                        </p><br>
                        <p class="w-full text-center font-bold underline text-invalid-1">
                            This cannot be undone!
                        </p>
                    `,
                    icon: 'lucide:trash-2',
                    accept: async () => {
                        const { data: { error, success }, status } = await API.delete<APIResponseValue>(`/guilds/${dashboard.guildId}/sessions/templates/${t?.value?.id}`, {
                            headers: { Authorization: `Bearer ${auth.session?.access_token}` }
                        })
                        if (!success || error || status >= 300) {
                            console.error('Failed to Delete Session:', status, error)
                            // Send Errored Alert:
                            notifier.send({
                                header: ' Failed!',
                                content: `We couldn't delete that session.. if this issue persists please <b class="extrabold">get in contact with Bot Support!</b>`,
                                level: 'error',
                                actions: [
                                    {
                                        button: {
                                            title: 'Chat with Support',
                                            icon: 'basil:chat-solid',
                                            href: "+" + externalUrls.discordServer.supportInvite
                                        },
                                        onClick(e, ctx) { return },
                                    }
                                ]
                            })
                        } else {
                            // Refresh Templates:
                            dashboard.guildData.sessionTemplates?.execute()
                            // Send Success Alert:
                            notifier.send({
                                header: 'Schedule Deleted',
                                content: null,
                                icon: 'iconamoon:trash-duotone',
                                classes: { header: 'self-center text-[15px]' }
                            })
                        }

                    }
                })
            },
        }
    ]


</script>


<template>
    <div class="session-card border-dotted! border-3! rounded-lg!">

        <!-- Name / Start Time / Zone -->
        <div class="name-and-time">
            <p class="session-title">
                {{ t?.title }}
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
                'enabled': t?.rrule,
                'disabled': !t?.rrule
            }">
                Repeats
            </p>
            <p class="option-flag" :class="{
                'enabled': t?.rsvps,
                'disabled': !t?.rsvps
            }">
                RSVPS
            </p>
            <p class="option-flag" :class="{
                'enabled': t?.native_events,
                'disabled': !t?.native_events
            }">
                Events
            </p>
        </div>


        <!-- Posts/ed at / Action Buttons -->
        <div class="action-area">
            <span class="post-time" :title="postDate?.toFormat(`f '- ${sessionZone?.abbreviation}'`)">
                <span>Posts:</span> {{ postDate?.toFormat('t') }}
                <span class="session-zone text-[10px]!" :title="sessionZone?.name">
                    {{ sessionZone?.abbreviation }}
                </span>
                <span class="w-fit flex items-center justify-center">
                    <!-- Posts Soon - Badge -->
                    <div v-if="DateTime.fromISO(String(props.template?.next_post_utc), { zone: 'utc' }).diffNow('hours').hours < 1"
                        class="px-1 py-px border-2 bg-text-1/10 border-ring-soft rounded flex w-fit items-center justify-center">
                        <p class="text-amber-800 dark:text-amber-500 text-[10px] relative italic font-black">
                            Soon
                        </p>
                    </div>
                </span>
            </span>
            <!-- Edit Button -->
            <div class="w-full flex flex-center">
                <MultiButton :main-action="{
                    label: 'Edit',
                    icon: 'mdi:pencil',
                    fn() {
                        dashboard.sessionForm.startEdit(t as any)
                    },
                    classes: {
                        root: 'button-primary! rounded-r-none!',
                        dropdown: 'button-primary! rounded-l-none!'
                    }
                }" :actions="buttonExtraActions.map(a => {
                    if (a?.label == 'View Last Occurrence') {
                        if (t?.last_post_utc) a.disabled = false
                        else a.disabled = true
                    }
                    return a;
                })" />
            </div>



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