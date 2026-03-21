<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import type { API_DiscordUserIdentity } from '@sessionsbot/shared';

    // Incoming Props:
    const props = defineProps<{
        userId: string
    }>()

    // Services:
    const dashboard = useDashboardStore();

    const user = computedAsync(async () => {
        const unknown = <API_DiscordUserIdentity>{ bot: false, username: 'UNKNOWN', avatarUrl: '/discord-grey.png', displayName: 'UNKNOWN' }
        const i = await dashboard.discordIdentities.user.get(props?.userId)
        if (!i) return unknown
        else return i
    })
</script>


<template>
    <div class="bg-bg-3/70 border border-ring-soft p-2 rounded-md max-w-full w-fit relative">
        <div class="flex group flex-row gap-1 justify-center items-center">
            <img :src="user?.avatarUrl" class="aspect-square size-5 rounded border border-ring-soft">
            <p class="text-sm font-bold max-w-[75%] opacity-75 italic truncate">
                {{ user?.username }}
            </p>
        </div>
    </div>

</template>


<style scoped></style>