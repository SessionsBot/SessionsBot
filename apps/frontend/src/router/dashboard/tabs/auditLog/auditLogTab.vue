<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { type Database } from '@sessionsbot/shared';
    import { DateTime } from 'luxon';
    import EventLabel from './EventLabel.vue';
    import EventDetailsDialog from './EventDetailsDialog.vue';
    import UserLabel from './UserLabel.vue';


    // Services:
    const dashboard = useDashboardStore();

    type AuditEventData = Database['public']['Tables']['audit_logs']['Row']

    const batchSize = 15
    const shownCount = ref(batchSize)

    const auditEvents = computed<AuditEventData[]>(() => {
        return [...(dashboard.guildData.auditLog.state ?? [])]
            .sort((a, b) =>
                DateTime.fromISO(b.created_at).toSeconds() -
                DateTime.fromISO(a.created_at).toSeconds()
            )
    })

    const shownEvents = computed(() => {
        return auditEvents.value.slice(0, shownCount.value)
    })

    function showMore() {
        shownCount.value += batchSize
    }



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
    <div class="dashboard-tab-view pr-0!">

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
        <p class="mx-4 pt-1 text-sm text-start w-full text-text-1/70">
            Take a look below at any of the recent actions Sessions Bot or server members have made in relation to
            sessions, RSVPs, etc.
        </p>


        <div class="flex w-full overflow-x-auto pb-2 pr-4 self-center">
            <!-- Audit Log - Table -->
            <div class="auditLogTable">

                <!-- Header Row -->
                <div class="font-bold uppercase grid grid-cols-3 w-full!">
                    <p class="heading-cell rounded-tl-md">
                        Date
                    </p>

                    <p class="heading-cell ">
                        Action
                    </p>

                    <p class="heading-cell rounded-tr-md">
                        User
                    </p>

                </div>

                <!-- Content Row(s) -->
                <div title="View Details" v-for="e of shownEvents"
                    class="content-row group odd:bg-text-1/5 even:bg-text-1/10"
                    @click="eventDetailsModal.openDetails(e as any)">
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
                    <div class="content-cell min-h-17!">
                        <UserLabel :userId="e.user_id" />
                    </div>

                </div>

                <!-- Footer / No Events -->
                <div v-if="!shownEvents?.length"
                    class="flex flex-center flex-col flex-wrap gap-1 font-black ring-ring-soft bg-text-3/10 ring w-full py-2 text-center text-text-1/40">

                    <p class="uppercase mt-1 text-xs">
                        No Events Found!
                    </p>
                    <div class="bg-ring-soft/80 h-0.75 w-12 rounded-full " />
                    <p class="text-xs italic px-3 font-semibold">
                        This is where (after the bor or users) perform actions, you'll be able to view the history here.
                    </p>
                </div>
                <div v-else class="flex flex-center flex-wrap py-2 px-5 gap-2 bg-text-3/10 ring-ring-soft ring">

                    <Button v-if="shownCount + batchSize <= auditEvents.length" @click="showMore" unstyled
                        class="button-base button-secondary gap-1 py-0.5 px-1.25 text-text-1/90">
                        <Iconify icon="tabler:calendar-down" size="16" />
                        <p class="font-bold text-sm pr-0.5">
                            Load More
                        </p>
                    </Button>

                    <p v-else class="font-extrabold uppercase text-xs text-text-1/40">
                        End of Events...
                    </p>

                </div>


            </div>

        </div>


        <!-- View Details - Audit Event Entry -->
        <EventDetailsDialog v-model:isVisible="eventDetailsModal.isVisible.value"
            v-model:selectedEvent="eventDetailsModal.selectedEvent.value" @close="eventDetailsModal.closeDetails()" />


    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .auditLogTable {
        @apply mt-5 mx-3 max-w-195 min-w-80 sm:min-w-120 !max-h-fit block bg-bg-1 border-ring-soft border-2 rounded-md overflow-clip;

        *.heading-cell {
            @apply w-full text-center font-extrabold p-2 bg-text-1/15 ring-1 ring-ring-soft;
        }

        *.content-row {
            @apply grid transition-all grid-cols-3 grid-flow-row-dense
        }

        *.content-cell {
            @apply min-w-0 p-2 px-2.5 break-inside-auto wrap-anywhere whitespace-pre-line group-hover:bg-text-soft/25 group-active:bg-text-soft/12 group-hover:cursor-pointer flex items-center justify-start flex-wrap text-wrap !min-h-fit h-full w-full ring-1 ring-ring-soft font-medium text-text-1/65;
        }

    }


</style>