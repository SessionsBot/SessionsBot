<script lang="ts" setup>

    import useDashboardStore from '@/stores/dashboard/dashboard';
    import DashboardNav from './components/nav/dashboardNav.vue';
    import SelectServer from './components/selectServer.vue';
    import SessionsTab from './tabs/sessions/sessionsTab.vue';
    import DashboardTabView from './tabs/dashboardTabView.vue';

    const dashboard = useDashboardStore();
    const selectedGuildId = computed(() => dashboard.guild.id);
    const selectedDashboardTab = computed(() => dashboard.nav.currentTab)


    // ON - Initial Full Page Mount:
    onMounted(() => {
        // Load Saved "Guild Selection":
        const choice = dashboard.saveGuildSelection.get();
        if (choice) {
            dashboard.guild.id = choice;
            dashboard.nav.expanded = false;
        }
    })

</script>


<template>


    <div class="relative flex flex-col grow w-full h-full max-w-full max-h-full">

        <Transition name="slide" mode="out-in">
            <!-- Dashboard View - Page/Wrap -->
            <div v-if="selectedGuildId" class="absolute flex flex-row inset-0 w-full! h-full!">

                <!-- Dashboard - Nav/Sidebar -->
                <DashboardNav />

                <!-- Dashboard - Content View -->
                <div class=" ml-15 sm:ml-0! p-0 grow flex items-center justify-center overflow-clip">
                    <div class="bg-red-500/0 w-full grow h-full min-h-fit flex flex-row justify-between items-center">

                        <DashboardTabView />

                    </div>
                </div>

            </div>

            <!-- Select Guild - Card -->
            <div v-else class="w-full h-full flex grow items-center justify-center p-5">
                <SelectServer />
            </div>
        </Transition>

    </div>






</template>



<style scoped></style>