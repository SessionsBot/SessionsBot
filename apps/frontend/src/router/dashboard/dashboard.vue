<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    // import type { UserGuildData, UserGuilds } from '@sessionsbot/shared';

    // Services:
    const auth = useAuthStore();

    // User Data:
    const availableGuilds = computed(() => {
        return auth.user?.user_metadata?.guilds;
    })

    // Guild Data:
    const selectedGuild = ref<string>();


</script>


<template>
    <main class="justify-center items-center">
        <p>

        </p>
    </main>
</template>


<style scoped></style>