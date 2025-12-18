<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import SelectServer from './selectServer.vue';
    import ServerDashboard from './serverDashboard.vue';

    const selectedGuildId = ref<string>();

</script>


<template>
    <div class="flex flex-col w-full h-full flex-1 items-center">
        <SelectServer v-if="!selectedGuildId" @selectServer="id => selectedGuildId = id" />
        <ServerDashboard v-else :selectedGuildId="selectedGuildId" />
    </div>

</template>


<style scoped></style>