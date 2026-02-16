<script lang="ts" setup>
    // import useDashboardStore from '@/stores/dashboard/dashboard'
    import CustomCalendar from './customCalendar.vue';
    import { CalendarDaysIcon } from 'lucide-vue-next';


    // Services:
    // const dashboard = useDashboardStore();


</script>

<template>
    <!-- Content Root - Scroll Wrap -->
    <div class="dashboard-tab-view min-w-fit! flex-nowrap!">



        <!-- Title & Desc -->
        <div class="w-full flex items-center justify-start flex-row gap-0">
            <div class="w-fit h-fit flex aspect-square">
                <CalendarDaysIcon :size="22" />
            </div>
            <p class="text-xl px-1.5 uppercase font-black">
                Calendar View
            </p>
        </div>

        <p class="mx-4 mb-7 pt-1 text-sm text-start w-full text-text-1/70">
            View your Discord Server's personal calendar below. Here you can inspect individual days and look back
            at
            session
            history!
        </p>
        <span class="flex flex-col justify-between grow p-2 relative">
            <!-- Calendar Container Wrap -->
            <div class="flex grow items-center justify-center p-2 flex-wrap max-h-full w-full max-w-full">

                <CustomCalendar />

            </div>
        </span>


    </div>

</template>
