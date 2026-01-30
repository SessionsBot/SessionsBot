<script lang="ts" setup>

    import TotalSessionsCard from './cards/totalSessions.vue';
    import UpcomingSessions from './cards/upcomingSessions/UpcomingSessions.vue';
    import UpcomingSessionsCard from './cards/upcomingSessionsOLD.vue'




</script>


<template>
    <div class="dashboard-tab-view">

        <!-- Total Sessions Card -->
        <TotalSessionsCard hidden />

        <!-- Upcoming Sessions Card -->
        <UpcomingSessionsCard />

        <!-- Upcoming Sessions Card -->
        <UpcomingSessions />

    </div>
</template>


<style scoped></style>