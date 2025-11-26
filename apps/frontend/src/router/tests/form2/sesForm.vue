<script lang="ts" setup>
    import z, { safeParse } from 'zod'
    import type { FormInstance, FormSubmitEvent } from '@primevue/forms/form';
    import { zodResolver } from '@primevue/forms/resolvers/zod';
    import type { ValueOf } from '@sessionsbot/shared';
    import { ArrowRight, CalendarCogIcon, CalendarPlusIcon, CheckIcon, InfoIcon, MapPinCheckInside, MapPinCheckInsideIcon, TextInitialIcon } from 'lucide-vue-next';
    import type { InputTextPassThroughOptions } from 'primevue';
    import Form from '@primevue/forms/form';
    import InformationTab from './tabs/information.vue';

    // Form Tab Control:
    type FormTabs = 'information' | 'rsvps' | 'schedule' | 'discord';
    const tabSelected = ref<FormTabs>('information')
    const invalidTabs = ref<(FormTabs)[]>([])
    function nextTab() {
        if (tabSelected.value == 'information')
            return tabSelected.value = 'rsvps';
        else if (tabSelected.value == 'rsvps')
            return tabSelected.value = 'schedule';
        else if (tabSelected.value == 'schedule')
            return tabSelected.value = 'discord';
    };


    /** Form Values - (v-modeled) */
    const formValues = ref<NewSession_ValueTypes | { [field in NewSessions_FieldNames]: any }>({
        title: '',
        description: '',
        location: '',
        startDate: null as Date | null,
        endDate: null as Date | null,
        channelId: '',
    });

    /** Form Resolver Schema */
    const formSchema = z.object({
        title: z.string('Please enter a valid title.').regex(/^[A-Za-z0-9 ]*$/, 'Can only include characters A-Z and 0-9.').trim().min(1, 'Title must have at least 1 character.'),
        description: z.string('Please enter a valid description.').trim().max(125, 'Description cannot exceed 125 characters.').or(z.null()),
        startDate: z.date('Please enter a valid date.').refine((v) => v?.getTime() >= new Date().getTime(), 'Date has already occurred.'),
        endDate: z.date('Please enter a valid date.').refine(
            (v) => {
                const startDate = (formValues?.value?.startDate || new Date(0)) as Date
                const now = new Date();
                return (v >= now && v >= startDate)
            },
            'End Date must occur after Start Date.'
        ).or(z.null()),
        location: z.url('Invalid Url').startsWith('https://', 'Url must start with: "https://".').or(z.null()),
        channelId: z.string().trim().min(5)
    })

    /** Form's Field Names */
    const formFields = Object.keys(formSchema.shape);
    /** Form's Invalid Fields */
    const invalidFields = ref<{ [fieldName: string]: string[]; }>({});

    /** On Page/Form Mount */
    onMounted(() => {
        // Initialize invalid fields obj:
        for (const key of formFields) { invalidFields.value[key] = []; };
    })

    /** Form Field Validation Fn */
    function validateField(name: keyof typeof formSchema.shape, value: any) {

        const fieldSchema = formSchema?.shape[name];
        if (!fieldSchema) return console.warn(`Cannot validate ${name}, no schema`);

        const result = safeParse(fieldSchema, value);
        if (!result.success) {
            invalidFields.value[name] = [result.error.message];
            console.warn('Validation:', { name, value, msg: result?.error?.message })
        } else {
            invalidFields.value[name] = [];
        }
    }


    /** WATCH: Invalid Tabs */
    const infoFields: NewSessions_FieldNames[] = ['title', 'description', 'location', 'startDate', 'endDate']
    watch(() => invalidFields.value, (v) => {
        console.info('INVALID FIELDS', v);

        const keys = new Set(Object.keys(invalidFields))
        if (infoFields.some((fieldName) => keys.has(fieldName))) {
            invalidTabs.value.push('information');
        } else {
            const tabIndex = invalidTabs.value.findIndex((itm) => itm == 'information')
            if (tabIndex == -1) return;
            else invalidTabs.value.splice(tabIndex, 1);
        }
    }, { deep: true })

    /** Form Submission Function */
    async function submitForm() {

    }

    // Exported Types:
    export type NewSession_ValueTypes = z.infer<typeof formSchema>;
    export type NewSessions_FieldNames = keyof NewSession_ValueTypes

</script>


<!-- Current Notes -->
<!--+
- Weird behavior with invalid input messages being displayed,
(cleanup error map/interface)
- Also "invalid tabs" aren't working as expected..
- might need to use zod's treeify error fn?
 
+-->

