<script lang="ts" setup>
    import type { AuditEvent, Database } from '@sessionsbot/shared';
    import { ExternalLink, XIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import EventLabel from './EventLabel.vue';
    import UserLabel from './UserLabel.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import useNotifier from '@/stores/notifier';

    // Incoming Modals:
    const isVisible = defineModel<boolean>('isVisible');
    const selectedEvent = defineModel<Database['public']['Tables']['audit_logs']['Row'] | null>('selectedEvent')
    const eventType = computed(() => selectedEvent.value?.event_type as AuditEvent)
    const timestamp = computed(() => DateTime.fromISO(String(selectedEvent.value?.created_at), { zone: 'local' }))
    const eventMeta = computed(() => selectedEvent.value?.event_meta as Record<string, any> | null)

    // Services:
    const dashboard = useDashboardStore()
    const notifier = useNotifier()

    // Util Fn - View Template by Id:
    function viewTemplateById(id: string) {
        if (!id) return
        // Ensure this sch will be visible on sessions tab:
        const sch = dashboard.guildData.sessionTemplates.state?.filter(t => !(t.next_post_utc == null || t.enabled == false)).find(t => t?.id == id)
        if (!sch) {
            return notifier.send({
                level: 'warn',
                header: 'Cannot Find',
                content: `This schedule may have been deleted or outdated! <br><span class="text-xs opacity-50"> Id: ${id} </span>`
            })
        }

        isVisible.value = false;
        dashboard.nav.highlightedTemplateId = id
        dashboard.nav.currentTab = 'Sessions'
    }

    // Emit - Close:
    const emits = defineEmits<{
        close: []
    }>()

</script>


<template>
    <Dialog modal block-scroll :draggable="false" v-model:visible="isVisible" :pt="{ root: '' }"
        class="!bg-bg-2 !border-2 text-text-1/80! !border-ring-soft !w-[85%] !max-w-120 !overflow-clip">
        <template #container class="flex items-center justify-center">

            <!-- Header -->
            <section
                class="flex bg-black/20 relative flex-row justify-center items-center p-2 gap-0.75 border-b-2 border-ring-soft">
                <Iconify icon="clarity:details-solid" />
                <p class="font-extrabold p-0.75 text-xl opacity-90 uppercase text-text-1!">
                    Event Details
                </p>

            </section>

            <!-- Content -->
            <div class="flex flex-center self-center flex-col gap-1.25 p-4 overflow-auto w-fit">

                <!-- Event Type -->
                <div class="field-wrap">

                    <p class="field-heading">
                        Event Type:
                    </p>
                    <span class="field-value">
                        <EventLabel :event="eventType" class="font-semibold" />
                    </span>


                </div>

                <!-- Timestamp -->
                <div class="field-wrap">

                    <p class="field-heading">
                        Timestamp:
                    </p>
                    <span class="field-value">
                        <p class="font-semibold">
                            {{ timestamp.toFormat('f') ?? 'Unknown?' }}
                        </p>
                        <p class="text-xs opacity-60 italic">
                            ({{ timestamp.toRelative() ?? '' }})
                        </p>
                    </span>
                </div>

                <!-- Acting User -->
                <div class="field-wrap">

                    <p class="field-heading">
                        Acting User:
                    </p>
                    <span class="field-value">
                        <a :href="`https://discord.com/users/${selectedEvent?.user_id}`" target="_blank"
                            class="flex flex-row gap-1 items-center">
                            <UserLabel :user-id="String(selectedEvent?.user_id)" class="text-lg font-semibold" />
                            <ExternalLink :size="12" class="opacity-50" />
                        </a>
                    </span>
                </div>


                <!-- META FIELDS -->

                <!-- Meta - Reason -->
                <div v-if="eventMeta?.reason" class="field-wrap">

                    <p class="field-heading">
                        Reason:
                    </p>
                    <span class="field-value">
                        <p class="font-semibold">
                            {{ eventMeta?.reason }}
                        </p>
                    </span>
                </div>

                <!-- Meta - Session Id -->
                <div v-if="eventMeta?.session_id" class="field-wrap">

                    <p class="field-heading">
                        Session:
                    </p>
                    <span class="field-value">
                        <RouterLink :to="`/s/${eventMeta.session_id}`" class="flex flex-row gap-1 items-center">
                            <p class="font-semibold">
                                {{dashboard.guildData.sessions.state?.find(s => s?.id == eventMeta?.session_id)?.title
                                    ?? eventMeta?.session_id}}
                            </p>

                            <ExternalLink :size="12" class="opacity-50" />
                        </RouterLink>
                    </span>
                </div>

                <!-- Meta - Template Id -->
                <div v-if="eventMeta?.template_id" class="field-wrap">

                    <p class="field-heading">
                        Schedule:
                    </p>
                    <span @click="viewTemplateById(eventMeta?.template_id)"
                        class="field-value cursor-pointer flex flex-row gap-1 items-center">

                        <p class="font-semibold">
                            {{dashboard.guildData.sessionTemplates.state?.find(s => s?.id ==
                                eventMeta?.template_id)?.title
                                ?? eventMeta?.template_id}}
                        </p>
                        <ExternalLink :size="12" class="opacity-50" />


                    </span>
                </div>

            </div>

            <!-- Footer -->
            <section
                class="w-full bg-black/20 border-t-2 border-ring-soft flex gap-2 items-center justify-center content-center flex-wrap">
                <Button unstyled @click="emits('close')"
                    class="gap-0 px-2 py-0.75 button-secondary font-bold m-2 self-center flex items-center justify-center w-fit cursor-pointer active:scale-95 transition-all rounded-md">
                    <XIcon class="p-px" />
                    <p> Close </p>
                </Button>
            </section>


        </template>
    </Dialog>
</template>


<style scoped>

    @reference '@/styles/main.css';

    .field-wrap {
        @apply flex flex-col gap-1 flex-wrap w-full;

        .field-heading {
            @apply text-xs opacity-60 font-semibold w-full;
        }

        .field-value {
            @apply w-fit ml-4 self-start p-1 px-1.5 rounded-md bg-bg-3/80;
        }
    }

    .copy-success {
        background: color-mix(in oklab, var(--color-emerald-500), var(--c-bg-1) 20%);
        border-radius: 4px;
    }

    .copy-fail {
        background: color-mix(in oklab, var(--color-invalid-1), var(--c-bg-1) 20%);
    }


</style>