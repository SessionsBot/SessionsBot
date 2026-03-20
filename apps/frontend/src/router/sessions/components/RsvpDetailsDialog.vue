<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { RegExp_DiscordEmojiId, type FullSessionData } from '@sessionsbot/shared';
    import { XIcon } from 'lucide-vue-next';


    // Incoming Props:
    const props = defineProps<{
        selectedRsvp: FullSessionData['session_rsvp_slots'][number] | undefined
    }>()
    const visible = defineModel<boolean>('visible');
    const r = computed(() => props.selectedRsvp)

    // Services:
    const dashboard = useDashboardStore();

</script>


<template>
    <Dialog :visible class="border-2! border-ring-soft! w-[90%] max-w-95!" modal block-scroll>
        <template #container="{ }">
            <!-- header -->
            <div class="flex flex-row items-center justify-between gap-2 p-2 border-b-2 border-ring-soft">
                <span class="flex-center gap-1">
                    <Iconify icon="mdi:user-check" />
                    <p class="font-bold text-lg">
                        Rsvp Details
                    </p>
                </span>
                <!-- Close button -->
                <Button title="Close Details" @click="visible = false" unstyled
                    class="aspect-square group border border-ring-soft active:scale-95 cursor-pointer rounded">
                    <XIcon class="opacity-50 scale-95 group-hover:opacity-75" />
                </Button>
            </div>
            <!-- content -->
            <div class="flex flex-center flex-col gap-2 w-full p-2">

                <!-- Title & Emoji -->
                <div class="flex flex-center flex-row gap-1.75 w-full">
                    <!-- Emoji -->
                    <div class="text-lg" v-if="r?.emoji">
                        <!-- Custom -->
                        <img v-if="RegExp_DiscordEmojiId.test(r?.emoji)" class="size-5 rounded"
                            :src="dashboard.guildData.emojis?.state?.find((e) => e.value == r?.emoji)?.url || '/discord-grey.png'" />
                        <!-- Native -->
                        <p v-else>
                            {{ r?.emoji }}
                        </p>
                    </div>
                    <!-- Title -->
                    <p class="text-xl font-bold">
                        {{ r?.title || '?' }}
                    </p>
                </div>

                <div class="bg-ring-soft opacity-70 w-27 h-0.75 rounded-full" />

                <!-- Assigned Users List -->
                <span class="flex flex-row items-center w-full gap-1">
                    <Iconify icon="mdi:user" size="18" />
                    <p class="font-bold text-sm">
                        Assigned Users
                    </p>
                </span>
                <div v-if="r?.session_rsvps?.length" v-for="user in r?.session_rsvps">
                    {{ user?.user_id }}
                </div>
                <div v-else class="bg-bg-3 border border-ring-soft p-2 rounded-md">
                    <p class="text-xs font-bold opacity-75 italic">
                        No Users Assigned Yet..
                    </p>

                </div>

            </div>
            <!-- footer -->
            <div class="flex items-center justify-center p-2 border-t-2 border-ring-soft">
                <p class="w-full text-center italic text-xs opacity-50">
                    footer here
                </p>
            </div>
        </template>
    </Dialog>
</template>


<style scoped></style>