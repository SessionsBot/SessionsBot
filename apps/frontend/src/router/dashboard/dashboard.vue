<script lang="ts" setup>

    import useDashboardStore from '@/stores/dashboard/dashboard';
    import DashboardNav from './components/nav/dashboardNav.vue';
    import SelectServer from './components/selectServer.vue';
    import DashboardTabView from './tabs/dashboardTabView.vue';
    import { useAuthStore } from '@/stores/auth';
    import { useGuildChannels } from '@/stores/dashboard/guildChannels';
    import { useGuildRoles } from '@/stores/dashboard/guildRoles';
    import { useGuildSubscription } from '@/stores/dashboard/guildSubscription';
    import { useGuildTemplates } from '@/stores/dashboard/sessionTemplates';

    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore();

    // Guild Data - Services:
    const channels = useGuildChannels();
    const roles = useGuildRoles();
    const subscription = useGuildSubscription();
    const templates = useGuildTemplates();

    // BEFORE MOUNT - Load Saved Guild Choice:
    onBeforeMount(() => {
        // Load Saved "Guild Selection":
        const choice = dashboard.saveGuildSelection.get();
        if (choice) {
            dashboard.guild.id = choice;
            dashboard.nav.expanded = false;
        }
    });

    // FN - Fetch Guild Data for Dashboard:
    async function fetchGuildData() {
        // Fetch Data:
        await Promise.all([
            channels.execute(),
            roles.execute(),
            subscription.execute(),
            templates.execute(),
        ]);
        // Check Data:
        const checks = [channels, roles, subscription, templates];
        const dataReady = checks.every(r => r.isReady.value && !r.error.value);
        dashboard.guild.dataReady = dataReady;
    }

    // FN - Await Auth Ready to Fetch Data:
    async function waitForAuthReady(timeoutMs = 5000) {
        if (auth.signedIn) return true;
        return await Promise.race([
            new Promise(resolve => watch(() => auth.authReady, (r) => { if (r) resolve(true) }, { once: true })),
            new Promise(resolve => setTimeout(() => resolve(false), timeoutMs))
        ])
    }

    // WATCH - Guild Selected - Fetch Data:
    watch(() => dashboard.guild.id, async (id) => {
        console.info('Guild Changed', id);
        if (!id) {
            // No Guild Id Selected - Clear Store:
            console.info('No guild id - clearing store...');
            dashboard.clearGuildStoreData();
            return
        }
        if (!auth.authReady) {
            // Auth NOT READY - Await Readiness:
            console.warn('Waiting for auth to be ready...');
            await waitForAuthReady();
        }
        if (!auth.signedIn) {
            // No User Signed In - Clear Store - Prompt Sign In:
            dashboard.clearGuildStoreData();
            auth.signIn('/dashboard')
            return;
        }
        // CHECKS PASSED - Fetch Data for Selected Guild:
        await fetchGuildData();
    }, { immediate: true })


</script>


<template>


    <div class="relative flex flex-col grow w-full h-full max-w-full max-h-full">

        <Transition name="slide" mode="out-in">
            <!-- Dashboard View - Page/Wrap -->
            <div v-if="dashboard.guild.id" class="absolute flex flex-row inset-0 w-full! h-full!">

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