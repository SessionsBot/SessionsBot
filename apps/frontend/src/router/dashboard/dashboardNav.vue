<script setup lang="ts">
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { BellRingIcon, CalendarDaysIcon, ClipboardListIcon, MoveLeftIcon, UserCheckIcon } from 'lucide-vue-next';
    import dashboardNavButton from './components/dashboardNavButton.vue';

    // Incoming Props:
    const props = defineProps<{
        isSmallScreen: boolean;
    }>();

    // Services:
    const dashboard = useDashboardStore();

    // Nav States:
    const isExpanded = ref(false);
    const isModeled = ref(false);

    watch(isExpanded, (expanded) => {
        if (expanded) {
            if (props.isSmallScreen) {
                isModeled.value = true
            } else {
                isModeled.value = false
            }
        }
    })

    watch(() => props.isSmallScreen, (small) => {
        if (small) {
            isExpanded.value = false;
            isModeled.value = true;
        } else {
            isExpanded.value = true;
            isModeled.value = false;
        }
    }, { immediate: true })

</script>

<template>
    <nav class="flex z-3 flex-col items-center min-w-fit! bg-black/15 border-ring/40 border-r-2" :class="{
        'min-w-fit! sticky inset-0 right-0': isExpanded && isModeled,
        'w-8!': !isExpanded
    }">

        <!-- Expander Button -->
        <button unstyled @click="isExpanded = !isExpanded"
            class="p-0.5 top-0 w-full h-8 flex flex-row items-end justify-center bg-white/7 hover:bg-white/11 transition-all rounded-md rounded-t-none cursor-pointer">
            <div :class="{ 'rotate-y-180!': isExpanded }" class="transition-all">
                <svg class="text-white/60" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                    viewBox="0 0 24 24">
                    <rect width="24" height="24" fill="none" />
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M3.75 7.25a3.5 3.5 0 0 1 3.5-3.5h9.5a3.5 3.5 0 0 1 3.5 3.5v9.5a3.5 3.5 0 0 1-3.5 3.5h-9.5a3.5 3.5 0 0 1-3.5-3.5zm5.797-3.5v16.5m5.493-6L17.25 12m0 0l-2.21-2.25M17.25 12h-4.7" />
                </svg>

            </div>
            <p v-if="isExpanded" class="pl-0.5 font-bold text-white/57">
                HIDE
            </p>
        </button>

        <!-- Tab/Nav Buttons -->
        <aside class="flex flex-col p-3 grow gap-2 w-full min-w-fit!"
            :class="{ 'items-center justify-start p-1 gap-1': !isExpanded }">
            <dashboardNavButton name="Sessions" :icon="ClipboardListIcon" v-model:isExpanded="isExpanded" :isModeled />
            <dashboardNavButton name="Calendar" :icon="CalendarDaysIcon" v-model:isExpanded="isExpanded" :isModeled />
            <dashboardNavButton name="Notifications" :icon="BellRingIcon" v-model:isExpanded="isExpanded" :isModeled />
            <dashboardNavButton name="Subscription" :icon="UserCheckIcon" v-model:isExpanded="isExpanded" :isModeled />
        </aside>

        <!-- Nav Footer -->
        <div class="flex w-full pl-3 text-white/65 flex-col gap-1 p-1 items-center justify-center" v-if="isExpanded">
            <!-- Support Link -->
            <RouterLink to="/support" class="cursor-pointer w-full!">
                <div
                    class="flex hover:underline hover:text-white transition-all flex-row gap-1 items-center justify-start flex-nowrap w-full">
                    <svg class="size-5 p-0.25" xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                        viewBox="0 0 32 32">
                        <path fill="currentColor"
                            d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2m0 23a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 16 25m1.142-7.754v2.501h-2.25V15h2.125a2.376 2.376 0 0 0 0-4.753h-1.5a2.38 2.38 0 0 0-2.375 2.375v.638h-2.25v-.638A4.63 4.63 0 0 1 15.517 8h1.5a4.624 4.624 0 0 1 .125 9.246" />
                        <path fill="none"
                            d="M16 25a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 16 25m1.142-7.754v2.501h-2.25V15h2.125a2.376 2.376 0 0 0 0-4.753h-1.5a2.38 2.38 0 0 0-2.375 2.375v.638h-2.25v-.638A4.63 4.63 0 0 1 15.517 8h1.5a4.624 4.624 0 0 1 .125 9.246" />
                    </svg>
                    <p class="text-[13px]"> Need Help? </p>
                </div>
            </RouterLink>
            <!-- Select Server - Go Back -->
            <div @click="dashboard.guild.id = null"
                class="flex hover:underline cursor-pointer hover:text-white transition-all flex-row gap-1 items-center justify-start flex-nowrap w-full">
                <MoveLeftIcon class="size-5" />
                <p class="text-[13px]"> Select Server </p>
            </div>

        </div>


    </nav>

    <!-- Blur Model -->
    <Transition name="fade" :duration="0.45">
        <div v-if="isExpanded && isModeled" @click="isExpanded = false; isModeled = false"
            class="absolute z-2 inset-0 w-full h-full grow flex bg-black/10 backdrop-blur-2xl transition-all" />
    </Transition>
</template>
