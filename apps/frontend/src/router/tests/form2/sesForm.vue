<script lang="ts" setup>
    import z, { regex, safeParse, treeifyError } from 'zod'
    import { AlertCircleIcon, ArrowLeft, ArrowRight, CalendarCogIcon, CalendarPlusIcon, CheckIcon, InfoIcon, MapPinCheckInsideIcon, Trash2Icon } from 'lucide-vue-next';
    import InformationTab from './tabs/information.vue';
    import RsvpsTab from './tabs/rsvps/rsvps.vue';
    import ScheduleTab from './tabs/schedule.vue';
    import DiscordTab from './tabs/discord.vue';
    import { KeepAlive, Transition, type Component } from 'vue';

    import { useConfirm } from 'primevue';
    import { useAuthStore } from '@/stores/auth';
    import axios, { type AxiosResponse } from 'axios';
    import { APIResponse, type API_SessionTemplateBodyInterface, type APIResponseValue, type Database } from '@sessionsbot/shared';
    import { API } from '@/utils/api';
    import { RRule } from 'rrule';
    import { title } from 'process';
    import { DateTime } from 'luxon';

    // Services:
    const confirmService = useConfirm()
    const router = useRouter()
    const auth = useAuthStore()

    // Guild Id & Data:
    // ! Convert to Model
    const guildId = ref<string>('1379160686629880028');
    // ! Convert to Model
    const guildChannels = ref();

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
    }
    function backTab() {
        if (tabSelected.value == 'rsvps')
            return tabSelected.value = 'information';
        else if (tabSelected.value == 'schedule')
            return tabSelected.value = 'rsvps';
        else if (tabSelected.value == 'discord')
            return tabSelected.value = 'schedule';
    }

    // Form Abort Confirm Dialog Ref:
    const abortForm = () => {
        confirmService.require({
            header: 'Are you sure?',
            message: `You're about to leave this form and may have unsaved changes! This cannot be undone!`,
            accept: () => {
                router.push('/');
            },
        })
    };

    /** ACTION: Form Mode ("new" or "edit") */
    const formAction = ref<'new' | 'edit'>('new');

    /** Form Values - (v-modeled) */
    const formValues = ref<NewSession_ValueTypes | { [field in NewSessions_FieldNames]: any }>({
        title: '',
        description: '',
        url: '',
        startDate: null,
        endDate: null as Date | null,
        timeZone: '',
        rsvps: new Map(),
        recurrence: null as any,
        channelId: '',
        postTime: null,
        postDay: null,
        postInThread: true,
        nativeEvents: false,
    });

    /** Form Options/Toggles */
    const formOptions = ref({
        rsvpsEnabled: false,
        recurrenceEnabled: false
    });

    /** Form Resolver Schema */
    const formSchema = z.object({
        title: z.string('Please enter a valid title.').trim().min(1, 'Title must have at least 1 character.').normalize(),
        description: z.string('Please enter a valid description.').trim().max(125, 'Description cannot exceed 125 characters.').normalize().optional().nullish(),
        url: z.url({ error: 'Please enter a valid URL.', protocol: /^https?$/, hostname: z.regexes.domain }).startsWith('https://', 'Url must start with: "https://".').trim().normalize().or(z.literal("")),
        startDate: z.date('Please enter a valid date.').refine((v) => v?.getTime() >= new Date().getTime(), 'Date has already occurred.'),
        endDate: z.date('Please enter a valid date.').refine(
            (v) => {
                const startDate = (formValues?.value?.startDate) as Date
                const now = new Date();
                return (v >= now && v >= startDate)
            },
            'End Date must occur after Start Date.'
        ).optional().nullable(),
        timeZone: z.object({
            name: z.string(),
            value: z.string()
        }, 'Please select a valid Time Zone.').transform((o) => o.value),
        rsvps: z.map(z.string(), z.object({
            // 2nd Level - See RsvpPanel Schema
            name: z.string().normalize(),
            emoji: z.nullish(z.emoji("Please enter a valid emoji.")).or(z.literal("")),
            capacity: z.number()
        })).nullish(),
        recurrence: z.nullish(z.string()), // ! ADD SCHEMA
        channelId: z.string('Please select a valid Post Channel.').trim().min(5, 'Please select a valid Post Channel.').normalize(),
        postTime: z.date('Please enter a valid date.').refine(
            (v) => {
                const postDay = formValues.value.postDay
                if (postDay == "Day before") {
                    return true;
                }
                const hrs = v.getHours();
                const mins = v.getMinutes()
                const startDate = (formValues.value.startDate) as Date;
                if (!startDate) {
                    return true;
                }
                const dayOfTime = new Date(startDate);
                dayOfTime.setHours(hrs, mins);
                return (dayOfTime <= startDate)
            },
            `Post Time must occur before or at event Start Time if posting "Day of".`
        ),
        postDay: z.literal('Day of').or(z.literal('Day before', 'Please select an option.')),
        postInThread: z.boolean(),
        nativeEvents: z.boolean(),

    })


    /** Form's Invalid Fields */
    const invalidFields = ref<Map<NewSessions_FieldNames, string[]>>(new Map())

    /** WATCH: Invalid Fields -> Invalid Tabs */
    const infoFields: NewSessions_FieldNames[] = ['title', 'description', 'url', 'startDate', 'endDate']
    const discordFields: NewSessions_FieldNames[] = ['channelId', 'postTime', 'postDay', 'nativeEvents']
    watch(() => invalidFields.value, (v) => {
        const keys = new Set(v?.keys())
        // Info Tab:
        if (infoFields.some((fieldName) => keys.has(fieldName))) {
            if (!invalidTabs.value.has('information')) {
                invalidTabs.value.add('information');
            }
        } else invalidTabs.value.delete('information');
        // RSVP Tab:
        if (keys.has('rsvps')) {
            invalidTabs.value.add('rsvps');
        }
        // Schedule Tab:
        if (keys.has('recurrence')) {
            invalidTabs.value.add('schedule');
        }
        else invalidTabs.value.delete('schedule');
        // Discord Tab:
        if (discordFields.some((fieldName) => keys.has(fieldName))) {
            if (!invalidTabs.value.has('discord')) {
                invalidTabs.value.add('discord');
            }
        } else invalidTabs.value.delete('discord');
    }, { deep: true });


    /** Form Field Validation Fn */
    function validateField(name: NewSessions_FieldNames) {
        const fieldSchema = formSchema?.shape[name];
        const fieldValue = formValues.value[name];
        const result = safeParse(fieldSchema, fieldValue);
        if (!result.success) {
            const { errors: errs } = treeifyError(result.error);
            invalidFields.value?.set(name, errs);
        } else {
            invalidFields.value?.delete(name);
        }
    };
    /** Form FIELD(s) Validation Fn */
    function validateFields(fields: NewSessions_FieldNames[]) {
        for (const fieldName of fields) {
            validateField(fieldName);
        }
    }


    /** Form Submission Function */
    async function submitForm() {
        // Apply Options:
        if (!formOptions.value.rsvpsEnabled) {
            formValues.value.rsvps = null;
        }
        if (!formOptions.value.recurrenceEnabled) {
            formValues.value.recurrence = null;
        }

        // Validate Form:
        const result = formSchema.safeParse(formValues.value);
        if (!result.success) {
            // Invalid Submission - Errors Found:
            const { properties } = treeifyError(result.error);
            for (const [fieldName, errData] of Object.entries(properties as any)) {
                //@ts-expect-error
                invalidFields.value.set(fieldName, errData?.errors)
            };
            return console.warn('Invalid Submission!', result);
        } else {
            // Valid Submission - Prepare Req for API:
            let { data } = result;
            // Set empty strings to null:
            for (const [field, fieldData] of Object.entries(data)) {
                if (typeof fieldData == 'string' && fieldData.trim() == '') {
                    //@ts-expect-error
                    data[field] = null;
                }
            };

            // Date/Time/Zones -> Helper Fn(s):
            function utcInZone(date: Date, zone: string) {
                const base = DateTime.fromJSDate(date);
                return DateTime.fromObject({
                    year: base.year,
                    month: base.month,
                    day: base.day,
                    hour: base.hour,
                    minute: base.minute,
                    second: 0,
                    millisecond: 0
                }, { zone }).toUTC()
            }
            function getDurationMs() {
                if (!data.endDate) return null;
                else {

                    const start = utcInZone(data.startDate, data.timeZone);
                    const end = utcInZone(data.endDate, data.timeZone);
                    return (end.toMillis() - start.toMillis());
                }
            }
            function getPostOffsetMs() {
                const post = DateTime.fromJSDate(data.postTime)
                const start = DateTime.fromJSDate(data.startDate)
                const base = DateTime.fromObject(
                    {
                        year: start.year,
                        month: start.month,
                        day: start.day,
                        hour: post.hour,
                        minute: post.minute,
                    },
                    { zone: data.timeZone }
                )
                const final = data.postDay === 'Day before'
                    ? base.minus({ days: 1 })
                    : base
                const postTimeUtc = final.toUTC()
                const startTimeUtc = utcInZone(data.startDate, data.timeZone);
                const difMs = postTimeUtc.diff(startTimeUtc, 'milliseconds').milliseconds
                return difMs
            }

            // Create Request Body:
            const bodyData = {
                data: <API_SessionTemplateBodyInterface>{
                    guild_id: guildId.value,
                    title: data.title,
                    description: data.description,
                    url: data.url,
                    starts_at_utc: utcInZone(data.startDate, data.timeZone).toISO(),
                    duration_ms: getDurationMs(),
                    time_zone: data.timeZone,
                    rsvps: data?.rsvps ? JSON.stringify(Object.fromEntries(data.rsvps)) : null,
                    rrule: data.recurrence,
                    channel_id: data.channelId,
                    post_before_ms: getPostOffsetMs(),
                    native_events: data.nativeEvents,
                    post_in_thread: data.postInThread,
                }
            };

            console.info('REQ BODY DATA', bodyData);
            const r = await API.post(`/guilds/${guildId.value}/sessions/templates`, bodyData, { headers: { Authorization: `Bearer ${auth.session?.access_token}` } })
            console.info(`REQ Response`, r.data);
        }

        console.log('Form Submitted', formValues.value);
    }

    /** Fetch Guild Channels - Fn
     * - Fires: On page/form mount
     */
    async function getGuildChannels() {
        const channelRes = await API.get<APIResponseValue>(`/guilds/${guildId.value}/channels`, {
            headers: { Authorization: `Bearer ${auth.session?.access_token}` }
        });
        const channelData = channelRes.data.success ? channelRes.data.data : undefined;
        if (channelData) {
            console.info('FOUND CHANNELS', channelData);
            guildChannels.value = channelData;
        } else {
            console.error('CHANNELS NOT FOUND!', channelRes);
        }

    }

    /** On Page/Form Mount */
    onMounted(async () => {
        // Fetch guild's channels:
        if (auth.signedIn) {
            await getGuildChannels();
        } else {
            console.warn(`You're not signed in! - Cannot fetch channels! - Trying again`);
            setTimeout(() => getGuildChannels(), 3_000)
        }
    })

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
                        <Button unstyled @click="abortForm()"
                            class="p-2 hover:bg-red-400/15 active:scale-95 cursor-pointer transition-all rounded-lg">
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
                        <!-- FORM TABS -->
                        <KeepAlive>
                            <InformationTab v-if="tabSelected == 'information'" :invalidFields :validateField
                                :validateFields v-model:title="formValues.title"
                                v-model:description="formValues.description" v-model:url="formValues.url"
                                v-model:start-date="formValues.startDate" v-model:end-date="formValues.endDate"
                                v-model:time-zone="formValues.timeZone" />

                            <RsvpsTab v-else-if="tabSelected == 'rsvps'" :invalidFields :validateField
                                v-model:rsvps-enabled="formOptions.rsvpsEnabled" v-model:rsvps="formValues.rsvps" />

                            <ScheduleTab v-else-if="tabSelected == 'schedule'" :invalidFields :validateField
                                v-model:recurrence-enabled="formOptions.recurrenceEnabled"
                                v-model:recurrence="formValues.recurrence" />

                            <DiscordTab v-else-if="tabSelected == 'discord'" :invalidFields :validateField
                                :validateFields v-model:channel-id="formValues.channelId"
                                v-model:post-time="formValues.postTime" v-model:post-day="formValues.postDay"
                                v-model:native-events="formValues.nativeEvents"
                                v-model:post-in-thread="formValues.postInThread"
                                v-model:guild-channels="guildChannels" />
                        </KeepAlive>
                    </Transition>

                </section>


                <!-- Form Footer -->
                <div
                    class="w-full flex flex-row items-center justify-between p-1.5 bg-zinc-800/70 ring-ring ring-2 rounded-md">

                    <!-- Created By - Badge -->
                    <div v-if="false" class="flex gap-1 items-center flex-row ml-1 text-sm">
                        <p> Created By: </p>
                        <!-- User Name/Icon -->
                        <a :href="'https://discord.com/users/' + auth?.userData?.id"
                            class="bg-white/5 ring-2 ring-ring p-0.5 px-1.5 gap-1 rounded-sm flex flex-row  items-center justify-center flex-wrap">
                            <img :src="auth.userData?.avatar" alt="(user avatar)"
                                class="size-4 rounded-full ring-2 ring-zinc-600">
                            <p> {{ auth.userData?.username }}</p>
                        </a>
                    </div>

                    <!-- Invalid Fields - Badge -->
                    <div class="flex justify-center items-center p-2 overflow-clip">

                        <Transition name="slide" mode="out-in">
                            <span v-if="invalidFields.size >= 1"
                                class="flex flex-row gap-0.5 p-1.5 py-0.5 justify-center items-center bg-red-500/70 drop-shadow-sm rounded-md">
                                <AlertCircleIcon :stroke-width="2.75" :size="14" />
                                <p class="text-xs font-medium"> Fix invalid fields! </p>
                            </span>
                        </Transition>

                    </div>

                    <!-- Tab/Submit Btns -->
                    <div class="flex flex-1 justify-end items-center content-center gap-3 p-2">

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