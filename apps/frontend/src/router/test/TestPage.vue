<script lang="ts" setup>
    import DiscordEditor1 from './DiscordEditor1.vue';
    import DiscordEditor2 from './DiscordEditor/DiscordEditor.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';

    const dashboard = useDashboardStore()

</script>


<template>
    <div class="flex flex-col justify-center items-center content-center p-5 grow bg-emerald-500/0 w-full h-full">

        <!-- <DiscordEditor1 /> -->
        <DiscordEditor2 hidden />

        {{ dashboard.guildId || 'NULL ID' }}

        <Button @click="dashboard.guildId = '1379160686629880028'">
            Set ID
        </Button>

        <Button @click="dashboard.guildId = null">
            NULL ID
        </Button>

        {{ dashboard.guildData.channels }}

    </div>
</template>


<style scoped></style>