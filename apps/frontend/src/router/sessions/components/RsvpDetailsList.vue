<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { RegExp_DiscordEmojiId, type FullSessionData } from '@sessionsbot/shared';
    import RsvpDetailsDialog from './RsvpDetailsDialog.vue';

    // Incoming Props:
    const props = defineProps<{
        rsvps: FullSessionData['session_rsvp_slots']
    }>()

    // Services:
    const dashboard = useDashboardStore()

    // Custom Emojis:
    const guildEmojis = computed(() => dashboard.guildData.emojis.state)

    // Rsvp Details Dialog:
    const rsvpDetailsDialogVisible = ref(false)
    const selectedRsvp = ref<FullSessionData['session_rsvp_slots'][number] | undefined>(undefined)
    function viewRsvpDetails(r: FullSessionData['session_rsvp_slots'][number]) {
        selectedRsvp.value = r
        rsvpDetailsDialogVisible.value = true
    }

</script>


<template>
    <div class="flex flex-col gap-1.5 justify-center items-center w-full">

        <!-- Rsvp Item -->
        <div v-for="r in rsvps"
            class="flex flex-row items-center justify-between w-full p-2 gap-2 rounded-md border hover:border-ring-soft/80 hover:bg-bg/10 border-ring-soft/50 bg-black/5">
            <!-- Name & Emoji -->
            <span class="flex flex-row items-center flex-wrap gap-2">
                <!-- Emoji -->
                <span v-if="r.emoji">
                    <img v-if="RegExp_DiscordEmojiId.test(r?.emoji)" class="aspect-square size-4.5 rounded-md"
                        :src="guildEmojis?.find(e => e?.value == r?.emoji)?.url || '/discord-grey.png'" />
                    <p v-else>
                        {{ r?.emoji }}
                    </p>
                </span>

                <!-- Name -->
                {{ r?.title ?? '?' }}

                <!-- Capacity -->
                <span
                    class="p-0.5 rounded border border-ring-soft text-xs/snug px-1 pr-0.75 opacity-65 scale-85 relative top-px right-1 flex-center">
                    {{ r?.session_rsvps?.length ?? 0 }}/{{ r?.capacity ?? '?' }}
                </span>
            </span>


            <!-- View Button -->
            <Button @click="viewRsvpDetails(r)" unstyled
                class="button-base aspect-square hover:bg-text-2/7 group p-1 active:scale-95">
                <Iconify icon="mdi:eye-outline" size="20" class="opacity-50 group-hover:opacity-80 transition-all" />
            </Button>
        </div>

        <!-- Rsvps DFdetails Dialog -->
        <RsvpDetailsDialog v-model:visible="rsvpDetailsDialogVisible" :selected-rsvp />

    </div>
</template>


<style scoped></style>