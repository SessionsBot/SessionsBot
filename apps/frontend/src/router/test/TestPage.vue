<script lang="ts" setup>
    import DiscordEditor1 from './DiscordEditor1.vue';
    import DiscordEditor2 from './DiscordEditor/DiscordEditor.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { externalUrls, useNavStore } from '@/stores/nav';
    import { ExternalLink } from 'lucide-vue-next';

    const nav = useNavStore();

    const systemStatus = computed(() => nav.systemStatus)

    const statusLevel = computed(() => {
        // Status Fetch Error
        if (systemStatus.value.error) return { color: 'bg-purple-500', text: 'UNKNOWN Status' };

        const upMonitors = systemStatus.value.state?.data.data?.up;
        const downMonitors = systemStatus.value.state?.data.data?.down;
        // Maintenance Ongoing:
        if (upMonitors?.some(m => m.status?.toLowerCase()?.includes('maintenance')) || downMonitors?.some(m => m.status?.toLowerCase()?.includes('maintenance'))) return {
            color: 'bg-sky-500', text: 'System Maintenance'
        }

        // If BACKEND is Down:
        if (downMonitors?.some(m => m.name?.toLowerCase()?.includes('backend') && m.status.includes('down'))) return {
            color: 'bg-red-500', text: 'MAJOR Outage'
        }

        // If ANY Monitor is Down:
        if (downMonitors?.some(m => m.status.toLowerCase()?.includes('down'))) return {
            color: 'bg-red-400', text: 'System(s) Down'
        }

        // If ANY Monitor is Degraded:
        if (downMonitors?.some(m => m.status.toLowerCase()?.includes('degraded'))) return {
            color: 'bg-amber-400', text: 'System(s) Degraded'
        }

        // Passed ALL Checks - Operational
        return {
            color: 'bg-emerald-400', text: "All Systems Online"
        }
    })


</script>


<template>
    <div class="flex flex-col justify-center items-center content-center p-5 grow bg-emerald-500/0 w-full h-full">


        <DiscordEditor2 hidden />

        <!-- Status Indicator -->
        <a :href="externalUrls.statusPage" target="_blank">
            <div
                class="bg-surface active:scale-95 transition-all border-2 select-none cursor-pointer border-ring rounded-lg p-2 gap-2 flex flex-row items-center justify-start flex-nowrap overflow-auto">

                <!-- Status - Color -->
                <span :class="statusLevel.color || ''"
                    class="h-3.5 p-0.5 transition-all aspect-square rounded-full border-2 border-ring animate-pulse">
                </span>

                <!-- Text -->
                <p class="font-extrabold text-sm text-white/85">
                    {{ statusLevel.text || 'Loading...' }}
                </p>

                <!-- External Icon -->
                <ExternalLink class="aspect-square! w-fit! size-3! opacity-50" :stroke-width="2.5" />

            </div>
        </a>

    </div>
</template>


<style scoped></style>