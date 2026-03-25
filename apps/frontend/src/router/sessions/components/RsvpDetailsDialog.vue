<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { RegExp_DiscordEmojiId, type FullSessionData } from '@sessionsbot/shared';
    import { XIcon } from 'lucide-vue-next';
    import RsvpUserCard from './RsvpUserCard.vue';


    // Incoming Props:
    const props = defineProps<{
        selectedRsvp: FullSessionData['session_rsvp_slots'][number] | undefined
    }>()
    const visible = defineModel<boolean>('visible');
    const r = computed(() => props.selectedRsvp)

    // Services:
    const dashboard = useDashboardStore();

    const hasRoleData = computed(() =>
        dashboard.guildId == r.value?.guild_id
        && dashboard.guildData.roles.state != null
    )
    const resolveRoleName = (roleId: string) => {
        return dashboard.guildData.roles?.state?.find(r => r?.id == roleId)
    }

</script>


<template>
    <Dialog :visible class="border-2! border-ring-soft! w-[90%] max-w-95! overflow-auto" modal block-scroll>
        <template #container>

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
                    <XIcon class="opacity-50 scale-90 group-hover:opacity-75 transition-all" />
                </Button>
            </div>

            <!-- content -->
            <div class="flex justify-center flex-col gap-2 w-full p-2 pb-4">

                <!-- Title & Emoji -->
                <div
                    class="flex flex-center flex-row gap-1.75 mt-1 w-fit self-center bg-bg-3/70 border border-ring-soft p-1 px-2.5 rounded-md">
                    <!-- Emoji -->
                    <div class="text-lg" v-if="r?.emoji">
                        <!-- Custom -->
                        <img title="Custom Emoji" v-if="RegExp_DiscordEmojiId.test(r?.emoji)" class="size-5 rounded"
                            :src="dashboard.guildData.emojis?.state?.find((e) => e.value == r?.emoji)?.url || '/discord-grey.png'" />
                        <!-- Native -->
                        <p v-else>
                            {{ r?.emoji }}
                        </p>
                    </div>
                    <!-- Title -->
                    <p class="text-2xl font-bold">
                        {{ r?.title || '?' }}
                    </p>
                </div>

                <div hidden class="bg-ring-soft opacity-70 w-27 h-0.75 rounded-full" />

                <!-- Assigned Users List -->
                <span class="flex flex-row items-center w-full gap-1 opacity-65">
                    <Iconify icon="mdi:user" size="18" />
                    <p class="font-bold text-xs">
                        Assigned Users:
                    </p>
                </span>

                <span class="flex gap-1 flex-wrap mr-0.75 ml-2.75">
                    <!-- Users Card(s) -->
                    <RsvpUserCard v-if="r?.session_rsvps?.length" v-for="user in r?.session_rsvps"
                        :key="'user_' + user?.id" :userId="user?.user_id" />
                    <!-- No Users -->
                    <span v-if="!r?.roles_required?.length"
                        class="font-bold italic bg-bg-3/70 border border-ring-soft p-1 px-1.5 rounded-md">
                        <!-- None Required -->
                        <p class="opacity-75 text-xs/snug">
                            No User Assigned
                        </p>
                    </span>
                </span>

                <!-- Capacity Info -->
                <span class="flex flex-row items-center w-full gap-1 opacity-65">
                    <Iconify icon="mdi:user" size="18" />
                    <p class="font-bold text-xs">
                        Capacity:
                    </p>
                </span>
                <span
                    class="w-fit self-start ml-2.75 font-bold italic bg-bg-3/70 border border-ring-soft p-1 px-1.5 rounded-md">
                    <p class="opacity-75 text-xs/snug">
                        {{ r?.session_rsvps?.length ?? 0 }} / {{ r?.capacity ?? '?' }} Users
                    </p>
                </span>


                <!-- Required Roles -->
                <span class="flex flex-row items-center w-full gap-1 opacity-65">
                    <Iconify icon="mdi:lock" size="18" />
                    <p class="font-bold text-xs">
                        Required Roles:
                    </p>
                </span>
                <span
                    class="w-fit self-start ml-2.75 font-bold italic bg-bg-3/70 border border-ring-soft p-1 px-1.5 rounded-md">
                    <p v-if="hasRoleData" v-for="role in r?.roles_required" :key="'role_' + role"
                        class="opacity-75 text-xs/snug">
                        - {{ resolveRoleName(role)?.name ?? `<${role}>` }}
                    </p>
                    <p v-else class="opacity-75 text-xs/snug">
                        {{ r?.roles_required?.length ?? 0 }} Roles Required
                    </p>
                    <!-- None Required -->
                    <p v-if="!r?.roles_required?.length" class="opacity-75 text-xs/snug">
                        No Roles Required
                    </p>
                </span>

            </div>

            <!-- footer -->
            <div hidden class="flex items-center justify-center p-2 border-t-2 border-ring-soft">
                <p class="w-full text-center italic text-xs opacity-50">
                    footer here
                </p>
            </div>

        </template>
    </Dialog>
</template>


<style scoped></style>