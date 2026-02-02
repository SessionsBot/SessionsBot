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
    <div class="dashboard-tab-view flex! flex-wrap!">

        <span class="w-full h-full flex items-start justify-center p-4 flex-wrap">

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

        </span>

    </div>
</template>


<style scoped></style>