<script lang="ts" setup>
    import { BaselineIcon, Clock10Icon, Clock8Icon, ClockIcon, FileQuestionMarkIcon, LinkIcon, PlusIcon, TextInitialIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import z, { safeParse } from 'zod'
    import type { NewSessions_FieldNames } from '../sesForm.vue';


    // Outgoing Emits:
    const emit = defineEmits<{
        validateField: [name: NewSessions_FieldNames, value: any]
    }>()

    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames, value: any) => void
    }>();
    const { invalidFields, validateField } = props;

    // Form Values:
    const rsvpsEnabled = defineModel<boolean>('rsvpsEnabled')
    const rsvps = defineModel<object | unknown>('rsvps')
    // const title = defineModel<string>('title');



    // Field Auto Validation:
    // watch(() => title.value, (val) => {
    //     validateField('title', val);
    // })


</script>


<template>
    <main class="flex w-full gap-2.5 flex-1 justify-center items-center content-center flex-wrap my-5">

        <!-- INPUT: Enable RSVPs Toggle -->
        <div class="flex flex-wrap flex-row gap-1 mb-3 w-full items-center justify-start">
            <ToggleSwitch input-id="rsvpsEnabled" v-model="rsvpsEnabled" class="scale-85" />
            <label for="rsvpsEnabled"> Enable RSVPs / Sign Up </label>
        </div>


        <!-- RSVP Configuration Panel -->
        <section :class="{ 'blur-xs': !rsvpsEnabled }"
            class="flex flex-col transition-all gap-0 w-full rounded-lg border-2 overflow-auto border-ring bg-zinc-800 items-center justify-center ">
            <!-- RSVPs List -->
            <div
                class="flex gap-0 flex-wrap bg-black/25 items-center justify-center flex-col flex-1 min-w-full min-h-15 border-ring border-b-2">

                <!-- No RSVPs Added -->
                <div
                    class=" bg-white/5 gap-0.75 py-2.25 opacity-55 px-4 w-fit rounded-full flex flex-row  items-center content-center justify-center drop-shadow-md drop-shadow-black">
                    <FileQuestionMarkIcon class="size-5" />
                    <p class="text-sm font-medium"> No RSVPs</p>
                </div>

            </div>
            <!-- Add Rsvp Btn -->
            <Button unstyled :disabled="!rsvpsEnabled"
                class="bg-zinc-600 py-0.75 px-2.25 pl-1.25 my-3 mx-3 rounded-lg transition-all cursor-pointer font-medium hover:bg-zinc-700 flex items-center flex-row">
                <PlusIcon class="size-5 p-0.5" />
                <p class="text-sm"> Add </p>
            </Button>
        </section>


    </main>
</template>

<style scoped>

    @reference '@/styles/main.css';

    .rsvpGridHeading {
        @apply bg-white/15 flex flex-1 text-center font-medium w-full py-0.5 px-2 border-r-2 border-ring text-sm
    }

    .rsvpGridCell {
        @apply text-left py-2 p-1.5 w-full py-0.5 border-r-2 border-ring text-sm
    }

</style>