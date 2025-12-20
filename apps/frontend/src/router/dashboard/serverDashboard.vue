<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import { useNavStore } from '@/stores/nav';
    import { API } from '@/utils/api';
    import type { APIResponseValue } from '@sessionsbot/shared';
    import { BellRingIcon, CalendarDaysIcon, ClipboardListIcon, UserCheckIcon } from 'lucide-vue-next';
    import dashboardNavButton from './components/dashboardNavButton.vue'
    import SessionsTab from './tabs/sessions.vue';
    import CalendarTab from './tabs/calendar.vue'

    import SessionForm from './components/sessionForm/sesForm.vue'


    // Define Incoming Props:
    const props = defineProps<{
        selectedGuildId: string | undefined
    }>()

    // Window Size:
    const { width: screenWidth } = useWindowSize();
    const isSmallScreen = computed(() => screenWidth.value < 640)

    // Services:
    const auth = useAuthStore();
    const nav = useNavStore();


    // Guild Data:
    const userGuildData = computed(() => {
        if (!props.selectedGuildId) return null;
        return auth.userData?.guilds.manageable.find((g) => (g.id == props.selectedGuildId))
    })
    // Guild Channels:
    const guildChannels = ref<{ sendable: any, all: any } | null>(null);
    async function getGuildChannels() {
        const { data: ChannelsResult } = await API.get<APIResponseValue>(`/guilds/${props.selectedGuildId}/channels`, { headers: { Authorization: `Bearer ${auth?.session?.access_token}` } })
        if (!ChannelsResult?.success) {
            return guildChannels.value = null;
        } else {
            return guildChannels.value = ChannelsResult.data as any;
        }
    }

    // Tab Viewing:
    export type DashboardTabName = 'Sessions' | 'Calendar' | 'Notifications' | 'Subscription';
    const currentTab = ref<DashboardTabName>('Sessions');
    function openTab(tab: DashboardTabName) { currentTab.value = tab };


    // SessionForm Panel Visibility:
    const sessionsFormVisible = ref(false);
    provide('sessionsFormVisible', sessionsFormVisible)


    // Before Mount:
    onBeforeMount(async () => {
        // Load Channels:
        await getGuildChannels();
    })

</script>


<template>
    <!-- Main Page Content -->
    <div class="flex flex-row flex-1 w-full h-full" :class="{ 'flex-col!': isSmallScreen }">

        <nav
            class="flex flex-col min-w-11 sm:min-w-min! bg-zinc-900 sm:border-r-2 sm:border-b-0 border-ring/30 border-b-2">
            <div class="flex flex-col p-3 gap-2 grow"
                :class="{ 'flex-row! items-center justify-center p-1 gap-1': isSmallScreen }">
                <dashboardNavButton name="Sessions" :icon="ClipboardListIcon" :isSmallScreen @openTab="openTab" />
                <dashboardNavButton name="Calendar" :icon="CalendarDaysIcon" :isSmallScreen @openTab="openTab" />
                <dashboardNavButton name="Notifications" :icon="BellRingIcon" :isSmallScreen @openTab="openTab" />
                <dashboardNavButton name="Subscription" :icon="UserCheckIcon" :isSmallScreen @openTab="openTab" />
            </div>
            <div class="hidden sm:flex gap-1 p-1 items-center justify-center">
                <p class="text-sm text-white/70 hover:text-sky-400/80 hover:underline cursor-pointer">
                    Need Help?
                </p>
            </div>
        </nav>

        <div class="flex w-full flex-col grow bg-white/2.5">
            <SessionsTab v-if="currentTab == 'Sessions'" :guildId="selectedGuildId" />
            <CalendarTab v-if="currentTab == 'Calendar'" />
        </div>
    </div>

    <!-- Dialogs/Forms -->
    <SessionForm :sessions-form-visible="sessionsFormVisible" :guildId="selectedGuildId" :guildChannels />

</template>


<style scoped></style>