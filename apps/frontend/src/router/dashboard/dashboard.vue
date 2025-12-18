<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import SelectServer from './selectServer.vue';
    import ServerDashboard from './serverDashboard.vue';

    const selectedGuildId = ref<string>()

</script>


<template>
    <main class="justify-center items-center">

        <SelectServer v-if="!selectedGuildId" @selectServer="(id) => selectedGuildId = id" />

        <ServerDashboard v-else-if="selectedGuildId" :selectedGuildId />

    </main>
</template>


<style scoped></style>