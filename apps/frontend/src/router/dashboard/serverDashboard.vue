<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import { useNavStore } from '@/stores/nav';
    import type { API_SessionTemplateBodyInterface } from '@sessionsbot/shared';
    import SessionsTab from './tabs/sessions/sessions.vue';
    import CalendarTab from './tabs/calendar.vue'
    import SessionForm from './components/sessionForm/sesForm.vue'
    import DashboardNav from './components/nav/dashboardNav.vue'
    import { supabase } from '@/utils/supabase';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { useGuildChannels } from '@/stores/dashboard/guildChannels';
    import { useSessionTemplates } from '@/stores/dashboard/sessionTemplates';
    import { useGuildRoles } from '@/stores/dashboard/guildRoles';
    import { useGuildSubscription } from '@/stores/dashboard/guildSubscription';

    // Services:
    const dashboard = useDashboardStore();

    // Guild - Selected Id:
    const selectedGuildId = computed(() => dashboard.guild.id)
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
            <div v-else class="flex flex-row grow w-full h-full">

                <!-- Nav Menu(s) -->
                <DashboardNav />

                <!-- Content/Tab View Area -->
                <div class="flex overflow-y-scroll w-full h-full flex-col grow">
                    <SessionsTab v-if="dashboard.nav.currentTab == 'Sessions'" />
                    <CalendarTab v-if="dashboard.nav.currentTab == 'Calendar'" />
                </div>

            </div>
        </Transition>

        <!-- Dialogs/Forms -->
        <SessionForm />

    </div>





</template>


<style scoped></style>