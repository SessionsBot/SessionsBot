<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard'
    import { DateTime } from 'luxon'
    import CustomCalendar from './customCalendar.vue';
    import { CalendarDaysIcon } from 'lucide-vue-next';


    // Services:
    const dashboard = useDashboardStore();


</script>

<template>
    <!-- Content Root - Scroll Wrap -->
    <div class="dashboard-tab-view">
        <!-- Title & Desc -->
        <div class="w-full flex items-center justify-start flex-row gap-0">
            <div class="w-fit h-fit flex aspect-square">
                <CalendarDaysIcon :size="22" />

            </div>
            <p class="text-xl px-1.5 uppercase font-black">
                Calendar View
            </p>
        </div>

        <p class="mx-4 mb-7 pt-1 text-sm text-start w-full text-white/70">
            Take a look below at any of the recent actions Sessions Bot or server members have made in relation to
            sessions, RSVPs, etc.
        </p>

        <CustomCalendar />
    </div>

</template>
