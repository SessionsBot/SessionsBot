<script lang="ts" setup>
    import z, { safeParse, treeifyError } from 'zod'
    import { ArrowLeft, ArrowRight, CalendarCogIcon, CalendarPlusIcon, CheckIcon, InfoIcon, MapPinCheckInside, MapPinCheckInsideIcon, TextInitialIcon, Trash2Icon } from 'lucide-vue-next';
    import InformationTab from './tabs/information.vue';
    import RsvpsTab from './tabs/rsvps.vue';
    import ScheduleTab from './tabs/schedule.vue';
    import DiscordTab from './tabs/discord.vue';
    import { Transition } from 'vue';


    // Form Tab Control:
    type FormTabs = 'information' | 'rsvps' | 'schedule' | 'discord';
    const tabSelected = ref<FormTabs>('information')
    const invalidTabs = ref<(Set<FormTabs>)>(new Set())
    function nextTab() {
        if (tabSelected.value == 'information')
            return tabSelected.value = 'rsvps';
        else if (tabSelected.value == 'rsvps')
            return tabSelected.value = 'schedule';
        else if (tabSelected.value == 'schedule')
            return tabSelected.value = 'discord';
    };
    function backTab() {
        if (tabSelected.value == 'rsvps')
            return tabSelected.value = 'information';
        else if (tabSelected.value == 'schedule')
            return tabSelected.value = 'rsvps';
        else if (tabSelected.value == 'discord')
            return tabSelected.value = 'schedule';
    };


    /** ACTION: Form Mode ("new" or "edit") */
    const formAction = ref<'new' | 'edit'>('new');

    /** Form Values - (v-modeled) */
    const formValues = ref<NewSession_ValueTypes | { [field in NewSessions_FieldNames]: any }>({
        title: '',
        description: '',
        location: '',
        startDate: null as Date | null,
        endDate: null as Date | null,
        channelId: '',
        rsvps: {},
        recurrence: null as any,
    });

    /** Form Options/Toggles */
    const formOptions = ref({
        rsvpsEnabled: false,
        recurrenceEnabled: false
    })


    /** Form Resolver Schema */
    const formSchema = z.object({
        title: z.string('Please enter a valid title.').regex(/^[A-Za-z0-9 ]*$/, 'Can only include characters A-Z and 0-9.').trim().min(1, 'Title must have at least 1 character.'),
        description: z.string('Please enter a valid description.').trim().max(125, 'Description cannot exceed 125 characters.').optional().nullish(),
        location: z.url('Invalid Url').startsWith('https://', 'Url must start with: "https://".').trim().optional().nullish().or(z.literal(['', ``, ""])),
        startDate: z.date('Please enter a valid date.').refine((v) => v?.getTime() >= new Date().getTime(), 'Date has already occurred.'),
        endDate: z.date('Please enter a valid date.').refine(
            (v) => {
                const startDate = (formValues?.value?.startDate) as Date
                const now = new Date();
                return (v >= now && v >= startDate)
            },
            'End Date must occur after Start Date.'
        ).optional().nullable(),
        channelId: z.string().trim().min(5),
        rsvps: z.object(z.any()),
        recurrence: z.any()
    })


    /** Form's Invalid Fields */
    const invalidFields = ref<Map<NewSessions_FieldNames, string[]>>(new Map())

    /** WATCH: Invalid Fields -> Invalid Tabs */
    const infoFields: NewSessions_FieldNames[] = ['title', 'description', 'location', 'startDate', 'endDate']
    watch(() => invalidFields.value, (v) => {

        const keys = new Set(v?.keys())
        if (infoFields.some((fieldName) => keys.has(fieldName))) {
            if (!invalidTabs.value.has('information')) {
                invalidTabs.value.add('information');
            }
        } else {
            invalidTabs.value.delete('information');
        }
    }, { deep: true })


    /** Form Field Validation Fn */
    function validateField(name: NewSessions_FieldNames, value: any) {

        const fieldSchema = formSchema?.shape[name];
        if (!fieldSchema) return console.warn(`Cannot validate ${name}, no schema`);

        const result = safeParse(fieldSchema, value);
        if (!result.success) {
            const { errors: errs } = treeifyError(result.error);
            invalidFields.value?.set(name, errs);
        } else {
            invalidFields.value?.delete(name);
        }
    }


    /** Form Submission Function */
    async function submitForm() {

    }

    /** On Page/Form Mount */
    // onMounted(() => {

    // })

    // Exported Types:
    export type NewSession_ValueTypes = z.infer<typeof formSchema>;
    export type NewSessions_FieldNames = keyof NewSession_ValueTypes

</script>



