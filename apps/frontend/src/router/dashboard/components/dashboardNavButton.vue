<script setup lang="ts">
    import type { Component } from 'vue';
    import type { DashboardTabName } from '../serverDashboard.vue';


    // Define Props:
    const props = defineProps<{
        name: DashboardTabName,
        icon: Component,
        isSmallScreen: boolean
    }>();

    const emits = defineEmits<{
        openTab: [tab: DashboardTabName]
    }>();

</script>

<template>
    <Button unstyled :title="props.name" @click="emits('openTab', props.name)"
        class="flex flex-row flex-nowrap justify-start p-1 px-1.5 gap-0.75 rounded-sm hover:bg-white/15 bg-white/5  transition-all cursor-pointer"
        :class="{ '': isSmallScreen }">
        <component :is="icon" />
        <p v-if="!isSmallScreen" class="font-Nunito relative top-px"> {{ props.name }} </p>
    </Button>
</template>
