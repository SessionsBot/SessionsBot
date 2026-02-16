<script lang="ts" setup>

    import useDashboardStore from '@/stores/dashboard/dashboard';
    import DashboardNav from './components/nav/dashboardNav.vue';
    import SelectServer from './components/selectServer.vue';
    import DashboardTabView from './dashboardTabView.vue';
    import { useAuthStore } from '@/stores/auth';
    import { TriangleAlertIcon } from 'lucide-vue-next';
    import useNotifier from '@/stores/notifier';

    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore()
    const route = useRoute();
    const notifier = useNotifier();

    // Util: Await Auth Ready:
    async function authIsReady() {
        if (auth.authReady) return true
        else return Promise.race([
            // Watch auth to become ready
            new Promise<boolean>(res => watch(() => auth.authReady, (isReady) => {
                if (isReady) res(true);
                else res(false);
            }, { once: true })),
            // Timeout in X seconds:
            new Promise<boolean>((res) => {
                setTimeout(() => { res(false) }, 2_500);
            })
        ])
    }

    // BEFORE MOUNT - Auth Guard / Load Saved / Pre Selected Guild Choice:
    onBeforeMount(async () => {

        // If auth NOT ready - await readiness:
        if (!auth.authReady) await authIsReady()

        // If not Signed In - Redirect back to EXACT path (preserves predefined actions):
        if (!auth.signedIn) {
            const fullPath = route.fullPath
            auth.signIn(fullPath)
        }

        // Get query / pre selected GUILD ID - allows pre defined actions:
        const { guild } = route.query
        if (guild) {
            return dashboard.guildId = String(guild);
        }

        // Load Saved "Guild Selection":
        const choice = dashboard.saveGuildChoice.get()
        if (choice) {
            dashboard.guildId = choice;
            dashboard.nav.expanded = false;
        }

    });

    // Guild Data State:
    const guildDataState = computed(() => dashboard.guildDataState)

</script>


<template>


    <div class="relative flex flex-col grow w-full h-full max-w-full max-h-full">

        <Transition name="slide" mode="out-in">


            <!-- Select Guild - Card -->
            <div v-if="!dashboard.guildId" class="w-full h-full flex grow items-center justify-center p-5">
                <SelectServer />
            </div>


            <!-- Data/Fetch Error(s) -->
            <span v-else-if="guildDataState?.errors?.length"
                class="w-full h-full flex grow items-center justify-center flex-wrap p-5">
                <div
                    class="flex flex-col gap-2 items-center justify-center self-center p-7 m-5 max-w-135 bg-bg-2 border-2 border-ring-soft rounded-md shadow-lg">
                    <p class="font-black text-lg">
                        <TriangleAlertIcon class="inline bottom-0.5 relative text-invalid-1" />
                        Uh oh! We ran into a data error...
                    </p>
                    <p>
                        Wait a few seconds and refresh this page. If this issue persists, please get in contact
                        with
                        <RouterLink class="text-link/90 hover:underline" to="/support">bot support</RouterLink>.
                    </p>
                </div>
            </span>


            <!-- Dashboard View - Page/Wrap -->
            <div v-else-if="dashboard.guildId != null && !guildDataState.errors?.length"
                class="absolute flex flex-row inset-0 w-full! h-full! max-w-full! max-h-full!">

                <!-- Dashboard - Nav/Sidebar -->
                <DashboardNav />

                <!-- Dashboard - Content View -->
                <div
                    class=" pl-15 sm:pl-0! w-full h-full! max-w-full! max-h-full! p-0 grow flex items-center justify-center">

                    <DashboardTabView />

                </div>

            </div>

        </Transition>

    </div>






</template>



<style scoped></style>