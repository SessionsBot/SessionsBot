<script lang="ts" setup>

    import CurrentSessions from './cards/recentSessions/CurrentSessions.vue';
    import ActiveTemplates from './cards/activeSchedules/ActiveSchedules.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import DisabledTemplateAlert from './cards/DisabledTemplateAlert.vue';
    import StatCard from './cards/StatCard.vue';
    import MigratingTemplates from './cards/migratingTemplates.vue';

    // services:
    const dashboard = useDashboardStore();
    // const guildSessions = computed(() => dashboard.guildData.sessions.state)
    const guildTemplates = computed(() => dashboard.guildData.sessionTemplates.state)

    const activeTemplates = computed(() => {
        guildTemplates.value?.filter(t => t.enabled == true
            && t.next_post_utc != null
        )
    })

</script>


<template>
    <div class="dashboard-tab-view flex! flex-wrap! flex-col!">

        <!-- Title & Desc -->
        <div class="w-full flex items-center justify-start flex-row gap-0">
            <div class="w-fit h-fit flex aspect-square">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="1">
                        <path stroke-width="2" d="M12 3h7v18h-14v-18h7Z" />
                        <path d="M14.5 3.5v3h-5v-3" />
                        <g stroke-width="2">
                            <path d="M9 10h3" />
                            <g stroke-dasharray="8" stroke-dashoffset="8">
                                <path d="M9 13h5" stroke-dashoffset="0" />
                                <path d="M9 16h6" stroke-dashoffset="0" />
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
            <p class="text-xl px-1.5 uppercase font-black">
                Sessions View
            </p>
        </div>

        <p class="mx-4 pt-1 text-sm text-start w-full text-text-1/70">
            View your Discord Server's recently posted sessions and any active session schedules you have configured.
        </p>

        <div class="w-full h-fit flex items-start justify-center p-4 pb-2 flex-wrap">

            <!-- Disbanded Schedule(s) - Alert -->
            <DisabledTemplateAlert v-if="guildTemplates?.some(t => !t.enabled)" />

            <!-- Col Wrap -->
            <Transition name="fade">
                <div v-if="dashboard.guildData.migratingTemplates?.state?.length"
                    class="flex flex-center w-full flex-wrap">
                    <!-- Migrating Templates - Alert/Card -->
                    <MigratingTemplates />
                </div>
            </Transition>

            <!-- Current Sessions Card -->
            <CurrentSessions />

            <!-- Active Session Templates Card -->
            <ActiveTemplates />


            <!-- Guild Stats - Bar Section -->
            <span class="w-full mt-10 flex gap-5 flex-wrap items-center justify-center">

                <!-- Total Sessions -->
                <StatCard title="Sessions Created" :value="dashboard.guildData.guildStats.state?.sessions_created ?? 0"
                    :classes="{ iconContainer: 'bg-emerald-600/70!' }" iconName="fluent:calendar-add-16-regular" />


                <!-- Total RSVPs -->
                <StatCard title="RSVPs Assigned" :value="dashboard.guildData.guildStats.state?.rsvps_assigned ?? 0"
                    :classes="{ iconContainer: 'bg-sky-600/70!' }" iconName="fluent:calendar-checkmark-16-regular" />

                <!-- Total Templates -->
                <StatCard title="Active Schedules" :value="guildTemplates?.length ?? 0"
                    :classes="{ iconContainer: 'bg-yellow-600/70!' }" iconName="fluent:calendar-sync-16-regular" />

            </span>

        </div>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    /* Paginator Styles */
    :deep(.paginator) {
        @apply !w-full p-1 border-t-2 border-ring-soft;
        --p-paginator-background: var(--color-bg-2);
        --p-paginator-nav-button-hover-background: var(--color-ring-soft);
        --p-paginator-nav-button-selected-background: var(--color-indigo-500);
        --p-paginator-nav-button-color: var(--color-text-1);
        --p-paginator-nav-button-hover-color: var(--color-text-1);
        --p-paginator-nav-button-selected-color: var(--color-text-1);
    }

</style>