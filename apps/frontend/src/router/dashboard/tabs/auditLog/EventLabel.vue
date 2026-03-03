<script lang="ts" setup>
    import { AuditEvent } from '@sessionsbot/shared';


    // Props - Event Type:
    const props = defineProps<{
        event: AuditEvent
    }>()

    const labelMap: Record<AuditEvent, {
        // name: string,
        emoji: string
    }> = {
        "Bot Added": {
            emoji: 'mdi:plus'
        },
        "Preferences Updated": {
            emoji: 'lucide:settings'
        },
        "RSVP Created": {
            emoji: 'mdi:user-plus-outline'
        },
        "RSVP Deleted": {
            emoji: 'mdi:user-minus-outline'
        },
        "Schedule Created": {
            emoji: 'tabler:calendar-plus'
        },
        "Schedule Deleted": {
            emoji: 'tabler:calendar-x'
        },
        "Schedule Edited": {
            emoji: 'tabler:calendar-cog'
        },
        "Session Canceled": {
            emoji: 'tabler:calendar-down'
        },
        "Session Delayed": {
            emoji: 'tabler:calendar-time'
        },
        "Session Posted": {
            emoji: 'tabler:calendar-bolt'
        }
    }

</script>


<template>

    <!-- Dynamic Label -->
    <div class="flex gap-1 flex-row items-center w-full">
        <Iconify :icon="labelMap[event].emoji" />
        <p class=""> {{ event }} </p>
    </div>

</template>


<style scoped></style>