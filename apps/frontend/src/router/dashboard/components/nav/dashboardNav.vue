<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';


    // Services:
    const dashboard = useDashboardStore();

    // Compute - Is Small Screen:
    const isSmallScreen = computed(() => {
        const { width: screenWidth } = useWindowSize();
        return screenWidth.value < 640
    })

</script>


<template>
    <aside
        class="w-15 z-4 h-fit! max-h-full! p-1 absolute left-0 flex flex-col flex-wrap text-wrap overflow-clip overflow-y-auto transition-all bg-zinc-900"
        :class="{
            'isExpanded': dashboard.nav.expanded,
            'isSmallScreen': isSmallScreen
        }">

        <!-- Nav Header -->
        <div class="flex flex-row gap-1 justify-center items-center max-w-full w-full h-fit flex-wrap">
            <p v-if="dashboard.nav.expanded" class="uppercase flex-1 font-black text-xs">
                DASHBOARD
            </p>
            <Button unstyled @click="dashboard.nav.expanded = !dashboard.nav.expanded"
                class="bg-zinc-700 rounded-md cursor-pointer active:scale-95 transition-all flex items-center justify-center">
                <iconify-icon :class="{ 'rotate-180': dashboard.nav.expanded }" icon="uil:angle-right" width="27"
                    height="27" class="block! transition-all m-0.25"></iconify-icon>
            </Button>
        </div>

        <div class=" bg-amber-700/50 flex flex-1 justify-between items-center flex-col">
            <p>1</p>
            <p class="absolute bottom-0">2</p>
        </div>


    </aside>
</template>


<style scoped>

    @reference "@/styles/main.css";

    aside {
        @apply fixed left-0;

        &.isExpanded {
            @apply min-w-45 w-45 min-h-full;

            &.isSmallScreen {
                @apply !bg-sky-400
            }
        }
    }

</style>