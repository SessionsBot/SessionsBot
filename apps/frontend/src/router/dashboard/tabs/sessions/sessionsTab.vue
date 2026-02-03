<script lang="ts" setup>

    import StatCard from './cards/StatCard.vue';
    import CurrentSessions from './cards/CurrentSessions.vue';
    import ActiveTemplates from './cards/ActiveTemplates.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';

    // services:
    const dashboard = useDashboardStore();
    const guildSessions = computed(() => dashboard.guildData.sessions.state)
    const guildTemplates = computed(() => dashboard.guildData.sessionTemplates.state)

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

        <p class="mx-4 pt-1 text-sm text-start w-full text-white/70">
            View your Discord Server's recently posted sessions and any active session schedules you have configured.
        </p>

        <div class="w-full h-fit flex items-start justify-center p-4 pt-0 flex-wrap">

            <!-- Guild Stats - Bar Section -->
            <span hidden class="w-full flex gap-5 flex-wrap items-center justify-center">

                <!-- Total Sessions -->
                <StatCard title="Sessions Created" :value="guildSessions?.length" :icon-background="'red'">
                    <template #icon>
                        <Iconify icon="fluent:calendar-add-16-regular" />
                    </template>
                </StatCard>

                <!-- Total Templates -->
                <StatCard title="Active Schedules" :value="guildTemplates?.length" :icon-background="'green'">
                    <template #icon>
                        <Iconify icon="fluent:calendar-sync-16-regular" />
                    </template>
                </StatCard>

                <!-- Total RSVPs -->
                <StatCard title="RSVPs Made" :value="'?'" :icon-background="'blue'">
                    <template #icon>
                        <Iconify icon="fluent:calendar-checkmark-16-regular" />
                    </template>
                </StatCard>

            </span>

            <!-- Current Sessions Card -->
            <CurrentSessions />

            <!-- Active Session Templates Card -->
            <ActiveTemplates />

        </div>

    </div>
</template>


<style scoped></style>