<template>
    <main class="justify-center items-center">

        <!-- Form Background -->
        <div class=" p-15 gap-2 w-full flex flex-wrap justify-center items-center content-center">

            <!-- Form Card -->
            <div
                class="bg-zinc-700/70 ring-ring ring-2 rounded-md gap-2 w-full max-w-180 flex flex-col  justify-center items-center content-center">

                <!-- Form Header -->
                <section class="w-full p-1.5 bg-zinc-800/70 ring-ring ring-2 rounded-md">
                    <span class="flex flex-row gap-1 items-center">
                        <CalendarPlusIcon />
                        <p class="font-medium text-lg"> New Session </p>
                    </span>
                </section>

                <!-- Form/Tab Bar -->
                <section
                    class="flex flex-wrap justify-center px-3 my-2 items-center content-center gap-1.5 p-2 w-full mx-5 bg-zinc-800/70  ring-2 ring-ring">
                    <!-- Information Tab -->
                    <Button unstyled class="formTabBtn" @click="tabSelected = 'information'"
                        :class="{ 'bg-indigo-500!': tabSelected == 'information', 'bg-red-400/60!': invalidTabs.includes('information') }">
                        <InfoIcon class="noShrink" :size="17" />
                        <p class="text-sm">Information</p>
                    </Button>
                    <!-- RSVPs Tab -->
                    <Button unstyled class="formTabBtn" @click="tabSelected = 'rsvps'"
                        :class="{ 'bg-indigo-500!': tabSelected == 'rsvps', 'bg-red-400/60!': invalidTabs.includes('rsvps') }">
                        <MapPinCheckInsideIcon :size="17" class="noShrink" />
                        <p class="text-sm">RSVPs</p>
                    </Button>
                    <!-- Schedule Tab -->
                    <Button unstyled class="formTabBtn" @click="tabSelected = 'schedule'"
                        :class="{ 'bg-indigo-500!': tabSelected == 'schedule', 'bg-red-400/60!': invalidTabs.includes('schedule') }">
                        <CalendarCogIcon :size="17" class="noShrink" />
                        <p class="text-sm">Scheduling</p>
                    </Button>
                    <!-- Discord Tab -->
                    <Button unstyled class="formTabBtn" @click="tabSelected = 'discord'"
                        :class="{ 'bg-indigo-500!': tabSelected == 'discord', 'bg-red-400/60!': invalidTabs.includes('discord') }">
                        <i class="pi pi-discord" />
                        <p class="text-sm">Discord</p>
                    </Button>

                </section>

                <!-- Form Page -->
                <section class="flex px-12 mb-3 w-full flex-1 justify-center items-center content-center flex-wrap">

                    <InformationTab v-if="tabSelected == 'information'" :invalidFields :validateField
                        v-model:title="formValues.title" v-model:description="formValues.description"
                        v-model:start-date="formValues.startDate" v-model:end-date="formValues.endDate" />

                    <section v-else-if="tabSelected == 'rsvps'"
                        class="flex w-full flex-1 justify-center items-center content-center flex-wrap">

                        <!-- INPUT: Title -->
                        <div class="flex flex-col gap-1 w-full items-start">
                            <label for="title" class="flex flex-row gap-0.75 items-center">
                                <MapPinCheckInside :size="17" />
                                <p> RSVPS </p>
                            </label>
                            <inputText fluid name="title" :pt="{ root: 'bg-zinc-500!' }" />
                        </div>

                    </section>
                </section>


                <!-- Form Footer -->
                <section class="w-full p-1.5 bg-zinc-800/70 ring-ring ring-2 rounded-md">

                    <div class="flex justify-end items-center content-center gap-3 p-2">

                        <!-- Cancel Button -->
                        <Button raised severity="secondary" size="small">
                            Cancel
                        </Button>

                        <!-- Next Tab Button -->
                        <Button v-if="tabSelected != 'discord'" @click="nextTab()" raised size="small" severity="info"
                            class="gap-0.25!">
                            <p class=""> Next </p>
                            <ArrowRight :stroke-width="'2'" :size="17" />
                        </Button>

                        <!-- Submit Button -->
                        <Button v-else raised size="small" type="submit" severity="success" class="gap-0.25!">
                            <p class="font-medium"> Submit </p>
                            <CheckIcon :stroke-width="'4'" :size="17" />
                        </Button>

                    </div>

                </section>

            </div>

        </div>

    </main>
</template>


<style scoped>

    @reference '../../../styles/main.css';

    .formTabBtn {
        @apply bg-zinc-600 flex-1 !h-full gap-px border-ring border-2 p-1.5 px-20 font-semibold rounded-md flex flex-col justify-center items-center content-center cursor-pointer transition-colors
    }

    .formTabBtn:hover {
        @apply bg-zinc-500
    }

    .noShrink {
        @apply shrink-0
    }
</style>

<!-- Notes:
 
 - Fixing weird from tab/switcher sizing and styles.

-->