<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import SelectServer from './selectServer.vue';
    import ServerDashboard from './serverDashboard.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';

    const dashboard = useDashboardStore();
    const selectedGuildId = computed(() => dashboard.guild.id);

</script>


<template>
    <div class="flex flex-col w-full h-full flex-1 items-center">
        <Transition name="zoom" :duration="2" mode="out-in" leaveToClass="zoomDashboardOut">
            <SelectServer v-if="!selectedGuildId" />
            <ServerDashboard v-else />
        </Transition>
    </div>

</template>


<style scoped>

    .zoomDashboardOut {
        scale: 0;
        background: red
    }

</style>