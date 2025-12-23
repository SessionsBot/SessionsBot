<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import { useNavStore } from '@/stores/nav';
    import { API } from '@/utils/api';
    import type { API_SessionTemplateBodyInterface, APIResponseValue } from '@sessionsbot/shared';
    import { BellRingIcon, CalendarDaysIcon, ClipboardListIcon, UserCheckIcon } from 'lucide-vue-next';
    import dashboardNavButton from './components/dashboardNavButton.vue'
    import SessionsTab from './tabs/sessions/sessions.vue';
    import CalendarTab from './tabs/calendar.vue'

    import SessionForm from './components/sessionForm/sesForm.vue'
    import type { MaybeElementRef } from '@vueuse/core';
    import { supabase } from '@/utils/supabase';


    // Incoming Props:
    const props = defineProps<{
        selectedGuildId: string | undefined
    }>()

    // Services:
    const auth = useAuthStore();
    const nav = useNavStore();

    // Window Size:
    const { width: screenWidth } = useWindowSize();
    const isSmallScreen = computed(() => screenWidth.value < 640)

    // Guild - From User Data:
    const userGuildData = computed(() => {
        if (!props.selectedGuildId) return null;
        return auth.userData?.guilds.manageable.find((g) => (g.id == props.selectedGuildId))
    })
    // Guild - Channels:
    const { isReady: guildChannelsReady, state: guildChannels } = useAsyncState(async () => {
        const { data: ChannelsResult } = await API.get<APIResponseValue>(`/guilds/${props.selectedGuildId}/channels`, { headers: { Authorization: `Bearer ${auth?.session?.access_token}` } })
        if (!ChannelsResult?.success) {
            return null;
        } else {
            return ChannelsResult.data as { all: any, sendable: any };
        }
    },
        null,
        { immediate: true }
    );
    // Guild - Session Templates:
    const { isReady: sessionTemplatesReady, state: sessionTemplates } = useAsyncState(async () => {
        if (!props.selectedGuildId) throw 'No guild id provided for fetch!';
        const { data, error } = await supabase.from('session_templates')
            .select('*')
            .eq('guild_id', props.selectedGuildId)
            .select()
        if (!data || error) {
            console.error(`Failed to load guild session templates`, error, { data })
            return [];
        }
        else return data;
    },
        undefined,
        { immediate: true }
    )

    // Data Ready - Flag:
    const allDataReady = computed(() => {
        const checks = [guildChannelsReady, sessionTemplatesReady];
        return checks.every((s) => s.value == true)
    })

    // Tab Viewing:
    export type DashboardTabName = 'Sessions' | 'Calendar' | 'Notifications' | 'Subscription';
    const currentTab = ref<DashboardTabName>('Sessions');
    function openTab(tab: DashboardTabName) { currentTab.value = tab };


    // Session Form Panel Visibility:
    const sessionsFormVisible = ref(false);
    const sessionFormRef = ref();
    const startSessionFormEdit = (data: API_SessionTemplateBodyInterface) => {
        sessionFormRef.value?.startNewEdit(data)
    }
    provide('sessionsFormVisible', sessionsFormVisible);
    provide('startSessionFormEdit', startSessionFormEdit);


</script>


<template>
    <div class="flex flex-col items-center justify-center flex-1 w-full h-full">
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
            <div v-else class="flex flex-row flex-1 w-full h-full" :class="{ 'flex-col!': isSmallScreen }">

                <!-- Nav Menu(s) -->
                <nav
                    class="flex flex-col min-w-11 sm:min-w-min! bg-zinc-900 sm:border-r-2 sm:border-b-0 border-ring/30 border-b-2">
                    <aside class="flex flex-col p-3 gap-2 grow"
                        :class="{ 'flex-row! items-center justify-center p-1 gap-1': isSmallScreen }">
                        <dashboardNavButton name="Sessions" :icon="ClipboardListIcon" :isSmallScreen
                            @openTab="openTab" />
                        <dashboardNavButton name="Calendar" :icon="CalendarDaysIcon" :isSmallScreen
                            @openTab="openTab" />
                        <dashboardNavButton name="Notifications" :icon="BellRingIcon" :isSmallScreen
                            @openTab="openTab" />
                        <dashboardNavButton name="Subscription" :icon="UserCheckIcon" :isSmallScreen
                            @openTab="openTab" />
                    </aside>
                    <div class="hidden sm:flex gap-1 p-1 items-center justify-center">
                        <p class="text-sm text-white/70 hover:text-sky-400/80 hover:underline cursor-pointer">
                            Need Help?
                        </p>
                    </div>
                </nav>

                <!-- Content/Tab Area -->
                <div class="flex w-full flex-col grow">
                    <SessionsTab v-if="currentTab == 'Sessions'" :guildId="selectedGuildId" :sessionTemplates />
                    <CalendarTab v-if="currentTab == 'Calendar'" />
                </div>
            </div>
        </Transition>

        <!-- Dialogs/Forms -->
        <SessionForm ref="sessionFormRef" :sessions-form-visible="sessionsFormVisible" :guildId="selectedGuildId"
            :guildChannels />

    </div>





</template>


<style scoped></style>