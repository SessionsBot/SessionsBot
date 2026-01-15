<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { useGuildChannels } from '@/stores/dashboard/guildChannels';
    import { useSessionTemplates } from '@/stores/dashboard/sessionTemplates';
    import { useGuildRoles } from '@/stores/dashboard/guildRoles';
    import { useGuildSubscription } from '@/stores/dashboard/guildSubscription';
    import SessionForm from '../components/sessionForm/sesForm.vue';
    import SessionsTab from './sessions/sessionsTab.vue';
    import CalendarTab from './calendar/calendarTab.vue';
    import AuditLogTab from './auditLog/auditLogTab.vue';
    import NotificationsTab from './notifications/notificationsTab.vue';
    import { useAuthStore } from '@/stores/auth';
    import { SubscriptionLevel } from '@sessionsbot/shared';


    // Services:
    const auth = useAuthStore();
    const dashboard = useDashboardStore();


    // Guild - Channels:
    const channels = ref<ReturnType<typeof useGuildChannels>>() //  useGuildChannels();
    // Guild - Roles:
    const roles = ref<ReturnType<typeof useGuildRoles>>() // useGuildRoles();
    // Guild - Session Templates:
    const subscription = ref<ReturnType<typeof useGuildSubscription>>() // useGuildSubscription()
    // Guild - Session Templates:
    const templates = ref<ReturnType<typeof useSessionTemplates>>() // useSessionTemplates()

    // Dashboard Data Ready - Flag:
    const dashboardReady = computed(() => {
        const checks = [
            channels.value,
            roles.value,
            templates.value,
            subscription.value,
        ];
        return checks.every((s: any) => (s?.isReady && !s?.error))
    })


    // On Mounted - Auth Gourd - Fetch Data:
    onBeforeMount(() => {
        // WATCH - AUTH USER - Signed In Guard
        watch(() => auth.signedIn, (signedIn) => {
            if (signedIn && dashboard.guild.id) {
                channels.value = useGuildChannels();
                roles.value = useGuildRoles();
                subscription.value = useGuildSubscription();
                templates.value = useSessionTemplates();
            } else {
                dashboard.guild.id = null;
                console.warn(`No current auth user! - Cannot fetch dashboard data!`)
            }
        }, { immediate: true })
    })





</script>


<template>
    <div class="flex flex-col grow items-center justify-center flex-1 w-full h-full">
        <Transition name="slide" :duration="0.5" mode="out-in">
            <!-- Loading Content - Modal -->
            <div v-if="!dashboardReady"
                class="flex gap-2 items-center justify-center p-4 bg-black/40 rounded-md shadow-lg">
                <ProgressSpinner />
                <div class="text-white/70 p-2 text-center">
                    <p class="font-bold text-lg"> Loading Dashboard </p>
                    <p class="text-xs italic"> Please Wait</p>
                </div>
            </div>

            <!-- Main Page Content -->
            <div v-else class="flex flex-row grow min-w-full! w-full! h-fit overflow-x-clip overflow-y-auto">

                <Transition name="slide" mode="out-in">
                    <KeepAlive>
                        <SessionsTab v-if="dashboard.nav.currentTab == 'Sessions'" />
                        <CalendarTab v-else-if="dashboard.nav.currentTab == 'Calendar'" />
                        <NotificationsTab v-else-if="dashboard.nav.currentTab == 'Notifications'" />
                        <AuditLogTab v-else-if="dashboard.nav.currentTab == 'AuditLog'" />
                    </KeepAlive>
                </Transition>


            </div>
        </Transition>

        <!-- Dialogs/Forms -->
        <SessionForm />

    </div>





</template>


<style scoped></style>