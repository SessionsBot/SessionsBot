<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import SessionForm from './components/sessionForm/sesForm.vue';
    import SessionsTab from './tabs/sessions/sessionsTab.vue';
    import CalendarTab from './tabs/calendar/calendarTab.vue';
    import AuditLogTab from './tabs/auditLog/auditLogTab.vue';
    import NotificationsTab from './tabs/notifications/notificationsTab.vue';
    import PreferencesTab from './tabs/preferences/preferencesTab.vue';

    // Services:
    const dashboard = useDashboardStore();
    const currentTab = computed(() => dashboard.nav.currentTab)

    const activeTabComponent = computed(() => {
        switch (true) {
            case currentTab.value == 'Sessions':
                return SessionsTab
            case currentTab.value == 'Calendar':
                return CalendarTab
            case currentTab.value == 'AuditLog':
                return AuditLogTab
            case currentTab.value == 'Preferences':
                return PreferencesTab
            default:
                return SessionsTab
        }
    })

</script>


<template>
    <div class="flex relative flex-col grow items-center justify-center flex-1 w-full h-full">

        <Transition name="slide" :duration="0.5" mode="out-in">
            <!-- Loading Content - Modal -->
            <div v-if="!dashboard.guildDataState.initialFetchOk"
                class="flex gap-2 items-center justify-center p-4 bg-bg-2 border-2 border-ring-soft rounded-md shadow-lg">
                <ProgressSpinner />
                <div class="text-text-1/70 p-2 text-center">
                    <p class="font-bold text-lg"> Loading Dashboard </p>
                    <p class="text-xs italic"> Please Wait</p>
                </div>
            </div>


            <!-- Main Page Content -->
            <div v-else
                class="flex flex-row flex-wrap grow w-full! overflow-x-clip overflow-y-auto max-w-full! min-h-fit!">

                <Transition name="dashboard-tab">
                    <component :is="activeTabComponent" />
                </Transition>

            </div>
        </Transition>

        <!-- Dialogs/Forms -->
        <SessionForm />

    </div>





</template>


<style scoped>

    @reference "@/styles/main.css";

    :deep(.dashboard-tab-view) {
        @apply flex !p-5 flex-col flex-wrap !w-full !max-w-full !min-h-fit grow flex-1 justify-start items-center content-center;
    }

    /* Dashboard Tab - Animation */
    .dashboard-tab-enter-from {
        transform: translate(40px);
        opacity: 0;
    }

    .dashboard-tab-enter-to,
    .dashboard-tab-leave-from {
        transform: translate(0px);
        opacity: 1;
    }

    .dashboard-tab-leave-to {
        transform: translate(-40px);
        opacity: 0;
    }

    .dashboard-tab-enter-active {
        transition: all .33s ease .33s;
    }

    .dashboard-tab-leave-active {
        transition: all .33s ease;
        position: absolute;
    }

</style>