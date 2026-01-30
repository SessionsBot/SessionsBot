<script lang="ts" setup>
    import { BaselineIcon, Clock10Icon, Clock8Icon, ClockIcon, Edit3Icon, FileQuestionMarkIcon, LinkIcon, PlusIcon, TextInitialIcon, Users2Icon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import z, { safeParse } from 'zod'
    import type { NewSessions_FieldNames } from '../../sesForm.vue';
    import RsvpPanel from './rsvpFormPanel.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { useToast } from 'vue-toastification';
    import { SubscriptionLevel } from '@sessionsbot/shared';


    // Incoming Props:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames, value: any) => void
    }>();
    const { invalidFields, validateField } = props;

    // Services:
    const dashboard = useDashboardStore();


    // Subscription - Limits:
    const guildSubscription = computed(() => dashboard.guildData.subscription?.state || SubscriptionLevel.FREE)
    const maxRsvpSlots = computed(() => guildSubscription.value.limits.MAX_RSVP_SLOTS);


    // RSVP Panel Ref:
    const rsvpPanelRef = ref();

    // Form Values/Models:
    const rsvpsEnabled = defineModel<boolean>('rsvpsEnabled')
    const rsvps = defineModel<RsvpSlotFormData[]>('rsvps', { default: [] });

    // Add New - RSVP:
    type RsvpSlotFormData = { name: string, emoji: string, capacity: number, required_roles?: string[] }
    function addNewRsvp(data: { name: string, capacity: number, emoji: string }) {
        rsvps.value.push(data)
    }
    // Edit Existing - RSVP:
    function editExistingRsvp(index: number, data: { name: string, capacity: number, emoji: string }) {
        // return localRsvps.value?.set(rsvpId, data);
        if (rsvps.value) {
            rsvps.value[index] = data;
        }
    }
    // Delete Existing - RSVP:
    function deleteExistingRsvp(index: number) {
        // return localRsvps.value?.delete(rsvpId);
        if (rsvps.value) {
            rsvps.value.splice(index, 1);
        }
    }

    // Rsvp Dialog Panel:
    const rsvpDialogVisible = ref(false);

</script>


<template>
    <main class="flex w-full gap-2.5 justify-start items-start grow flex-col my-5">

        <!-- INPUT: Enable RSVPs Toggle -->
        <div class="flex flex-wrap flex-row gap-1 mb-1 w-full items-center justify-start">
            <ToggleSwitch input-id="rsvpsEnabled" v-model="rsvpsEnabled" class="scale-85" />
            <label for="rsvpsEnabled"> Enable RSVPs / Sign Up </label>
        </div>


        <!-- RSVP Configuration Panel -->
        <Transition name="zoom" :duration=".75" mode="out-in">
            <section v-if="rsvpsEnabled"
                class="flex flex-col flex-wrap overflow-auto  transition-all gap-0 w-full relative rounded-lg border-2 border-ring bg-zinc-800 items-center justify-center">
                <!-- RSVPs List -->
                <div
                    class="flex gap-0 flex-wrap bg-black/25 items-center justify-center content-center flex-col min-w-full min-h-15 border-ring border-b-2">

                    <!-- No RSVPs Added -->
                    <div v-if="(rsvps?.length || 0) <= 0"
                        class=" bg-white/5 gap-0.75 py-2.25 opacity-55 px-4 min-w-full rounded-md flex flex-row  items-center content-center justify-center drop-shadow-md drop-shadow-black">
                        <FileQuestionMarkIcon class="size-5" />
                        <p class="text-sm font-medium"> No RSVPs</p>
                    </div>

                    <!-- Current RSVP Options -->
                    <div v-if="(rsvps?.length || 0) >= 1"
                        class="gap-3 p-4 min-w-full flex flex-wrap items-center justify-center col-1">

                        <!-- RSVP Item Card -->
                        <div v-for="[id, { name, emoji, capacity, required_roles }] in rsvps?.entries()"
                            class="gap-1.25 p-1.25 w-fit flex flex-nowrap flex-col justify-between items-center bg-white/5 ring-ring ring-2 rounded-md">

                            <!-- RSVP Data -->
                            <div class="bg-white/5 p-1 px-1.75 rounded-md flex gap-0 flex-col items-center">
                                <p class="text-wrap text-center font-semibold">{{ emoji }} {{ name }}</p>
                                <div class="h-[3px] w-[90%] mx-2 my-0.5 bg-zinc-400/70 rounded-full" />
                                <span class="flex flex-row gap-1 items-center justify-center">
                                    <Users2Icon :size="15" />
                                    <p class="text-sm"> {{ capacity }} </p>
                                </span>

                            </div>

                            <!-- Edit RSVP Button -->
                            <Button unstyled
                                @click="() => { rsvpPanelRef.startRsvpEdit(id, { name, emoji, capacity, required_roles }) }"
                                class="p-1.25 gap-1 hover:bg-amber-400/10 w-full active:scale-95 rounded-md transition-all cursor-pointer flex flex-row flex-nowrap min-w-fit! items-center justify-center">
                                <p class="text-sm font-bold"> Edit </p>
                                <Edit3Icon :size="15" fill="white" class="relative bottom-px" />
                            </Button>
                        </div>

                    </div>



                </div>

                <!-- Add Rsvp Btn -->
                <Button v-if="rsvps.length < maxRsvpSlots" unstyled :disabled="!rsvpsEnabled"
                    @click="rsvpDialogVisible = !rsvpDialogVisible"
                    class="bg-zinc-600 py-0.75 px-2.25 pl-1.25 my-3 mx-3 rounded-lg transition-all cursor-pointer font-medium hover:bg-zinc-700 flex items-center flex-row">
                    <PlusIcon class="size-5 p-0.5" />
                    <p class="text-sm"> Add </p>
                </Button>

                <!-- Upgrade Btn -->
                <p v-if="rsvps.length >= maxRsvpSlots" class="text-white/40 mt-2 italic text-xs mx-5 text-center">
                    Maximum allowed RSVP slots reached for your current subscription plan. Upgrade you bot
                    today to increase your limits!
                </p>
                <RouterLink to="/pricing">
                    <Button v-if="rsvps.length >= maxRsvpSlots" unstyled :disabled="!rsvpsEnabled"
                        @click="rsvpDialogVisible = !rsvpDialogVisible"
                        class="bg-emerald-400/40 py-0.75 px-2.25 pl-1.25 my-3 mx-3 gap-px rounded-lg transition-all cursor-pointer font-medium hover:bg-emerald-400/30 flex items-center flex-row">
                        <iconify-icon icon="tabler:diamond" width="19" height="19"></iconify-icon>
                        <p class="text-sm"> Upgrade Bot </p>
                    </Button>
                </RouterLink>



            </section>
        </Transition>

        <!-- IDIV - Rsvp Dialog Panel: -->
        <RsvpPanel ref="rsvpPanelRef" v-model:is-visible="rsvpDialogVisible" @add-rsvp="addNewRsvp"
            @edit-rsvp="editExistingRsvp" @delete-rsvp="deleteExistingRsvp" />


    </main>
</template>

<style scoped>

    @reference '@/styles/main.css';

</style>