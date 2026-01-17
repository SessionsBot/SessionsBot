<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import SessionForm from '../components/sessionForm/sesForm.vue';
    import SessionsTab from './sessions/sessionsTab.vue';
    import CalendarTab from './calendar/calendarTab.vue';
    import AuditLogTab from './auditLog/auditLogTab.vue';
    import NotificationsTab from './notifications/notificationsTab.vue';

    // Services:
    const dashboard = useDashboardStore();
    const currentTab = computed(() => dashboard.nav.currentTab)

</script>


<template>
    <div class="flex relative flex-col grow items-center justify-center flex-1 w-full h-full">
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
            <div v-else class="flex flex-row flex-wrap grow w-full! overflow-x-clip overflow-y-auto">

                <TransitionGroup name="slide" type="animation">
                    <KeepAlive key="tab_keep_alive">
                        <SessionsTab v-if="currentTab == 'Sessions'" key="sessions_tab" />
                        <CalendarTab v-else-if="currentTab == 'Calendar'" key="calendar_tab" />
                        <NotificationsTab v-else-if="currentTab == 'Notifications'" key="notifications_tab" />
                        <AuditLogTab v-else-if="currentTab == 'AuditLog'" key="audit_log_tab" />
                        <p v-else class="italic text-sm uppercase font-black"> NO TAB FOUND?
                        </p>
                    </KeepAlive>
                </TransitionGroup>


            </div>
        </Transition>

        <!-- Dialogs/Forms -->
        <SessionForm />

    </div>





</template>


<style scoped></style>