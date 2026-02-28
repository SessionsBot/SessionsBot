<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { ArrowBigDown } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import SessionCard from './SessionCard.vue';

    // Services:
    const dashboard = useDashboardStore();

    // Active Guild Sessions - From Start of Today in Sessions Selected Zone
    const guildSessions = computed(() => dashboard.guildData.sessions.state?.filter(s => {
        // Filter out sessions that started in a previous day:
        const startDate = DateTime.fromISO(s.starts_at_utc, { zone: s.time_zone })
        return startDate >= DateTime.now().setZone(s.time_zone).startOf('day')
    }).sort((a, b) => {
        return DateTime.fromISO(a.starts_at_utc)?.toUnixInteger() - DateTime.fromISO(b.starts_at_utc)?.toUnixInteger()
    }));


    // Sessions Paginator:
    const sPageIndexStart = ref<number>();

    // Watch - Highlighted Session Id:
    watch(() => dashboard.nav.highlightedSessionId, (id) => {
        if (id) {

            const session = dashboard.guildData.sessions.state?.find(s => s.id == id)
            if (!session) return console.warn('Failed to find session by id to highlight!')
            const s_index = guildSessions.value?.findIndex(s => s.id == id);
            if (s_index === -1 || !s_index) return console.warn('Failed to find session by id to highlight!')
            const pageStart = Math.floor(s_index / 5) * 5

            // Switch paginator page
            sPageIndexStart.value = pageStart

        } else return
    })


</script>


<template>
    <div class="flex justify-center items-center min-w-fit pt-10">

        <!-- Current Sessions Card -->
        <section class="upcoming-sessions-card">

            <!-- Header -->
            <div class="card-header">
                <!-- Card Title -->
                <div class="flex flex-row items-center justify-center gap-0.75 p-0.5 font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2">
                            <path stroke-linejoin="round"
                                d="M15.5 4H18a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2.5" />
                            <path stroke-linejoin="round"
                                d="M8.621 3.515A2 2 0 0 1 10.561 2h2.877a2 2 0 0 1 1.94 1.515L16 6H8z" />
                            <path d="M9 12h6m-6 4h6" />
                        </g>
                    </svg>
                    <h1 class="sm:text-lg"> Sessions </h1>
                </div>
                <!-- Create Session - Button -->
                <Button unstyled class="button-primary" @click="dashboard.sessionForm.createNew()">
                    <Iconify icon="mdi:plus" />
                </Button>
            </div>

            <!-- Recently Posted - Section -->
            <div class="section-heading">

                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="m12 20l1.3.86c-.2-.58-.3-1.21-.3-1.86c0-.24 0-.5.04-.71L12 17.6l-3 2l-3-2l-1 .66V5h14v8c.7 0 1.37.12 2 .34V3H3v19l3-2l3 2zm5-11V7H7v2zm-2 4v-2H7v2zm.5 6l2.75 3L23 17.23l-1.16-1.41l-3.59 3.59l-1.59-1.59z"
                        stroke-width="0.25" stroke="currentColor" />
                </svg>

                <p>
                    Recently Posted:
                </p>
            </div>

            <!-- Active/Posted Sessions - List -->
            <div class="w-full flex flex-col gap-2 items-center justify-center pt-2 p-4 min-h-15 ">

                <SessionCard v-if="guildSessions?.length"
                    v-for="s in guildSessions.slice(sPageIndexStart ?? 0, ((sPageIndexStart ?? 0) + 5))" kind="session"
                    :session="s" :key="s.id" :data-id="s.id" />

                <!-- No Schedules - Card -->
                <div v-if="!guildSessions?.length">
                    <p class="text-bold text-text-1">
                        No Sessions Yet!
                    </p>
                    <p class="text-text-3 text-sm px-1">
                        Start utilizing Sessions Bot and configure your first schedule.. once you've done so wait for
                        your sessions to be posted!
                    </p>
                    <Button unstyled @click="dashboard.sessionForm.createNew()"
                        class="button-base mt-2.25 active:scale-95 pr-1.5 gap-0 font-semibold bg-brand-1/90 hover:bg-brand-1/75">
                        <Iconify icon="mdi:plus" size="21" />
                        <p class="text-sm"> Create Schedule </p>
                    </Button>
                </div>

            </div>
            <!-- Sessions Paginator -->
            <Paginator v-model:first="sPageIndexStart" v-if="guildSessions?.length"
                :total-records="guildSessions.length" :rows="5" :always-show="false" class="paginator">
            </Paginator>

        </section>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    /* Paginator Styles */
    .paginator {
        @apply !w-full p-1 border-t-2 border-ring;
        --p-paginator-background: var(--color-surface);
        --p-paginator-nav-button-hover-background: var(--color-ring);
        --p-paginator-nav-button-selected-background: var(--color-indigo-500);
        --p-paginator-nav-button-color: var(--color-white);
        --p-paginator-nav-button-hover-color: var(--color-white);
        --p-paginator-nav-button-selected-color: var(--color-white);
    }

    .upcoming-sessions-card {
        @apply bg-bg-2 w-[90%] max-w-140 h-fit ring-ring-soft ring-2 rounded-md flex flex-col items-center justify-center content-center flex-wrap;

        .card-header {
            @apply bg-bg-4/20 border-b-2 border-ring-soft flex w-full gap-8 p-3 justify-between items-center content-center flex-row;
        }

        .section-heading {
            @apply bg-bg-4/20 border-2 border-ring-soft/50 text-text-1/50 p-1.5 py-0.75 gap-0.5 flex self-start relative left-1.5 w-fit mt-2 rounded-lg flex-row items-center justify-center;

            p {
                @apply font-extrabold text-sm
            }
        }
    }

</style>