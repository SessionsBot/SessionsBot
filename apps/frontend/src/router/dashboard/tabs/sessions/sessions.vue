<script lang="ts" setup>
    import { API } from '@/utils/api';
    import { supabase } from '@/utils/supabase';
    import { ArrowBigDownIcon } from 'lucide-vue-next';
    import type { API_SessionTemplateBodyInterface, Database } from '@sessionsbot/shared';
    import UpcomingSessionsCard from './cards/upcomingSessions.vue'
    import type { UseAsyncStateReturn } from '@vueuse/core';

    // Define Props:
    const props = defineProps<{
        guildId: string | undefined
        sessionTemplates: Database['public']['Tables']['session_templates']['Row'][] | undefined
    }>();


</script>


<template>
    <div class="flex h-full! w-full grow flex-col justify-center items-center flex-1">

        <!-- Upcoming Sessions Card -->
        <UpcomingSessionsCard :sessionTemplates />

    </div>
</template>


<style scoped></style>