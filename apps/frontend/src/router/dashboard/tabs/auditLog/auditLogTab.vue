<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { AuditEvent, type Database } from '@sessionsbot/shared';
    import { DateTime } from 'luxon';
    import EventLabel from './EventLabel.vue';
    import EventDetailsDialog from './EventDetailsDialog.vue';


    // Services:
    const dashboard = useDashboardStore();

    // Dashboard Data
    const auditEvents = computed(() => dashboard.guildData.auditLog.state?.sort((a, b) => DateTime.fromISO(b.created_at).toSeconds() - DateTime.fromISO(a.created_at).toSeconds()))

    // Event Details Modal:
    const useEventDetailsModal = () => {
        const isVisible = ref<boolean>(false)
        const selectedEvent = ref<Database['public']['Tables']['audit_logs']['Row'] | null>()

        function openDetails(e: Database['public']['Tables']['audit_logs']['Row']) {
            selectedEvent.value = e,
                isVisible.value = true
        }

        function closeDetails() {
            selectedEvent.value = null;
            isVisible.value = false
        }

        return {
            isVisible,
            selectedEvent,
            openDetails,
            closeDetails
        }
    }
    const eventDetailsModal = useEventDetailsModal();

</script>


<template>
    <div class="dashboard-tab-view">

        <!-- Title -->
        <div class="w-full flex items-center justify-start flex-row gap-0">
            <div class="w-fit h-fit flex aspect-square">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48">
                    <g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4">
                        <path d="M13 10h28v34H13z" />
                        <path stroke-linecap="round" d="M35 10V4H8a1 1 0 0 0-1 1v33h6m8-16h12m-12 8h12" />
                    </g>
                </svg>

            </div>
            <p class="text-xl px-1.5 uppercase font-black">
                Audit Log
            </p>
        </div>

        <!-- Desc -->
        <p class="mx-4 pt-1 text-sm text-start w-full text-white/70">
            Take a look below at any of the recent actions Sessions Bot or server members have made in relation to
            sessions, RSVPs, etc.
        </p>



        <!-- Audit Log - Table -->
        <div class="auditLogTable">

            <!-- Header Row -->
            <div class="font-bold uppercase grid grid-cols-3 w-full!">
                <p class="heading-cell rounded-tl-md">
                    Date
                </p>

                <p class="heading-cell rounded-tr-md">
                    Action
                </p>

                <p class="heading-cell">
                    User
                </p>

            </div>

            <!-- Content Row(s) -->
            <div title="View Details" v-for="e of auditEvents" class="content-row group"
                @click="eventDetailsModal.openDetails(e)">
                <!-- Date -->
                <p class="content-cell ">
                    {{ DateTime.fromISO(e.created_at).toFormat('M/d/yy - h:mm a') }}
                </p>

                <!-- Event -->
                <div class="content-cell">
                    <!-- @vue-expect-error -->
                    <EventLabel :event="e.event_type" />
                </div>

                <!-- User -->
                <div class="content-cell">
                    <div v-if="e.user_id === 'BOT'" class="flex flex-row items-center justify-start gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="relative bottom-px" width="24" height="24"
                            viewBox="0 0 24 24">
                            <path fill="currentColor"
                                d="M21.928 11.607c-.202-.488-.635-.605-.928-.633V8c0-1.103-.897-2-2-2h-6V4.61c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5c-1.103 0-2 .897-2 2v2.997l-.082.006A1 1 0 0 0 1.99 12v2a1 1 0 0 0 1 1H3v5c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2v-5a1 1 0 0 0 1-1v-1.938a1 1 0 0 0-.072-.455M5 20V8h14l.001 3.996L19 12v2l.001.005l.001 5.995z" />
                            <ellipse cx="8.5" cy="12" fill="currentColor" rx="1.5" ry="2" />
                            <ellipse cx="15.5" cy="12" fill="currentColor" rx="1.5" ry="2" />
                            <path fill="currentColor" d="M8 16h8v2H8z" />
                        </svg>
                        <p> BOT </p>
                    </div>
                    <p v-else>
                        {{ JSON.parse(String(e?.event_meta))?.username || e.user_id }}
                    </p>
                </div>

            </div>

            <!-- Footer / No Events -->
            <p v-if="!auditEvents?.length"
                class="italic font-black ring-ring ring w-full py-2 text-center uppercase text-xs text-white/40">
                No Events Found!
            </p>
            <p v-else class="italic font-black ring-ring ring w-full py-2 text-center uppercase text-xs text-white/40">
                END OF EVENTS
            </p>

        </div>


        <!-- View Details - Audit Event Entry -->
        <EventDetailsDialog v-model:isVisible="eventDetailsModal.isVisible.value"
            v-model:selectedEvent="eventDetailsModal.selectedEvent.value" @close="eventDetailsModal.closeDetails()" />


    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .auditLogTable {
        @apply mt-5 mx-3 !max-h-fit block bg-surface ring-ring ring-2 rounded-md overflow-clip;

        *.heading-cell {
            @apply w-full text-center font-extrabold p-2 bg-black/30 ring-1 ring-ring;
        }

        *.content-row {
            @apply grid transition-all grid-cols-3 grid-flow-row-dense
        }

        *.content-cell {
            @apply min-w-0 p-2 px-2.5 break-inside-auto wrap-anywhere whitespace-pre-line group-hover:bg-ring/40 group-hover:cursor-pointer group-active:bg-ring/25 flex items-center justify-start flex-wrap text-wrap !min-h-fit h-full w-full ring-1 ring-ring font-medium text-white/65;
        }

    }


</style>