<template>
    <main class="justify-center items-center">

        <!-- Form Background -->
        <div class=" p-15 gap-2 w-full flex flex-wrap justify-center items-center content-center">

            <!-- Form Card -->
            <div
                class="bg-zinc-900 ring-ring ring-2 rounded-md gap-2 w-full max-w-180 flex flex-col  justify-center items-center content-center">

                <!-- Form Header/Tab Bar -->
                <div class="flex flex-col items-center justify-start w-full">
                    <!-- Header -->
                    <section
                        class="w-full p-1.5 z-2 bg-zinc-800/70 ring-ring ring-2 rounded-md flex gap-1 justify-between flex-wrap items-center content-center">
                        <!-- New Session - Title -->
                        <span v-if="formAction == 'new'" class="flex flex-row gap-1.25 items-center content-center">
                            <CalendarPlusIcon />
                            <p class="font-medium text-lg"> New Session </p>
                        </span>
                        <!-- Edit Session - Title -->
                        <span v-if="formAction == 'edit'" class="flex flex-row gap-1.25 items-center content-center">
                            <CalendarCogIcon />
                            <p class="font-medium text-lg"> Edit Session </p>
                        </span>

                        <!-- Abort/Delete Session - Button -->
                        <Button unstyled
                            class="p-2 hover:bg-red-400/20 active:scale-95 cursor-pointer transition-all rounded-full">
                            <Trash2Icon class="opacity-40 size-5" />
                        </Button>
                    </section>

                    <!-- Tab Bar -->
                    <section
                        class="flex flex-wrap bg-zinc-800/20 justify-center px-5 py-6 items-center content-center gap-1.75 p-2 w-full bg-black/05  ring-2 ring-ring">
                        <!-- Information Tab -->
                        <Button unstyled class="formTabBtn" @click="tabSelected = 'information'"
                            :class="{ 'formTabBtn-selected': tabSelected == 'information', 'formTabBtn-invalid': invalidTabs.has('information') }">
                            <InfoIcon class="noShrink" :size="17" />
                            <p class="text-sm">Information</p>
                        </Button>
                        <!-- RSVPs Tab -->
                        <Button unstyled class="formTabBtn" @click="tabSelected = 'rsvps'"
                            :class="{ 'formTabBtn-selected': tabSelected == 'rsvps', 'formTabBtn-invalid': invalidTabs.has('rsvps') }">
                            <MapPinCheckInsideIcon :size="17" class="noShrink" />
                            <p class="text-sm">RSVPs</p>
                        </Button>
                        <!-- Schedule Tab -->
                        <Button unstyled class="formTabBtn" @click="tabSelected = 'schedule'"
                            :class="{ 'formTabBtn-selected': tabSelected == 'schedule', 'formTabBtn-invalid': invalidTabs.has('schedule') }">
                            <CalendarCogIcon :size="17" class="noShrink" />
                            <p class="text-sm">Scheduling</p>
                        </Button>
                        <!-- Discord Tab -->
                        <Button unstyled class="formTabBtn" @click="tabSelected = 'discord'"
                            :class="{ 'formTabBtn-selected': tabSelected == 'discord', 'formTabBtn-invalid': invalidTabs.has('discord') }">
                            <i class="pi pi-discord" />
                            <p class="text-sm">Discord</p>
                        </Button>

                    </section>
                </div>


                <!-- Form Page/Tab View -->
                <section
                    class="flex px-6 w-full overflow-clip flex-1 justify-center items-center content-center flex-wrap">

                    <Transition name="slide" mode="out-in" :duration="0.5">
                        <InformationTab v-if="tabSelected == 'information'" :invalidFields :validateField
                            v-model:title="formValues.title" v-model:description="formValues.description"
                            v-model:start-date="formValues.startDate" v-model:end-date="formValues.endDate" />

                        <RsvpsTab v-else-if="tabSelected == 'rsvps'" :invalidFields :validateField
                            v-model:rsvps-enabled="formOptions.rsvpsEnabled" v-model:rsvps="formValues.rsvps" />

                        <ScheduleTab v-else-if="tabSelected == 'schedule'" :invalidFields :validateField
                            v-model:recurrence-enabled="formOptions.recurrenceEnabled" />

                        <DiscordTab v-else-if="tabSelected == 'discord'" :invalidFields :validateField />
                    </Transition>

                </section>


                <!-- Form Footer -->
                <div class="w-full p-1.5 bg-zinc-800/70 ring-ring ring-2 rounded-md">

                    <div class="flex justify-end items-center content-center gap-3 p-2">

                        <!-- Back Tab Button -->
                        <Button v-if="tabSelected != 'information'" @click="backTab()"
                            class="gap-0.25! p-2 py-1.75 flex flex-row-reverse items-center content-center justify-center bg-zinc-500 hover:bg-zinc-500/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                            unstyled>
                            <p class="text-sm mx-0.75 font-normal"> Back </p>
                            <ArrowLeft hidden :stroke-width="'2'" :size="17" />
                        </Button>

                        <!-- Next Tab Button -->
                        <Button v-if="tabSelected != 'discord'" @click="nextTab()"
                            class="gap-0.25! p-2 py-1.75 flex flex-row items-center content-center justify-center bg-indigo-500 hover:bg-indigo-500/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                            unstyled>
                            <p class="text-sm font-medium"> Next </p>
                            <ArrowRight :stroke-width="'3'" :size="17" />
                        </Button>


                        <Button v-else @click="submitForm()"
                            class="gap-0.75! p-2 py-1.75 flex flex-row items-center content-center justify-center bg-emerald-600 hover:bg-emerald-600/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                            unstyled>
                            <p class="text-sm font-medium"> Submit </p>
                            <CheckIcon :stroke-width="'4'" :size="17" class="scale-90" />
                        </Button>

                    </div>

                </div>

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
        @apply bg-zinc-500 !border-zinc-500
    }

    .noShrink {
        @apply shrink-0
    }

    .formTabBtn-selected, .formTabBtn-selected:hover {
        @apply !bg-indigo-500 !border-indigo-500/30
    }

    .formTabBtn-invalid, .formTabBtn-invalid:hover {
        @apply !bg-red-400/70 !border-red-400/30
    }
</style>

<!-- Notes:
 
 - Fixing weird from tab/switcher sizing and styles.

-->