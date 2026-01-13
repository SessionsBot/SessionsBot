<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import SelectServer from './selectServer.vue';
    import ServerDashboard from './serverDashboard.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import DashboardNav from './components/nav/dashboardNav.vue';

    const dashboard = useDashboardStore();
    const selectedGuildId = computed(() => dashboard.guild.id);



    // ON - Initial Full Page Mount:
    // onMounted(() => {
    //     // Load Saved "Guild Selection":
    //     const choice = dashboard.saveGuildSelection.get();
    //     if (choice) dashboard.guild.id = choice;
    // })

</script>


<template>
    <div class="flex flex-col w-full h-full items-start">
        <!-- :class="{ 'max-w-screen! max-h-screen! overflow-clip!': dashboard.scrollLock }" -->


        <div class=" bg-emerald-500 w-full h-full grow flex flex-col items-center justify-center">

            <div class="bg-red-400/20 relative w-full h-full flex grow flex-row">
                <!-- Dashboard Nav - Full Wrap -->
                <!-- <div class="absolute z-4 min-h-full! left-0"> -->
                <DashboardNav />
                <!-- </div> -->

                <!-- Dashboard Tab View -->
                <main class="flex ml-15 flex-wrap grow bg-sky-400/40 overflow-clip overflow-y-auto">
                    <Transition name="zoom" mode="out-in">
                        <SelectServer v-if="!selectedGuildId" />
                        <ServerDashboard v-else />
                    </Transition>
                </main>
            </div>



        </div>
    </div>



</template>


<style scoped></style>