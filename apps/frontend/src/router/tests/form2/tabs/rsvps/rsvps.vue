<script lang="ts" setup>
    import { BaselineIcon, Clock10Icon, Clock8Icon, ClockIcon, Edit3Icon, FileQuestionMarkIcon, LinkIcon, PlusIcon, TextInitialIcon, Users2Icon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import z, { safeParse } from 'zod'
    import type { NewSessions_FieldNames } from '../../sesForm.vue';
    import RsvpPanel from './rsvpFormPanel.vue';
    import { generateId } from '@sessionsbot/shared';


    // Incoming Props:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames, value: any) => void
    }>();
    const { invalidFields, validateField } = props;

    // RSVP Panel Ref:
    const rsvpPanelRef = ref();

    // Form Values/Models:
    const rsvpsEnabled = defineModel<boolean>('rsvpsEnabled')
    const rsvps = defineModel<Map<string, { name: string, emoji: string, capacity: number }>>('rsvps')

    // Add New - RSVP:
    function addNewRsvp(data: { name: string, capacity: number, emoji: string }) {
        const rsvpId = generateId.rsvp();
        return rsvps.value?.set(rsvpId, data);
    }
    // Edit Existing - RSVP:
    function editExistingRsvp(rsvpId: string, data: { name: string, capacity: number, emoji: string }) {
        return rsvps.value?.set(rsvpId, data);
    }
    // Delete Existing - RSVP:
    function deleteExistingRsvp(rsvpId: string) {
        return rsvps.value?.delete(rsvpId);
    }

    // Rsvp Dialog Panel:
    const rsvpDialogVisible = ref(false);

    function listRsvps() {
        const obj = Object.fromEntries(rsvps.value ?? [])
        const text = JSON.stringify(obj)
        console.info('Rsvps', { obj, text })
        // im having a hard time converting this RSVP map to honestly anything else... but my end goal is JSON text?
    };

</script>


<template>
    <main class="flex w-full gap-2.5 flex-1 justify-center items-center content-center flex-wrap my-5">

        <!-- INPUT: Enable RSVPs Toggle -->
        <div class="flex flex-wrap flex-row gap-1 mb-2 w-full items-center justify-start">
            <ToggleSwitch input-id="rsvpsEnabled" v-model="rsvpsEnabled" class="scale-85" />
            <label for="rsvpsEnabled"> Enable RSVPs / Sign Up </label>
        </div>


        <!-- RSVP Configuration Panel -->
        <Transition name="zoom" :duration=".75" mode="out-in">
            <section v-if="rsvpsEnabled"
                class="flex flex-col flex-wrap overflow-auto  transition-all gap-0 w-full relative rounded-lg border-2 border-ring bg-zinc-800 items-center justify-center">
                <!-- RSVPs List -->
                <div
                    class="flex gap-0 flex-wrap bg-black/25 flex-1 items-center justify-center content-center flex-col min-w-full min-h-15 border-ring border-b-2">

                    <!-- No RSVPs Added -->
                    <div v-if="(rsvps?.size || 0) <= 0"
                        class=" bg-white/5 gap-0.75 py-2.25 opacity-55 px-4 min-w-full rounded-md flex flex-row  items-center content-center justify-center drop-shadow-md drop-shadow-black">
                        <FileQuestionMarkIcon class="size-5" />
                        <p class="text-sm font-medium"> No RSVPs</p>
                    </div>

                    <!-- Current RSVP Options -->
                    <div v-if="(rsvps?.size || 0) >= 1"
                        class="gap-3 p-4 min-w-full flex flex-wrap items-center justify-center col-1">

                        <!-- RSVP Item Card -->
                        <div v-for="[id, { name, emoji, capacity }] in rsvps?.entries()"
                            class="gap-1 p-1.25 w-fit flex flex-nowrap flex-row justify-between items-center bg-white/5 ring-ring ring-2 rounded-md">

                            <!-- RSVP Data -->
                            <div class="bg-white/5 p-1 px-1.75 rounded-md flex gap-1 flex-row items-center">
                                <p class="text-wrap text-center">{{ emoji }} {{ name }}</p>
                                <div class="h-1 w-3 m-2 bg-zinc-400/70 rounded-full" />
                                <span class="flex flex-row gap-1 items-center justify-center">
                                    <Users2Icon :size="15" />
                                    <p class="text-sm"> {{ capacity }} </p>
                                </span>

                            </div>

                            <!-- Edit RSVP Button -->
                            <Button unstyled
                                @click="() => { rsvpPanelRef.startRsvpEdit(id, { name, emoji, capacity }) }"
                                class="p-1.25 hover:bg-amber-400/10 size-8 active:scale-95 rounded-md transition-all cursor-pointer flex items-center justify-center">
                                <Edit3Icon :size="15" />
                            </Button>
                        </div>

                    </div>



                </div>

                <!-- Add Rsvp Btn -->
                <Button unstyled :disabled="!rsvpsEnabled" @click="rsvpDialogVisible = !rsvpDialogVisible; listRsvps()"
                    class="bg-zinc-600 py-0.75 px-2.25 pl-1.25 my-3 mx-3 rounded-lg transition-all cursor-pointer font-medium hover:bg-zinc-700 flex items-center flex-row">
                    <PlusIcon class="size-5 p-0.5" />
                    <p class="text-sm"> Add </p>
                </Button>


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