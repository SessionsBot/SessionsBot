<script lang="ts" setup>

    import useDashboardStore from '@/stores/dashboard/dashboard';
    import DashboardNav from './components/nav/dashboardNav.vue';
    import SelectServer from './components/selectServer.vue';
    import DashboardTabView from './dashboardTabView.vue';
    import { useAuthStore } from '@/stores/auth';
    import { TriangleAlertIcon } from 'lucide-vue-next';
    import useNotifier from '@/stores/notifier';
    import { externalUrls } from '@/stores/nav';

    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore()
    const route = useRoute();
    const router = useRouter();
    const notifier = useNotifier();

    // Util: Await Auth Ready or Timeout:
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
                setTimeout(() => { res(false) }, 10_000);
            })
        ])
    }

    // BEFORE MOUNT - Auth Guard / Load Saved / Pre Selected Guild Choice & Actions:
    onBeforeMount(async () => {

        // If auth NOT ready - await readiness:
        if (!auth.authReady) await authIsReady()

        // If not Signed In - Redirect back to EXACT path (preserves predefined actions):
        if (!auth.signedIn) {
            const fullPath = route.fullPath
            auth.signIn(fullPath)
        }

        // Get query / pre selected GUILD ID - allows pre defined actions:
        const { guild, action: action_raw } = route.query
        if (guild) {
            // Guild selected from URL - Confirm guild allowed via auth:
            const authGuild = auth.identity?.guilds.manageable.find(g => g.id == guild)
            if (authGuild) {
                if (authGuild.hasSessionsBot) {
                    // Allowed - Select Guild:
                    dashboard.guildId = String(guild);
                } else
                    // Not Allowed - Notify of "Un-Added" Pre Defined Guild:
                    notifier.send({
                        header: 'Bot not Added!',
                        icon: 'foundation:plus',
                        level: 'warn',
                        content: `It seems like this server does not yet have Sessions Bot installed. <br><span class="opacity-65 text-xs">Not Right? Try refreshing your <a class="text-link!" href="/account">account data</a>.</span>`,
                        duration: 30_000,
                        actions: [{
                            button: {
                                title: 'Invite Bot',
                                icon: 'mdi:plus',
                                href: externalUrls.inviteBot
                            }
                        }]
                    })

            } else {
                // Not Allowed - Notify of "Un-Allowed" Pre Defined Guild:
                notifier.send({
                    header: 'Not Allowed!',
                    icon: 'mdi:lock',
                    level: 'error',
                    duration: 30_000,
                    content: `It seems like you don't have access to this server! Admin permissions are required to access a server's dashboard. <br><span class="opacity-65 text-xs">Not Right? Try refreshing your <a class="text-link!" href="/account">account data</a>.</span>`
                })
            }

        } else {
            // Check for Previously Saved "Guild Selection":
            const preSavedGuildChoice = dashboard.saveGuildChoice.get()
            if (preSavedGuildChoice) {
                dashboard.guildId = preSavedGuildChoice;
                dashboard.nav.expanded = false;
            }
        }

        // PRE DEFINED ACTION QUERY:
        if (action_raw) {
            const action = String(action_raw);
            // Watch Guild Data Ready - Refreshed - Perform Query Actions
            const watcher = watch(dashboard.guildDataState, (v) => {
                if (v.allReady && !v.errors.length) {
                    try {
                        if (action == 'new session') {
                            // Open New Session Form:
                            dashboard.sessionForm.createNew()
                            router.replace('/dashboard')
                        } else if (action == 'view calendar') {
                            // Open Calendar Tab:
                            dashboard.nav.currentTab = 'Calendar';
                            router.replace('/dashboard')
                        } else if (action == 'view logs' || action == 'view audit logs') {
                            // Open Calendar Tab:
                            dashboard.nav.currentTab = 'AuditLog';
                            router.replace('/dashboard')
                        }
                        watcher.stop()
                    } catch (err) {
                        console.error('Failed to perform pre-defined dashboard action!', action, err)
                        watcher.stop()
                    }

                } else {
                    console.warn('Pre defined dashboard action has failed!, data was not ready or errored...', v)
                }
            }, { deep: true })
        }



    });

    // On UNMOUNT:
    onUnmounted(() => {
        dashboard.nav.currentTab = 'Sessions'
    })


</script>


<template>


    <div class="relative flex flex-col grow w-full h-full max-w-full max-h-full">

        <Transition name="slide" mode="out-in">

            <!-- Loading Card - Await Auth -->
            <div v-if="!auth.authReady" class="w-full h-full flex grow flex-center p-5">

                <div
                    class="flex flex-center text-center flex-col flex-wrap gap-1 p-5 rounded-lg border-2 border-ring-soft bg-bg-soft">
                    <ProgressSpinner />
                    <p class="text-lg font-bold px-3"> Loading Account </p>
                    <p class="px-4 text-sm opacity-65 italic ">
                        We're fetching your account data..<br>Please wait!
                    </p>
                </div>

            </div>


            <!-- Select Guild - Card -->
            <div v-else-if="!dashboard.guildId" class="w-full h-full flex grow items-center justify-center p-5">
                <SelectServer />
            </div>


            <!-- Data/Fetch Error(s) -->
            <span v-else-if="dashboard.guildDataState.errors?.length"
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
            <div v-else-if="dashboard.guildId != null && !dashboard.guildDataState.errors?.length"
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