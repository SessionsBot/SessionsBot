<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import SessionForm from '../components/sessionForm/sesForm.vue';
    import SessionsTab from './sessions/sessionsTab.vue';
    import CalendarTab from './calendar/calendarTab.vue';
    import AuditLogTab from './auditLog/auditLogTab.vue';
    import NotificationsTab from './notifications/notificationsTab.vue';
    import { useAuthStore } from '@/stores/auth';

    // Services:
    // const auth = useAuthStore();
    const dashboard = useDashboardStore();

</script>


<template>
    <div class="flex flex-col grow items-center justify-center flex-1 w-full h-full">
        <Transition name="slide" :duration="0.5" mode="out-in">
            <!-- Loading Content - Modal -->
            <div v-if="!dashboard.guild.dataReady"
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