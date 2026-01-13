<script setup lang="ts">
    import type { Component } from 'vue';
    import useDashboardStore, { type DashboardTabName } from '@/stores/dashboard/dashboard';


    // Define Props:
    const props = defineProps<{
        name: DashboardTabName,
        icon: Component,
        closeNav: () => void
    }>();
    const isExpanded = computed(() => dashboard.nav.expanded)

    // Services:
    const dashboard = useDashboardStore();

    // Is Active Tab - Boolean
    const isActiveTab = computed(() => dashboard.nav.currentTab == props.name)


</script>

<template>
    <Button unstyled :title="props.name" @click="dashboard.nav.currentTab = props.name, props.closeNav()"
        class="flex flex-row w-full min-w-fit! flex-nowrap justify-center items-center gap-0.75 rounded-sm hover:bg-white/15 bg-white/5 transition-all cursor-pointer"
        :class="{
            'bg-indigo-400/30!': isActiveTab,
            'p-1 px-1.5 justify-start!': isExpanded,
            'size-8! p-0.5!': !isExpanded
        }">
        <div>
            <component :is="icon" />
        </div>

        <p v-if="isExpanded" class="font-Nunito relative top-px"> {{ props.name }} </p>
    </Button>
</template>
