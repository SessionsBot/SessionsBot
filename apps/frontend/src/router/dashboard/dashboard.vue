<script lang="ts" setup>

    import useDashboardStore from '@/stores/dashboard/dashboard';
    import DashboardNav from './components/nav/dashboardNav.vue';
    import SelectServer from './components/selectServer.vue';
    import DashboardTabView from './tabs/dashboardTabView.vue';
    import { useAuthStore } from '@/stores/auth';

    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore();



    // BEFORE MOUNT - Load Saved Guild Choice:
    onBeforeMount(() => {
        // Load Saved "Guild Selection":
        const choice = dashboard.saveGuildChoice.get()
        if (choice) {
            dashboard.guildId = choice;
            dashboard.nav.expanded = false;
        }
    });

    // FN - Await Auth Ready to Fetch Data:
    async function waitForAuthReady(timeoutMs = 5000) {
        if (auth.signedIn) return true;
        return await Promise.race([
            new Promise(resolve => watch(() => auth.authReady, (r) => { if (r) resolve(true) }, { once: true })),
            new Promise(resolve => setTimeout(() => resolve(false), timeoutMs))
        ])
    }

    // WATCH - Guild Selected - Fetch Data:
    // watch(() => dashboard.guild.id, async (id) => {
    //     if (!id) {
    //         // No Guild Id Selected - Clear Store:
    //         dashboard.clearGuildStoreData();
    //         return
    //     }
    //     if (!auth.authReady) {
    //         // Auth NOT READY - Await Readiness:
    //         // console.warn('[Dashboard Data]: Waiting for auth to be ready for data fetch...');
    //         await waitForAuthReady();
    //     }
    //     if (!auth.signedIn) {
    //         // No User Signed In - Clear Store - Prompt Sign In:
    //         console.warn('[Dashboard Data]: Auth Ready - NO USER - Clearing Store');
    //         dashboard.clearGuildStoreData();
    //         auth.signIn('/dashboard')
    //         return;
    //     }
    //     // CHECKS PASSED - Fetch Data for Selected Guild:
    //     // await fetchGuildData();
    //     await dashboard.fetchGuildApiData()

    // }, { immediate: true });


</script>


<template>


    <div class="relative flex flex-col grow w-full h-full max-w-full max-h-full">

        <Transition name="slide" mode="out-in">
            <!-- Dashboard View - Page/Wrap -->
            <div v-if="dashboard.guildId"
                class="absolute flex flex-row inset-0 w-full! h-full! max-w-full! max-h-full!">

                <!-- Dashboard - Nav/Sidebar -->
                <DashboardNav />

                <!-- Dashboard - Content View -->
                <div
                    class=" pl-15 sm:pl-0! w-full h-full! max-w-full! max-h-full! p-0 grow flex items-center justify-center">

                    <DashboardTabView />

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