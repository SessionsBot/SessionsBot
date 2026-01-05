<script lang="ts" setup>
    import z, { regex, safeParse, treeifyError } from 'zod'
    import { AlertCircleIcon, ArrowLeft, ArrowRight, CalendarCogIcon, CalendarPlusIcon, CheckIcon, InfoIcon, MapPinCheckInsideIcon, Trash2Icon, XIcon } from 'lucide-vue-next';
    import InformationTab from './tabs/information.vue';
    import RsvpsTab from './tabs/rsvps/rsvps.vue';
    import ScheduleTab from './tabs/schedule.vue';
    import DiscordTab from './tabs/discord.vue';
    import { KeepAlive, Transition } from 'vue';
    import { useConfirm } from 'primevue';
    import { useAuthStore } from '@/stores/auth';
    import { dbIsoUtcToFormDate, mapRsvps, utcDateTimeFromJs, type API_SessionTemplateBodyInterface, type APIResponseValue } from '@sessionsbot/shared';
    import { API } from '@/utils/api';
    import { DateTime } from 'luxon';
    import { getTimeZones } from '@vvo/tzdb';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import LoadingIcon from '@/components/icons/loadingIcon.vue';
    import { useSessionTemplates } from '@/stores/dashboard/sessionTemplates';
    import { datetime, RRule } from 'rrule';

    // Services:
    const confirmService = useConfirm();
    const auth = useAuthStore();
    const dashboard = useDashboardStore();

    // Form Visibility:
    const sessionsFormVisible = computed({
        get: () => dashboard.sessionForm.visible,
        set: (v) => (dashboard.sessionForm.visible = v),
    })

    // Guild Id:
    const guildId = computed(() => dashboard.guild.id)

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
    const editingId = ref<string>();

    // EVENT: Watch for Editing Session Payload:
    watch(() => dashboard.sessionForm.editPayload, (payload) => {
        if (payload) {
            startNewEdit(payload as any);
        }
    });

    /** Form Value Defaults - Factory Fn */
    function createFormDefaults() {
        return {
            title: '',
            description: '',
            url: '',
            startDate: null,
            endDate: null,
            timeZone: '',
            rsvps: new Map(),
            recurrence: null,
            channelId: '',
            postTime: null,
            postDay: null,
            postInThread: true,
            nativeEvents: false,
        }
    }
    /** Form Values - (v-modeled) */
    const formValues = ref<NewSession_ValueTypes | { [field in NewSessions_FieldNames]: any }>(createFormDefaults())
    const formDefaults = ref(createFormDefaults())

    /** Form Options/Toggles */
    const formOptions = ref({
        rsvpsEnabled: false,
        recurrenceEnabled: false
    });

    /** Form Resolver Schema */
    const formSchema = z.object({
        title: z.string('Please enter a valid title.').trim().min(1, 'Title must have at least 1 character.').normalize(),
        description: z.string('Please enter a valid description.').trim().max(125, 'Description cannot exceed 125 characters.').normalize().optional().nullish(),
        url: z.url({ error: 'Please enter a valid URL.', protocol: /^https?$/, hostname: z.regexes.domain }).startsWith('https://', 'Url must start with: "https://".').trim().normalize().nullish().or(z.literal("")),
        startDate: z.date('Please enter a valid date.').refine((v) => {
            if (formAction.value == 'edit') return true;
            else return v?.getTime() >= new Date().getTime()
        },
            'Date has already occurred.'
        ),
        endDate: z.date('Please enter a valid date.').refine(
            (v) => {
                const startDate = (formValues?.value?.startDate) as Date
                const now = new Date();
                return ((v >= now || formAction.value == 'edit') && v >= startDate)
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
        postDay: z.literal(['Day before', 'Day of'], 'Please select an option.'),
        postInThread: z.boolean(),
        nativeEvents: z.boolean(),

    })

    /** Form's Invalid Fields */
    const invalidFields = ref<Map<NewSessions_FieldNames, string[]>>(new Map())

    /** WATCH: Invalid Fields -> Invalid Tabs */
    const infoFields: NewSessions_FieldNames[] = ['title', 'description', 'url', 'startDate', 'endDate', 'timeZone']
    const discordFields: NewSessions_FieldNames[] = ['channelId', 'postTime', 'postDay', 'postInThread', 'nativeEvents']
    watch(() => invalidFields.value, (v) => {
        const keys = new Set(v?.keys());
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


    // Form Abort Confirm Dialog Ref:
    function abortForm() {
        if (formValues.value != formDefaults.value) {
            confirmService.require({
                header: 'Are you sure?',
                message: `You're about to leave this form and may have unsaved changes! This cannot be undone!`,
                accept: () => {
                    resetFrom();
                    sessionsFormVisible.value = false;
                }
            });
        } else {
            // Auto Close - Blank Form:
            resetFrom();
            sessionsFormVisible.value = false;
        }

    };

    /** Resets the form to all defaults/no errors. */
    function resetFrom() {
        // Reset Invalid Fields
        invalidFields.value.clear();
        // Reset Form Values
        formValues.value = createFormDefaults();
        // Reset Form Options:
        formOptions.value = {
            recurrenceEnabled: false,
            rsvpsEnabled: false
        }

        // Reset Selected Tab:
        tabSelected.value = 'information';
        // Reset Edit Data:
        dashboard.sessionForm.editPayload = null;
        editingId.value = undefined;
        formAction.value = 'new';
    }

    /** Starts an existing session template edit */
    function startNewEdit(data: API_SessionTemplateBodyInterface) {

        // BEFORE PRODUCTION - NOTE:
        // - Maybe alter / change the start and end dates to represent
        // the next occurrence rather than the first start date on creation
        // to fix various ui and validation bugs

        // Assign Editing Id:
        if (!data.id) return console.warn('Invalid Session Template Id - For Edit', data?.id);
        editingId.value = data.id;

        // Set Mode:
        formAction.value = 'edit';

        // Zone Util: Name -> Zone Selected Obj:
        function getZoneSelected(zoneName: string) {
            const tzs = getTimeZones({ includeUtc: true });
            const selected = tzs.find(z => z.name == zoneName)
            if (selected) {
                const offsetHrs = (selected.rawOffsetInMinutes / 60)
                return {
                    name: `${selected.alternativeName} - ${selected.mainCities[0] || ''} (${offsetHrs}:00)`,
                    value: selected?.name
                }
            } else return null
        }

        // Util: Determine Post Day from Template Data:
        function determinePostDay(startIso: string, offsetMs: number, zone: string) {
            const start = DateTime.fromISO(startIso, { zone: 'utc' }).setZone(zone);
            const post = start.minus({ milliseconds: offsetMs })
            return post.startOf('day') < start.startOf('day')
                ? 'Day before'
                : 'Day of'
        }

        // Set Form Data:
        formValues.value = {
            title: data.title,
            description: data.description ?? '',
            url: data.url ?? null,
            startDate: dbIsoUtcToFormDate(data.starts_at_utc, data.time_zone),
            endDate: data.duration_ms ? dbIsoUtcToFormDate(data.starts_at_utc, data.time_zone, data.duration_ms) : null,
            timeZone: getZoneSelected(data.time_zone),
            rsvps: data?.rsvps ? mapRsvps(data.rsvps) : null,
            recurrence: data.rrule,
            channelId: data.channel_id,
            postTime: dbIsoUtcToFormDate(data.starts_at_utc, data.time_zone, data.post_before_ms),
            postDay: determinePostDay(data.starts_at_utc, data.post_before_ms, data.time_zone),
            postInThread: data.post_in_thread,
            nativeEvents: data.native_events
        }
        // Set Form Options:
        if (data.rsvps) formOptions.value.rsvpsEnabled = true;
        if (data.rrule) formOptions.value.recurrenceEnabled = true;

        // Open Form:
        sessionsFormVisible.value = true;
    }


    /** Form Submission Function */
    const submitBusy = ref(false);
    async function submitForm() {
        // Mark Submit Busy:
        submitBusy.value = true;

        // Apply Options:
        if (!formOptions.value.rsvpsEnabled) {
            formValues.value.rsvps = null;
        };
        if (!formOptions.value.recurrenceEnabled) {
            formValues.value.recurrence = null;
        };

        // Validate Form:
        const result = formSchema.safeParse(formValues.value);
        if (!result.success) {
            // Invalid Submission - Errors Found:
            const { properties } = treeifyError(result.error);
            for (const [fieldName, errData] of Object.entries(properties as any)) {
                //@ts-expect-error
                invalidFields.value.set(fieldName, errData?.errors)
            };
            // Mark Submit Un-Busy:
            submitBusy.value = false;
            // Return Invalid Submission:
            return console.warn('Invalid Submission!', result);
        }
        // Valid Submission - Prepare Req for API:
        let { data } = result;
        // Set empty strings to null:
        for (const [field, fieldData] of Object.entries(data)) {
            if (typeof fieldData == 'string' && fieldData.trim() == '') {
                // @ts-expect-error
                data[field] = null;
            }
        };

        // Convert - Start Date:
        const startUtc = utcDateTimeFromJs(data.startDate, data.timeZone)
        const { hour: startHour, minute: startMinute } = DateTime.fromJSDate(data.startDate);

        // Compute - Duration Ms:
        const getDurationMs = () => {
            const endDate = data.endDate
            if (!endDate) return null;
            const endUtc = utcDateTimeFromJs(endDate, data.timeZone);
            return (endUtc.toMillis() - startUtc.toMillis())
        }


        // Compute - Post Offset Ms:
        const getPostOffsetMs = () => {
            const postTimeInput = DateTime.fromJSDate(data.postTime);
            const postTimeDate = startUtc
                .setZone(data.timeZone) // session start in zone
                .set({ hour: postTimeInput.hour, minute: postTimeInput.minute }) // apply chosen post time
            let postUtc = postTimeDate.toUTC() // convert back to utc
            if (data.postDay == 'Day before') {
                postUtc = postUtc.minus({ day: 1 });
            }
            return (startUtc.toMillis() - postUtc.toMillis())
        }


        // Re-Build - RRule:
        const baseRule = data?.recurrence ? RRule.fromString(data.recurrence) : null;
        const untilInput = baseRule?.options?.until
            ? DateTime.fromJSDate(baseRule?.options?.until)
            : null;
        const untilInZone = untilInput
            ? DateTime.fromObject(
                { year: untilInput.year, month: untilInput.month, day: untilInput.day },
                { zone: data.timeZone })
                .endOf('day')
            : null;
        const untilUtc = untilInZone ? untilInZone.toUTC() : null;

        const rrule = baseRule
            ? new RRule({
                ...baseRule.origOptions,
                dtstart: startUtc.toJSDate(),
                until: untilUtc
                    ? untilUtc.toJSDate()
                    : undefined,
            })
            : null;


        // Compute - Next Post UTC:
        let cursor = DateTime.now();
        const getNextPostUtc = (): DateTime | null => {
            while (true) {
                const nextStartJs = rrule ? rrule.after(cursor.toJSDate(), true) : null;

                if (nextStartJs) {
                    const nextStartInZone = DateTime.fromJSDate(nextStartJs, { zone: data.timeZone })
                        .set({ hour: startHour, minute: startMinute }); // maintain intended time
                    const nextPostInZone = nextStartInZone.minus({ millisecond: getPostOffsetMs() });
                    // Confirm this post date is in future:
                    if (nextPostInZone <= DateTime.now()) {
                        console.info('This post was too early / already elapsed -> finding next');
                        cursor = cursor.plus({ day: 1 })
                        continue
                    } else {
                        console.info('NEXT DATES', { nextStartJs, nextStartInZone, nextPostInZone, nextPostUtc: nextPostInZone.toUTC() })
                        return nextPostInZone.toUTC()
                    }

                } else {
                    console.info('No nextStartJs -> no post utc...');
                    return null;
                };

            };
        };
        const nextPostUtc = getNextPostUtc();


        // FIX ME!!
        const getUtcExpiresAtDate = () => {
            let lastStartJs: Date | null = null;

            if (!rrule) {
                // No Recurrence:
                console.info('No recurrence', { startUtc })
                lastStartJs = startUtc
                    .minus({ millisecond: getPostOffsetMs() })
                    .toLocal()
                    .toJSDate();
            } else {
                // Has Recurrence:
                console.info('Recurrence!', { opts: rrule?.options })
                const { until, count } = rrule.options
                if (until) {
                    // RRule End by Date:
                    lastStartJs = untilUtc ? rrule.before(until, false) : null;

                } else if (count) {
                    // RRule End by Count:
                    const all = rrule.all();
                    lastStartJs = all.at(-1) ?? null;
                } else {
                    // No RRule End / Expiration Date:
                    lastStartJs = null
                }
            }

            if (lastStartJs) {
                const lastStartInZone = DateTime.fromJSDate(lastStartJs, { zone: data.timeZone })
                    .set({ hour: startHour, minute: startMinute }); // maintain intended time
                const lastPostInZone = lastStartInZone.minus({ millisecond: getPostOffsetMs() });
                const expiresAtUtc = lastPostInZone.toUTC();
                return expiresAtUtc;
            } else {
                console.info('No expiration found / lastStartJs?')
                return null;
            }
        }

        console.info('Prepared Data', {
            rrule,
            rruleString: rrule?.toString(),
            startUtc: startUtc.toISO(),
            durationMs: getDurationMs(),
            postOffsetMs: getPostOffsetMs(),
            expiration: {
                utc: getUtcExpiresAtDate(),
                inZone: getUtcExpiresAtDate()?.setZone(data.timeZone)
            },
            post: {
                utc: nextPostUtc,
                inZone: nextPostUtc?.setZone(data.timeZone)
            },
            startHour, startMinute
        })


        // return submitBusy.value = false;

        // Create Request Body:
        const bodyData = {
            data: <API_SessionTemplateBodyInterface>{
                guild_id: guildId.value,
                title: data.title,
                description: data.description,
                url: data.url,
                starts_at_utc: startUtc.toISO(),
                start_hour: startHour,
                start_minute: startMinute,
                duration_ms: getDurationMs(),
                time_zone: data.timeZone,
                rsvps: data?.rsvps ? JSON.stringify(Object.fromEntries(data.rsvps)) : null,
                rrule: rrule ? rrule.toString() : null,
                channel_id: data.channelId,
                post_before_ms: getPostOffsetMs(),
                native_events: data.nativeEvents,
                post_in_thread: data.postInThread,
                next_post_utc: nextPostUtc ? nextPostUtc.toISO() : null,
                expires_at_utc: getUtcExpiresAtDate()?.toISO() ?? null,
            }

        };


        if (formAction.value == 'new') {
            // Create New Session - Send Request
            const r = await API.post<APIResponseValue>(`/guilds/${guildId.value}/sessions/templates`, bodyData, { headers: { Authorization: `Bearer ${auth.session?.access_token}` } })
            if (r.status < 300) {
                // Success!
                console.log('Session Created', r.data.data)
                // Reset Form
                resetFrom();
                // Close Form
                sessionsFormVisible.value = false;

            } else { console.warn('Request Failed!', r) }
        } else if (formAction.value == 'edit') {
            // Edit Existing Session - Send Request
            bodyData.data.id = editingId.value;
            const r = await API.patch<APIResponseValue>(`/guilds/${guildId.value}/sessions/templates`, bodyData, { headers: { Authorization: `Bearer ${auth.session?.access_token}` } })
            if (r.status < 300) {
                // Success!
                console.log('Session Edited', r.data.data)
                // Reset Form
                resetFrom();
                // Close Form
                sessionsFormVisible.value = false;

            } else { console.warn('Request Failed!', r) }
        }



        // Mark Submit Un-Busy:
        submitBusy.value = false;
        console.log('Form Submitted', formValues.value);

        // Reload Dashboard Templates:
        useSessionTemplates().execute()

    }


    // Exported Types:
    export type NewSession_ValueTypes = z.infer<typeof formSchema>;
    export type NewSessions_FieldNames = keyof NewSession_ValueTypes

</script>



<template>
    <!-- Form Background -->
    <Dialog v-bind:visible="sessionsFormVisible" modal class="max-w-[90%]! max-h-[90%]!">


        <template #container="{ closeCallback }">
            <!-- Form Card -->
            <div
                class="bg-zinc-900 ring-ring ring-2 rounded-md gap-2 w-full max-w-130 flex flex-nowrap flex-col overflow-auto">

                <!-- Form Header/Tab Bar -->
                <div class="flex flex-col items-center justify-start w-full">
                    <!-- Header -->
                    <section
                        class="w-full p-1.5 z-2 bg-zinc-800/70 ring-ring ring-2 rounded-md flex gap-1 justify-between flex-wrap items-center content-center">
                        <!-- New Session - Title -->
                        <span v-if="formAction == 'new'" class="flex flex-row gap-1.25 items-center content-center">
                            <CalendarPlusIcon />
                            <p class="font-bold text-lg"> New Session </p>
                        </span>
                        <!-- Edit Session - Title -->
                        <span v-if="formAction == 'edit'" class="flex flex-row gap-1.25 items-center content-center">
                            <CalendarCogIcon />
                            <p class="font-bold text-lg"> Edit Schedule </p>
                        </span>

                        <!-- Abort/Delete Session - Button -->
                        <Button unstyled @click="abortForm()" :disabled="submitBusy"
                            class="p-0.5 hover:bg-red-400/15 active:scale-95 cursor-pointer transition-all rounded-lg"
                            :class="{ 'bg-transparent! opacity-30! scale-100! cursor-progress!': submitBusy }">
                            <XIcon v-if="!submitBusy" class="p-px text-white/70" />
                            <LoadingIcon v-else class="size-5" />
                        </Button>
                    </section>

                    <!-- Tab Bar -->
                    <section
                        class="flex flex-wrap bg-zinc-800/20 justify-center px-5 py-6 items-center content-center gap-1.75 w-full bg-black/05  ring-2 ring-ring">
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
                    class="flex flex-nowrap flex-col grow px-6 w-full overflow-x-clip justify-center items-center content-center">

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
                                v-model:post-in-thread="formValues.postInThread" />
                        </KeepAlive>
                    </Transition>

                </section>


                <!-- Form Footer -->
                <div
                    class="w-full flex flex-row items-center justify-between p-1.5 bg-zinc-800/70 ring-ring ring-2 rounded-md">

                    <!-- Created By - Badge -->
                    <div hidden class="flex gap-1 items-center flex-row ml-1 text-sm">
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
                                class="flex flex-row gap-0.5 p-1.5 py-0.5 justify-center items-center bg-red-400/70 drop-shadow-sm rounded-md">
                                <AlertCircleIcon :stroke-width="2.75" :size="14" />
                                <p class="text-xs font-bold"> Fix invalid fields! </p>
                            </span>
                        </Transition>

                    </div>

                    <!-- Tab/Submit Btns -->
                    <div class="flex flex-1 justify-end items-center content-center gap-3 p-2">

                        <!-- Back Tab Button -->
                        <Button v-if="tabSelected != 'information'" @click="backTab()"
                            class="gap-0.25! p-2 py-1.75 flex flex-row-reverse items-center content-center justify-center bg-zinc-500 hover:bg-zinc-500/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                            unstyled>
                            <p class="text-sm mx-0.75 font-medium"> Back </p>
                            <ArrowLeft hidden :stroke-width="'2'" :size="17" />
                        </Button>

                        <!-- Next Tab Button -->
                        <Button v-if="tabSelected != 'discord'" @click="nextTab()"
                            class="gap-0.25! p-2 py-1.75 flex flex-row items-center content-center justify-center bg-indigo-500 hover:bg-indigo-500/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                            unstyled>
                            <p class="text-sm font-bold"> Next </p>
                            <ArrowRight :stroke-width="'3'" :size="17" />
                        </Button>

                        <!-- Submit Form Button -->
                        <Button v-else @click="submitForm()" :disabled="submitBusy"
                            class="gap-0.75! p-2 py-1.75 flex flex-row items-center content-center justify-center bg-emerald-600 hover:bg-emerald-600/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                            :class="{ 'bg-zinc-600! opacity-80! scale-95! cursor-progress!': submitBusy }" unstyled>
                            <p class="text-sm font-bold"> Submit </p>
                            <LoadingIcon class="size-5! animate-pulse!" v-if="submitBusy" />
                            <CheckIcon v-else :stroke-width="'4'" :size="17" class="scale-90" />
                        </Button>

                    </div>

                </div>

            </div>
        </template>



    </Dialog>
</template>


<style scoped>

    @reference '@/styles/main.css';

    .formTabBtn {
        @apply bg-zinc-600 flex-1 gap-px border-ring border-2 p-1.5 px-10 font-semibold rounded-md flex flex-col justify-center items-center content-center cursor-pointer transition-colors
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