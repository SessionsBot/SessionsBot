<script lang="ts" setup>
    import type { Database } from '@sessionsbot/shared';
    import { XIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';

    // Incoming Modals:
    const isVisible = defineModel<boolean>('isVisible');
    const selectedEvent = defineModel<Database['public']['Tables']['audit_logs']['Row'] | null>('selectedEvent')

    // Emit - Close:
    const emits = defineEmits<{
        close: []
    }>()

</script>


<template>
    <Dialog modal block-scroll :draggable="false" v-model:visible="isVisible"
        class="event-details-dialog w-[85%] max-w-120">
        <template #container class="border-ring! border-2! bg-surface flex items-center justify-center">

            <!-- Header -->
            <section class="flex flex-row justify-between items-center p-2 gap-2">
                <p class="font-extrabold p-0.75 text-xl uppercase text-white/80">
                    Event Details
                </p>

                <Button title="Close Details" unstyled @click="$emit('close')"
                    class="hover:bg-zinc-600/40 flex items-center justify-center p-1 rounded-md cursor-pointer transition-all">
                    <XIcon class="min-w-fit opacity-70 aspect-square" />
                </Button>
            </section>

            <!-- Details -->
            <section class="flex items-center justify-center flex-col gap-1.5 p-1">
                <p class="field-name">
                    Event Type
                </p>
                <p class="field-value">
                    {{ selectedEvent?.event_type }}
                </p>
                <p class="field-name">
                    Date Occurred
                </p>
                <p class="field-value">
                    {{ DateTime.fromISO(String(selectedEvent?.created_at))?.toFormat('f') }}
                </p>
                <p class="field-name">
                    META
                </p>
                <p class="field-value">
                    {{ JSON.parse(String(selectedEvent?.event_meta)) || 'NO META'
                    }}
                </p>
            </section>


        </template>
    </Dialog>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .event-details-dialog {
        .field-name {
            @apply bg-black/12 p-0.75 py-px text-sm text-white/70 ring-ring ring-2 rounded w-fit h-fit font-black uppercase
        }

        .field-value {
            @apply italic font-bold text-white/90
        }
    }

</style>