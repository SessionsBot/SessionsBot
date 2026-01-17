<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard'
    import { DateTime } from 'luxon'
    import CustomCalendar from './customCalendar.vue';


    // Services:
    const dashboard = useDashboardStore();


</script>

<template>
    <!-- Content Root - Scroll Wrap -->
    <div class="w-full flex flex-wrap p-4">
        <CustomCalendar />
    </div>

</template>
