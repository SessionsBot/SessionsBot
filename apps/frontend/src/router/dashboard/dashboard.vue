<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import SelectServer from './selectServer.vue';
    import ServerDashboard from './serverDashboard.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';

    const dashboard = useDashboardStore();
    const selectedGuildId = computed(() => dashboard.guild.id);

    // ON - Initial Full Page Mount:
    onMounted(() => {
        // Load Saved "Guild Selection":
        const choice = dashboard.saveGuildSelection.get();
        if (choice) dashboard.guild.id = choice;
    })

</script>


<template>
    <div class="flex flex-col w-full h-full flex-1 items-center"
        :class="{ 'max-w-screen! max-h-screen! overflow-clip!': dashboard.scrollLock }">
        <Transition name="zoom" mode="out-in">
            <SelectServer v-if="!selectedGuildId" />
            <ServerDashboard v-else />
        </Transition>
    </div>

</template>


<style scoped></style>