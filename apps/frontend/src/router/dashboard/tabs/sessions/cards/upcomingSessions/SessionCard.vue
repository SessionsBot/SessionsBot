<script lang="ts" setup>
    import type { Database } from '@sessionsbot/shared';


    // Incoming Props:
    const props = defineProps<{
        session: Database['public']['Tables']['sessions']['Row'] | undefined
    }>()

</script>


<template>
    <div class="flex justify-center items-center">
        {{ session?.title || 'TITLE - SESSION' }}
    </div>
</template>


<style scoped></style>