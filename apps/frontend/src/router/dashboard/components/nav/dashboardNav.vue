<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import ServerDetails from './serverDetails.vue';
    import { HelpCircle } from 'lucide-vue-next';
    import DiscordLogo from '/discord-grey.png'
    import { useAuthStore } from '@/stores/auth';


    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore();

    // Compute - Is Small Screen:
    const { width } = useWindowSize()
    const isSmallScreen = computed(() => width.value < 640)

    // const userGuildData = computed(() => dashboard.userGuildData)
    const userGuildData = computed(() => { return dashboard.userGuildData })


    // Compute - Is Nav Expanded (from store):
    const navExpanded = computed(() => dashboard.nav.expanded)

</script>


<template>
    <Transition name="fade">
        <div v-if="navExpanded && isSmallScreen" @click="dashboard.nav.expanded = false;"
            class="z-2 bg-black/70 w-full h-full absolute" />
    </Transition>

    <aside
        class="w-15 min-w-15 z-4 bg-zinc-900 ring-2 ring-ring/80 relative h-full flex flex-col overflow-x-clip overflow-y-auto"
        :class="{
            'expanded': navExpanded,
            'small-screen': isSmallScreen
        }">

        <!-- Nav Header -->
        <div class="p-2 w-full! h-fit flex flex-row gap-1 items-center justify-center">
            <p v-if="navExpanded" class="font-black grow text-[13px] uppercase text-nowrap">
                Bot Dashboard
            </p>

            <!-- Expander Button -->
            <Button :title="navExpanded ? 'Fold Nav' : 'Expand Nav'" unstyled
                @click="dashboard.nav.expanded = !dashboard.nav.expanded"
                class="size-8 aspect-square rounded-md hover:bg-zinc-600/50 active:scale-95 cursor-pointer transition-all flex items-center justify-center">
                <iconify-icon icon="proicons:panel-right-expand" height="29" width="29"
                    class="transition-all rotate-180 text-white/40" :class="{ 'rotate-0!': navExpanded }" />
            </Button>
        </div>

        <!-- Selected Server - Details PopOver -->
        <div class="flex pt-1 flex-col w-full h-fit items-center justify-center">
            <p v-if="navExpanded" class=" px-1.5 text-xs uppercase font-black text-white/50 w-full pb-1.5">
                Server
            </p>
            <ServerDetails>
                <template #default="{ togglePopOver }">

                    <Button unstyled @click="togglePopOver"
                        class="bg-white/5 mx-2.5! ring-2 ring-ring hover:ring-white/40 cursor-pointer rounded-md gap-2 p-1.75 h-9 flex flex-row items-center justify-start transition-all overflow-clip"
                        :class="{ 'aspect-square': !navExpanded }">

                        <img class="h-[95%]! aspect-square! rounded-full ring-2 ring-ring"
                            :src="userGuildData?.icon || DiscordLogo" />
                        <p v-if="navExpanded" class="font-bold text-nowrap text-sm">
                            {{ userGuildData?.name || 'Select a Server' }}
                        </p>

                    </Button>
                </template>
            </ServerDetails>
        </div>

        <!-- Dashboard Tab View(s) -->
        <div class="pt-4 flex grow flex-col items-center justify-start bg-emerald-700/0 w-full h-full">

            <p v-if="navExpanded" class=" px-1.5 text-xs uppercase font-black text-white/50 w-full pb-1.5">
                Views
            </p>

            <!-- Sessions Tab -->
            <Button title="Sessions" unstyled class="tab-view-button border-t"
                @click="dashboard.nav.currentTab = 'Sessions'" :class="{
                    'expanded': navExpanded,
                    'selected': dashboard.nav.currentTab == 'Sessions'
                }">
                <div class="w-fit h-full aspect-square">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="m9.981 14.811l-.467 2.726l2.449-1.287l2.449 1.287l-.468-2.726l1.982-1.932l-2.738-.398L11.963 10l-1.225 2.481L8 12.879z" />
                        <path fill="currentColor"
                            d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2m.002 16H5V8h14z" />
                    </svg>
                </div>

                <p v-if="navExpanded" class="font-semibold"> Sessions </p>
            </Button>

            <!-- Calendar Tab -->
            <Button title="Calendar" unstyled class="tab-view-button" @click="dashboard.nav.currentTab = 'Calendar'"
                :class="{
                    'expanded': navExpanded,
                    'selected': dashboard.nav.currentTab == 'Calendar'
                }">
                <div class="w-fit h-full aspect-square">
                    <svg class="size-5.5! transition-none!" xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                        viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                            stroke-width="2">
                            <path d="M11.795 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
                            <path d="M14 18a4 4 0 1 0 8 0a4 4 0 1 0-8 0m1-15v4M7 3v4m-4 4h16" />
                            <path d="M18 16.496V18l1 1" />
                        </g>
                    </svg>
                </div>
                <p v-if="navExpanded" class="font-semibold"> Calendar </p>
            </Button>

            <!-- Notifications Tab -->
            <Button hidden title="Notifications" unstyled class="tab-view-button"
                @click="dashboard.nav.currentTab = 'Notifications'" :class="{
                    'expanded': navExpanded,
                    'selected': dashboard.nav.currentTab == 'Notifications'
                }">
                <div class="w-fit h-full aspect-square">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M12 18.5q.625 0 1.063-.437T13.5 17h-3q0 .625.438 1.063T12 18.5M10 14v-3q0-.825.588-1.412T12 9t1.413.588T14 11v3zm2 8q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m-4-4h8q.425 0 .713-.288T17 15t-.288-.712T16 14v-2.6q0-1.525-.788-2.787T13 7v-.5q0-.425-.288-.712T12 5.5t-.712.288T11 6.5V7q-1.425.35-2.212 1.613T8 11.4V14q-.425 0-.712.288T7 15t.288.713T8 16" />
                    </svg>
                </div>
                <p v-if="navExpanded" class="font-semibold"> Notifications </p>
            </Button>

            <!-- Audit Log Tab -->
            <Button title="Audit Log" unstyled class="tab-view-button" @click="dashboard.nav.currentTab = 'AuditLog'"
                :class="{
                    'expanded': navExpanded,
                    'selected': dashboard.nav.currentTab == 'AuditLog'
                }">
                <div class="w-fit h-full aspect-square">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48">
                        <g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4">
                            <path d="M13 10h28v34H13z" />
                            <path stroke-linecap="round" d="M35 10V4H8a1 1 0 0 0-1 1v33h6m8-16h12m-12 8h12" />
                        </g>
                    </svg>
                </div>
                <p v-if="navExpanded" class="font-semibold text-nowrap"> Audit Log </p>
            </Button>

            <!-- Preferences Tab -->
            <Button title="Audit Log" unstyled class="tab-view-button" @click="dashboard.nav.currentTab = 'Preferences'"
                :class="{
                    'expanded': navExpanded,
                    'selected': dashboard.nav.currentTab == 'Preferences'
                }">
                <div class="w-fit h-full aspect-square">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M14 21h-4l-.551-2.48a7 7 0 0 1-1.819-1.05l-2.424.763l-2-3.464l1.872-1.718a7 7 0 0 1 0-2.1L3.206 9.232l2-3.464l2.424.763A7 7 0 0 1 9.45 5.48L10 3h4l.551 2.48a7 7 0 0 1 1.819 1.05l2.424-.763l2 3.464l-1.872 1.718a7 7 0 0 1 0 2.1l1.872 1.718l-2 3.464l-2.424-.763a7 7 0 0 1-1.819 1.052z" />
                            <circle cx="12" cy="12" r="3" />
                        </g>
                    </svg>
                </div>
                <p v-if="navExpanded" class="font-semibold text-nowrap"> Preferences </p>
            </Button>

        </div>

        <!-- Nav Footer - Help & Feedback Links -->
        <div class="flex text-white/40 gap-1 flex-col flex-nowrap w-full h-fit p-2 items-center justify-center">


            <!-- Get Support - Button -->
            <RouterLink to="/support">
                <div title="Get Support"
                    class="flex flex-row items-center justify-center gap-1 p-1 py-0.5 cursor-pointer rounded-sm hover:bg-white/5 hover:ring-ring ring-2 ring-transparent active:scale-95"
                    :class="{ 'aspect-square': !navExpanded }">
                    <HelpCircle class="size-fit!" :size="17" />
                    <p v-if="navExpanded" class="text-sm font-medium text-nowrap">
                        Get Support
                    </p>
                </div>
            </RouterLink>

            <!-- Give Feedback - Button -->
            <RouterLink to="/feedback">
                <div title="Give Feedback"
                    class="flex flex-row items-center justify-center gap-1 p-1 py-0.5 cursor-pointer rounded-sm hover:bg-white/5 hover:ring-ring ring-2 ring-transparent active:scale-95"
                    :class="{ 'aspect-square': !navExpanded }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 20 20">
                        <path fill="currentColor"
                            d="M8.5 2a1.5 1.5 0 0 0-1.415 1H5.5A1.5 1.5 0 0 0 4 4.5v12A1.5 1.5 0 0 0 5.5 18h2.503a2 2 0 0 1 .054-.347L8.221 17H5.5a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5h1.585A1.5 1.5 0 0 0 8.5 5h3a1.5 1.5 0 0 0 1.415-1H14.5a.5.5 0 0 1 .5.5v4.732c.32-.137.659-.213 1-.229V4.5A1.5 1.5 0 0 0 14.5 3h-1.585A1.5 1.5 0 0 0 11.5 2zM8 3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m1.98 11.877l4.83-4.83a1.87 1.87 0 1 1 2.644 2.646l-4.83 4.829a2.2 2.2 0 0 1-1.02.578l-1.498.374a.89.89 0 0 1-1.079-1.078l.375-1.498a2.2 2.2 0 0 1 .578-1.02" />
                    </svg>
                    <p v-if="navExpanded" class="text-sm font-medium text-nowrap">
                        Give Feedback
                    </p>
                </div>
            </RouterLink>



        </div>

    </aside>
</template>


<style scoped>

    @reference "@/styles/main.css";

    /* Nav / Aside Elm Styles  */
    aside {
        @apply transition-all;

        &.expanded {
            @apply !min-w-45;
        }

        &.small-screen {
            @apply !absolute !left-0;
        }
    }

    /* Tab View Button - Styles */
    .tab-view-button {
        @apply flex relative flex-row !border-r-0 !border-r-transparent flex-nowrap gap-1.25 p-1.75 items-center justify-center w-full min-h-fit border-b border-white/40 bg-white/5 cursor-pointer transition-all;

        &:hover {
            @apply ring-white/30 bg-white/12;
        }

        &.expanded {
            @apply justify-start;
        }

        &::after {
            content: '';
            @apply absolute transition-all w-0 h-full z-4 bg-transparent right-0;

        }

        &.selected {
            &::after {
                @apply w-1 bg-emerald-400/80;
            }
        }
    }

</style>