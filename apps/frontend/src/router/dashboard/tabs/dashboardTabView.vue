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

    // Services:
    const dashboard = useDashboardStore();

    // Guild - Channels:
    const channels = useGuildChannels();
    // Guild - Roles:
    const roles = useGuildRoles();
    // Guild - Session Templates:
    const subscription = useGuildSubscription()
    // Guild - Session Templates:
    const templates = useSessionTemplates()

    // Data Ready - Flag:
    const allDataReady = computed(() => {
        const checks = [
            channels.isReady,
            roles.isReady,
            templates.isReady,
            subscription.isReady
        ];
        return checks.every((s) => s.value == true)
    })


</script>


<template>
    <div class="flex flex-col grow items-center justify-center flex-1 w-full h-full">
        <Transition name="slide" :duration="0.5" mode="out-in">
            <!-- Loading Content - Modal -->
            <div v-if="!allDataReady"
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