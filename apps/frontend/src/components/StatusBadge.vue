<script lang="ts" setup>
    import { externalUrls, useNavStore } from '@/stores/nav';
    import { ExternalLink } from 'lucide-vue-next';


    const nav = useNavStore();
    const systemStatus = computed(() => nav.systemStatus)
    const statusLevel = computed(() => {
        // Status Fetch Error
        if (systemStatus.value.error) return { color: 'bg-orange-500', text: 'Status NOT FOUND' };

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

        // Passed ALL Checks - 0 Down Monitors - Operational
        if (downMonitors?.length == 0) return {
            color: 'bg-emerald-400', text: "All Systems Online"
        }

        return null // status unknown?
    })

</script>


<template>

    <!-- Status Indicator -->
    <a :href="externalUrls.statusPage" target="_blank">
        <div
            class="bg-bg-3 active:scale-95 transition-all border-2 select-none cursor-pointer border-ring-soft rounded-lg p-2 gap-2 flex flex-row items-center justify-start flex-nowrap overflow-auto">

            <!-- Status - Color -->
            <span :class="statusLevel?.color || 'border-ring-soft'"
                class="h-3.5 p-0.5 transition-all aspect-square rounded-full border-2 border-ring-soft animate-pulse">
            </span>

            <!-- Text -->
            <p class="font-extrabold text-sm text-text-1/95">
                {{ statusLevel?.text || 'Loading...' }}
            </p>

            <!-- External Icon -->
            <ExternalLink class="aspect-square! w-fit! size-3! opacity-50" :stroke-width="2.5" />

        </div>
    </a>

</template>


<style scoped></style>