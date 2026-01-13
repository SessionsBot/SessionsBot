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


    <div class="relative flex flex-col grow w-full h-full max-w-full max-h-full bg-amber-600">


        <div class="absolute flex flex-row inset-0 bg-sky-700 w-full! h-full!">

            <div
                class="w-32  p-2 absolute left-0 h-full flex flex-col justify-between items-center overflow-x-clip overflow-y-auto bg-amber-400">
                <p>
                    NAV - T
                </p>
                <p>
                    NAV - B
                </p>
            </div>

            <div class=" bg-red-500 grow flex items-center justify-center p-5 overflow-auto">
                <div class="p-2 w-full grow h-full min-h-fit flex flex-row justify-between items-center bg-sky-400">
                    <p>
                        BODY - T
                    </p>
                    <p>
                        BODY - B
                    </p>
                </div>
            </div>

        </div>

        <!-- OLD ATTEMPT -->
        <div hidden class="flex flex-col w-full h-full items-start">


            <div class=" bg-emerald-500 w-full h-full grow flex relative items-center justify-center">

                <div class="bg-purple-400 absolute inset-0 w-full h-full max-h-full! flex grow flex-col">
                    <!-- Dashboard Nav - Full Wrap -->
                    <DashboardNav />

                    <!-- Dashboard Tab View -->
                    <main class="flex ml-15 flex-wrap w-full! bg-sky-400/40 overflow-clip overflow-y-auto">
                        <Transition name="zoom" mode="out-in">
                            <SelectServer v-if="!selectedGuildId" />
                            <ServerDashboard v-else />
                        </Transition>
                    </main>
                </div>



            </div>
        </div>
    </div>






</template>



<style scoped></style>