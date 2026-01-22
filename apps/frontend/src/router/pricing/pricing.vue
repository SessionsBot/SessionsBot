<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import LandingSection from './LandingSection.vue'
    import FeaturesTable from './FeaturesTable.vue';
    import SubscriptionCards from './SubscriptionCards.vue';


    // Services:
    const dashboard = useDashboardStore();
    const route = useRoute()

    // Guild Id passed from route - possibly present
    const guildQuery = computed(() => route.query?.guild)





</script>


<template>
    <div class="flex relative flex-col gap-4 items-center max-w-full">

        <!-- Landing Section -->
        <LandingSection />


        <!-- Subscription Plans - Cards -->
        <div class="flex flex-col items-center justify-center gap-4 max-w-220 w-full">
            <!-- Subheading -->
            <div class="w-full px-4">
                <p class="text-sm font-black uppercase">
                    Available Subscriptions:
                </p>
            </div>

            <SubscriptionCards />

        </div>


        <!-- Features List - Table -->
        <div class="flex flex-col items-center justify-center gap-4 max-w-270 w-full">
            <!-- Subheading -->
            <div class="w-full px-4">
                <p class="text-sm font-black uppercase">
                    Full Features List:
                </p>
            </div>

            <FeaturesTable />

        </div>



        <SiteFooter class="mt-5" />
    </div>
</template>


<style scoped>

    @reference '@/styles/main.css';

    :deep(.action-button) {
        @apply gap-1 text-sm sm:text-[16px] p-1 px-1.5 font-bold rounded-md cursor-pointer flex items-center justify-center transition-all;

        &:active {
            scale: 0.98
        }
    }

    :deep(.button-secondary) {
        @apply bg-zinc-700/80 hover:bg-zinc-700/60 active:bg-zinc-700/50;

        &.action-button {
            @apply hover:bg-indigo-500/70;
        }
    }


</style>