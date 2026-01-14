<script lang="ts" setup>

    import TotalSessionsCard from './cards/totalSessions.vue';
    import UpcomingSessionsCard from './cards/upcomingSessions.vue'




</script>


<template>
    <div class="p-4 gap-2 w-full h-fit flex-col flex items-center justify-center ">

        <!-- Total Sessions Card -->
        <TotalSessionsCard />

        <!-- Upcoming Sessions Card -->
        <UpcomingSessionsCard />

    </div>
</template>


<style scoped></style>