<script lang="ts" setup>

    import TotalSessionsCard from './cards/totalSessions.vue';
    import UpcomingSessionsCard from './cards/upcomingSessions.vue'




</script>


<template>
    <div class="flex h-full! w-full grow flex-col justify-center items-center flex-1">

        <!-- Total Sessions Card -->
        <TotalSessionsCard />

        <!-- Upcoming Sessions Card -->
        <UpcomingSessionsCard />

    </div>
</template>


<style scoped></style>