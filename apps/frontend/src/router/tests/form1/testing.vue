<script setup lang="ts">
    import type { FormInstance, FormSubmitEvent } from '@primevue/forms/form';
    import z from 'zod';
    import { zodResolver } from '@primevue/forms/resolvers/zod'
    import type { TooltipOptions, } from 'primevue';
    import { ClipboardCheckIcon, Clock10Icon, Clock4Icon, LinkIcon, NewspaperIcon, SettingsIcon, TextInitialIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import SesInfoForm from './sesInfoForm.vue';
    import SesDiscordForm from './sesDiscordForm.vue';

    // Main Submission Draft:
    const submissionDraft = ref({});

    // Main form logic:
    const sesForm = ref({

        /** Reffed Form Element */
        eRef: ref<FormInstance>(),

        /** Form Input Resolver */
        resolver: zodResolver(z.object({
            title: z.string('Please enter a valid title.').regex(/^[A-Za-z0-9 ]*$/, 'Can only include characters A-Z and 0-9.').trim().min(1, 'Title must have at least 1 character(s).'),
            description: z.string('Please enter a valid description.').trim().max(125, 'Description cannot exceed 125 characters.').or(z.null()),
            startDate: z.date('Please enter a valid date.').refine((v) => v.getTime() >= new Date().getTime(), 'Date has already occurred.'),
            endDate: z.date('Please enter a valid date.').refine(
                (v) => {
                    const startDate = (sesForm.value.eRef?.getFieldState('startDate')?.value || new Date(0)) as Date
                    const now = new Date();
                    return (v >= now && v >= startDate)
                },
                'End Date must occur after Start Date.'
            ).or(z.null()),
            location: z.url('Invalid Url').startsWith('https://', 'Url must start with: "https://".').or(z.null()),
            channelId: z.string().trim().min(5)
        })),

        /** Form Input Options */
        options: ref({
            includeEndDate: true,
            maxSelectableDate: () => DateTime.now().plus({ year: 1 }).toJSDate(),
            minSelectableDate: () => DateTime.now().toJSDate(),
            includeLocation: true,
        }),

        /** Form Submit Handler */
        submit: (e: FormSubmitEvent) => {
            console.log('Submitted', e)
            if (e.valid) {
                submissionDraft.value = {
                    ...(submissionDraft.value || {}),
                    ...e.values
                }
            }
        }
    });

    const formInView = ref<'information' | 'discord' | 'signup'>('information');

    watch(formInView, (newV, oldV) => {
        console.info('Form in View:', newV);
    })
    watch(submissionDraft, (newV, oldV) => {
        console.info('Submission Draft Updated:', newV);
    })

</script>

<template>
    <main class="flex flex-1 flex-col flex-wrap justify-center items-center content-center">

        <section
            class="bg-zinc-800 mt-5 flex flex-row justify-start ring-2 overflow-clip ring-white/50 max-w-180 w-[90%] rounded-md">

            <!-- Form Navigator -->
            <section
                class="w-fit! z-3! flex flex-wrap flex-col justify-start items-center gap-1 pb-1 border-r-white/50 border-r-2">
                <!-- Header -->
                <span
                    class="gap-0.5 bg-zinc-900 border-b-white/50  border-b-2 p-1 w-full flex flex-row flex-wrap items-center">
                    <SettingsIcon class="opacity-50" :size="15" />
                    <p class="opacity-50 font-normal text-sm"> Options </p>
                </span>
                <!-- Information -->
                <Button unstyled :class="{ 'bg-indigo-500!': formInView == 'information' }"
                    @click="formInView = 'information'" class="formNavButton">
                    <NewspaperIcon />
                    <p> Information </p>
                </Button>
                <!-- Discord -->
                <Button unstyled :class="{ 'bg-indigo-500!': formInView == 'discord' }" @click="formInView = 'discord'"
                    class="formNavButton">
                    <i class="pi pi-discord pt-0.5 scale-150" />
                    <p> Discord Settings </p>
                </Button>
                <!-- Signup -->
                <Button unstyled :class="{ 'bg-indigo-500!': formInView == 'signup' }" @click="formInView = 'signup'"
                    class="formNavButton">
                    <ClipboardCheckIcon />
                    <p class="text-wrap"> Signup RSVPs </p>
                    <div hidden
                        class="flex justify-center items-center flex-wrap rounded-full aspect-square p-0.5 bg-red-400 shadow-md shadow-black/40">
                        <p class="text-xs"> 2 </p>
                    </div>
                </Button>

            </section>

            <!-- Form Display -->
            <Form unstyled v-slot="$form" :ref="(el) => sesForm.eRef = <any>el" :resolver="sesForm.resolver"
                class="w-full">
                <Transition name="fade" mode="out-in">

                    <SesInfoForm v-if="formInView == 'information'" :ses-form="sesForm"
                        v-model:form-in-view="formInView" :form$="$form" />
                    <SesDiscordForm v-else-if="formInView == 'discord'" :ses-form="sesForm"
                        v-model:formInView="formInView" :form$="$form" />

                </Transition>

            </Form>
        </section>



    </main>
</template>

<style scoped>
    @reference "../../../styles/main.css";

    .formNavButton {
        @apply w-full p-1 flex flex-1 flex-col gap-0.5 justify-center items-center content-center bg-zinc-700 hover:bg-zinc-600 cursor-pointer transition-all
    }

    .inputArea {
        @apply flex flex-col !w-60 !sticky gap-2
    }

    .inputLabel {
        @apply text-white/75 relative right-1.5 font-medium gap-0.5 flex justify-start items-center flex-row flex-nowrap
    }

</style>