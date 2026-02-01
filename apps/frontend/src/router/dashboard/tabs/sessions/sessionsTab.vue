<script lang="ts" setup>

    import TotalSessionsCard from './cards/TotalSessions.vue';
    import CurrentSessions from './cards/CurrentSessions.vue';
    import ActiveTemplates from './cards/ActiveTemplates.vue';


</script>


<template>
    <div class="dashboard-tab-view flex! flex-wrap!">

        <!-- Total Sessions Card -->
        <TotalSessionsCard />

        <!-- Current Sessions Card -->
        <CurrentSessions />

        <!-- Active Session Templates Card -->
        <ActiveTemplates />

    </div>
</template>


<style scoped></style>