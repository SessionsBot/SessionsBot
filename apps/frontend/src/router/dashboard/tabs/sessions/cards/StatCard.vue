<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';

    // Incoming Props:
    const props = defineProps<{
        title: string,
        value: any,
        iconBackground?: string
    }>()


    // Services:
    const dashboard = useDashboardStore();
    const totalSessions = computed(() => dashboard.guildData.sessions?.state?.length)

</script>


<template>
    <!-- Total Sessions - Card -->
    <div
        class="border-2 bg-surface rounded-md min-h-14 h-fit min-w-fit! w-fit! border-ring flex flex-row content-center items-center justify-center">
        <!-- Icon Area -->
        <div class="m-2.5 mr-0 p-1.75 rounded-full aspect-square! border-4 bg-black/20 border-black/50 h-full min-w-fit flex-1 grow flex items-center justify-center"
            :style="{ backgroundColor: props.iconBackground ?? '' }">
            <slot name="icon">
                <Iconify icon="carbon:unknown" />
            </slot>
        </div>
        <!-- Detail Area -->
        <span class="w-full max-h-full p-1.5 grow flex flex-col gap-0 items-center justify-center">
            <p class="px-2 font-extrabold text-lg">
                {{ props.title || 'STAT_NAME' }}
            </p>
            <p class="w-full text-2xl font-extrabold text-center">
                {{ props.value || '%' }}
            </p>
        </span>
    </div>

</template>
