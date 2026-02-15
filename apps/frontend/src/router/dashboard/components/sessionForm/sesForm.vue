<script lang="ts" setup>
    import z, { safeParse, treeifyError } from 'zod'
    import { AlertCircleIcon, ArrowLeft, ArrowRight, CalendarCogIcon, CalendarPlusIcon, CheckIcon, InfoIcon, Layers2Icon, MapPinCheckInsideIcon, Trash2Icon, TriangleAlertIcon, XIcon } from 'lucide-vue-next';
    import InformationTab from './tabs/information.vue';
    import RsvpsTab from './tabs/rsvps/rsvps.vue';
    import ScheduleTab from './tabs/schedule.vue';
    import DiscordTab from './tabs/discord.vue';
    import { KeepAlive, Transition } from 'vue';
    import { useConfirm } from 'primevue';
    import { useAuthStore } from '@/stores/auth';
    import { dbIsoUtcToDateTime, dbIsoUtcToFormDate, mapRsvps, utcDateTimeFromJs, type API_SessionTemplateBodyInterface, type APIResponseValue } from '@sessionsbot/shared';
    import { API } from '@/utils/api';
    import { DateTime } from 'luxon';
    import { getTimeZones } from '@vvo/tzdb';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import LoadingIcon from '@/components/icons/LoadingIcon.vue';
    import { RRule } from 'rrule';
    import useNotifier from '@/stores/notifier';
    import { externalUrls } from '@/stores/nav';

    // Services:
    const confirmService = useConfirm();
    const auth = useAuthStore();
    const dashboard = useDashboardStore();
    const notifier = useNotifier();

    // Form Visibility:
    const sessionsFormVisible = computed({
        get: () => dashboard.sessionForm.visible,
        set: (v) => (dashboard.sessionForm.visible = v),
    })

    // Guild Id:
    const guildId = computed(() => dashboard.guildId)

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
            rsvps: [],
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
        }, 'Please select a valid Time Zone.').transform(o => o.value),
        rsvps: z.array(z.object({
            // 2nd Level - See RsvpPanel Schema
            name: z.string().normalize(),
            emoji: z.nullish(z.emoji("Please enter a valid emoji.")).or(z.literal("")),
            capacity: z.number(),
            required_roles: z.array(z.string()).nullish()
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

    });

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
        } else invalidTabs.value.delete('schedule');
        // Discord Tab:
        if (discordFields.some((fieldName) => keys.has(fieldName))) {
            if (!invalidTabs.value.has('discord')) {
                invalidTabs.value.add('discord');
            }
        } else invalidTabs.value.delete('discord');
    }, { deep: true }
    )


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
    }
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
                message: `
                <p>
                    You're about to <strong>leave this form</strong> and may have <b>unsaved changes</b>.
                </p><br>
                <p class="w-full font-bold text-center text-red-500/80 underline">
                    This cannot be undone!
                </p>
            `,
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
    }

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

        // Reset Submit States:
        submitState.value = 'idle';
    }

    /** Starts an existing session template edit */
    function startNewEdit(data: API_SessionTemplateBodyInterface) {

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
            rsvps: data?.rsvps ? mapRsvps(data.rsvps) : [],
            recurrence: data.rrule,
            channelId: data.channel_id,
            postTime: dbIsoUtcToFormDate(data.starts_at_utc, data.time_zone, -data.post_before_ms),
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

    /** Starts/Creates a "Duplicate" from an Editing Session */
    const showDuplicatedAlert = ref(false)
    function startNewDuplicate() {
        // Check if additional templates allowed:
        const allowed = dashboard.sessionForm.createNew();
        if (allowed) {
            showDuplicatedAlert.value = true;
            formAction.value = 'new';
            setTimeout(() => {
                showDuplicatedAlert.value = false;
            }, 2_000);
        } else {
            return // alert sent from store
        }

    }

    /** Starts the deletion prompt to delete this session template */
    function startDeletionPrompt() {
        // Show Confirmation Prompt:
        confirmService.require({
            header: `Are you sure?`,
            message: `
                <p>
                    You're about to <strong>permanently delete</strong> this session
                    & any recurring session that stems from it.
                </p><br>
                <p class="w-full text-center font-bold underline text-invalid-2">
                    This cannot be undone!
                </p>
            `,
            icon: 'lucide:trash-2',
            accept: async () => {
                submitState.value = 'failed'
                const { data: { error, success }, status } = await API.delete<APIResponseValue>(`/guilds/${guildId.value}/sessions/templates/${editingId.value}`, {
                    headers: { Authorization: `Bearer ${auth.session?.access_token}` }
                })
                if (!success || error || status >= 300) {
                    console.error('Failed to Delete Session:', status, error)
                    // Send Errored Alert:
                    notifier.send({
                        header: ' Failed!',
                        content: `We couldn't delete that session.. if this issue persists please <b class="extrabold">get in contact with Bot Support!</b>`,
                        level: 'error',
                        actions: [
                            {
                                button: {
                                    title: 'Chat with Support',
                                    icon: 'basil:chat-solid',
                                    href: "+" + externalUrls.discordServer.supportInvite
                                },
                                onClick(e, ctx) { return },
                            }
                        ]
                    })
                    setTimeout(() => submitState.value = 'idle', 2_500)
                } else {
                    sessionsFormVisible.value = false;
                    resetFrom()
                    dashboard.guildData.sessionTemplates?.execute()
                    // Send Success Alert:
                    notifier.send({
                        header: 'Session Deleted',
                        content: null,
                        level: 'success',
                        icon: 'iconamoon:trash-duotone',
                        classes: { header: 'self-center text-[15px]' }
                    })
                }

            }
        })
    }


    /** Form Submission Function */
    const submitState = ref<'idle' | 'loading' | 'failed'>('idle')
    const debugSubmit = false;
    async function submitForm() {
        try {
            // Mark Submit Busy:
            submitState.value = 'loading'

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
                submitState.value = 'failed';
                // Return Invalid Submission:
                return console.warn('Invalid Submission!', { result, values: formValues.value });
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
            // Set empty rsvps to null:
            if (!data.rsvps?.length) {
                data.rsvps = null;
            }

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
                    // No RRULE - Compute first/last post if after NOW:
                    if (!rrule) {
                        // Get First & Only Post Time:
                        const post = startUtc.minus({ millisecond: getPostOffsetMs() })
                        // IF EDITING - Ensure this post date is past its last post date:
                        if (formAction.value == 'edit' && dashboard.sessionForm.editPayload?.last_post_utc) {
                            const lastPostUtc = DateTime.fromISO(dashboard.sessionForm.editPayload.last_post_utc)
                            if (post <= lastPostUtc) {
                                return null
                            }
                        }
                        return post
                    }
                    // RRULE - Find Next Local Date in JS Date:
                    const nextStartJs = rrule ? rrule.after(cursor.toJSDate(), true) : null;
                    if (nextStartJs) {
                        // Create DateTime in Zone w/ Post Offset of next recurrence:
                        const nextStartInZone = DateTime.fromJSDate(nextStartJs, { zone: data.timeZone })
                            .set({ hour: startHour, minute: startMinute }); // maintain intended time
                        const nextPostInZone = nextStartInZone.minus({ millisecond: getPostOffsetMs() });
                        // IF EDITING - Ensure this post date is past its last post date:
                        if (formAction.value == 'edit' && dashboard.sessionForm.editPayload?.last_post_utc) {
                            const lastPostInZone = dbIsoUtcToDateTime(dashboard.sessionForm.editPayload.last_post_utc, data.timeZone)
                            if (nextPostInZone <= lastPostInZone) {
                                // This post was too early / already elapsed -> finding next
                                cursor = cursor.plus({ day: 1 })
                                continue
                            }
                        }
                        // Checks Passed - Return UTC Date:
                        return nextPostInZone.toUTC();

                    } else {
                        // No Next Occurrence from NOW - Possible 1 Time with Day Before offsets
                        // Find most recent occurrence - PREVIOUSLY and return that post date:
                        console.error('No `nextStartJs` was found!');
                        return null;
                    };

                };
            };
            const nextPostUtc = getNextPostUtc();

            console.info({ nextPostUtc })

            // Compute - Expiration Date UTC (last post time):
            const getUtcExpiresAtDate = () => {
                let lastStartJs: Date | null = null;

                if (!rrule) {
                    // No Recurrence:
                    lastStartJs = startUtc
                        .minus({ millisecond: getPostOffsetMs() })
                        .toLocal()
                        .toJSDate();
                } else {
                    // Has Recurrence:
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
                    return null;
                }
            };


            // If Debugging - Return
            if (debugSubmit) {
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
                    startHour, startMinute,
                    rsvps: data.rsvps
                });
                return submitState.value = 'idle';
            }



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
                    rsvps: data?.rsvps?.length ? JSON.stringify(data.rsvps) : null,
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
                    // Success! - Reset Form
                    resetFrom();
                    // Close Form
                    sessionsFormVisible.value = false;

                } else { console.warn('Request Failed!', r) }
            } else if (formAction.value == 'edit') {
                // Edit Existing Session - Send Request
                bodyData.data.id = editingId.value;
                const r = await API.patch<APIResponseValue>(`/guilds/${guildId.value}/sessions/templates`, bodyData, { headers: { Authorization: `Bearer ${auth.session?.access_token}` } })
                if (r.status < 300) {
                    // Success! - Reset Form
                    resetFrom();
                    // Close Form
                    sessionsFormVisible.value = false;

                } else { console.warn('Request Failed!', r) }
            }



            // Mark Submit Un-Busy:
            submitState.value = 'idle';
            // console.log('Form Submitted', formValues.value);

            // Reload Dashboard Templates:
            dashboard.guildData.channels?.execute()

        } finally {
            setTimeout(() => {
                submitState.value = 'idle'
            }, 1_500)
        }
    }


    // Exported Types:
    export type NewSession_ValueTypes = z.infer<typeof formSchema>;
    export type NewSessions_FieldNames = keyof NewSession_ValueTypes

</script>



<template>
    <!-- Form Background -->
    <Dialog append-to="body" v-bind:visible="sessionsFormVisible" modal block-scroll
        class="max-w-[90%]! max-h-[90%]! border-0!">
        <template #container="{ closeCallback, initDragCallback }">
            <!-- Form Card -->
            <div
                class="sessions-form-dialog bg-bg-2 border-2 border-ring-3 rounded-md gap-2 w-full max-w-115 flex flex-nowrap flex-col overflow-hidden">

                <!-- Form Header/Tab Bar -->
                <div class="flex flex-col items-center justify-start w-full">
                    <!-- Header -->
                    <section
                        class="w-full p-1.5 z-2 bg-text-1/10 border-ring-3 border-b-2 flex gap-1 justify-between flex-wrap items-center content-center">
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
                        <Button unstyled @click="abortForm()" :disabled="submitState != 'idle'"
                            class="p-0.5 hover:bg-red-400/50 active:scale-95 cursor-pointer transition-all rounded-lg"
                            :class="{ 'bg-transparent! opacity-30! scale-100! cursor-progress!': submitState == 'loading' }">
                            <XIcon v-if="submitState == 'idle'" class="p-px text-text-1/70" />
                            <LoadingIcon v-else class="size-5" />
                        </Button>
                    </section>

                    <!-- Tab Bar -->
                    <section
                        class="flex flex-wrap bg-text-soft/20 justify-center px-5 py-6 items-center content-center gap-1.75 w-full border-b-2 border-ring-3">
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

                <!-- SCROLL ZONE - Form Tab Area -->
                <div class="flex flex-col w-full h-full grow overflow-auto">
                    <!-- Form Page/Tab View -->
                    <section
                        class="flex flex-nowrap flex-col grow px-6 w-full overflow-x-clip justify-center items-center content-center">

                        <Transition name="slide" mode="out-in" :duration="0.5">
                            <!-- FORM TABS -->
                            <KeepAlive>
                                <InformationTab v-if="tabSelected == 'information'" :invalidFields :validateField
                                    :validateFields :formAction v-model:title="formValues.title"
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



                </div>

                <!-- Form Footer -->
                <div
                    class="w-full min-h-fit flex flex-row items-center justify-between p-1.5 bg-text-1/10 ring-ring-3 ring-2 rounded-md">

                    <!-- Invalid Fields - Badge - EDIT Actions -->
                    <div class="flex justify-center items-center p-2 overflow-clip">

                        <Transition name="zoom" mode="out-in">
                            <span v-if="invalidFields.size >= 1"
                                class="flex flex-row gap-0.5 p-1.5 py-0.5 justify-center items-center bg-invalid-1/60 dark:bg-invalid-2/70 drop-shadow-sm rounded-md">
                                <AlertCircleIcon :stroke-width="2.75" :size="14" />
                                <p class="text-xs font-bold"> Fix invalid fields! </p>
                            </span>

                            <span v-else-if="showDuplicatedAlert"
                                class="flex flex-row gap-0.5 p-1.5 py-0.5 justify-center items-center bg-indigo-500/80 drop-shadow-sm rounded-md">
                                <Layers2Icon :size="14" />
                                <p class="text-xs font-bold"> Started Duplicate! </p>
                            </span>

                            <span v-else-if="formAction == 'edit'" class="gap-2 flex flex-row">
                                <Button unstyled title="Duplicate" @click="startNewDuplicate"
                                    class="aspect-square p-1 bg-[color-mix(in_oklab,var(--c-bg-3),black_10%)] hover:bg-emerald-500/50 cursor-pointer rounded-md active:bg-emerald-500/50 active:scale-95 transition-all">
                                    <Layers2Icon :size="20" />
                                </Button>

                                <Button unstyled title="Delete" @click="startDeletionPrompt"
                                    class="aspect-square p-1 bg-[color-mix(in_oklab,var(--c-bg-3),black_10%)] hover:bg-red-400/50 cursor-pointer rounded-md active:bg-red-400/50 active:scale-95 transition-all">
                                    <Trash2Icon :size="20" />
                                </Button>
                            </span>
                        </Transition>

                    </div>

                    <!-- Tab/Submit Btns -->
                    <div class="flex flex-1 justify-end items-center content-center gap-3 p-2">

                        <!-- Back Tab Button -->
                        <Button v-if="tabSelected != 'information'" @click="backTab()"
                            class="gap-0.25! bg-text-soft hover:bg-text-soft/75 p-2 py-1.75 flex flex-row-reverse items-center content-center justify-center bg-bg-4 hover:bg-bg-4/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                            unstyled>
                            <p class="text-sm mx-0.75 font-medium"> Back </p>
                            <ArrowLeft hidden :stroke-width="'2'" :size="17" />
                        </Button>

                        <!-- Next Tab Button -->
                        <Button v-if="tabSelected != 'discord'" @click="nextTab()"
                            class="gap-0.25! bg-brand-1/70 hover:bg-brand-1/85 p-button-success! p-2 py-1.75 flex flex-row items-center content-center justify-center  active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                            unstyled>
                            <p class="text-sm font-bold"> Next </p>
                            <ArrowRight :stroke-width="'3'" :size="17" />
                        </Button>

                        <!-- Submit Form Button -->
                        <Button v-else @click="submitForm()" :disabled="submitState != 'idle'"
                            class="gap-0.75! p-2 py-1.75 flex flex-row items-center content-center justify-center bg-emerald-500/62 dark:bg-emerald-500/70 hover:bg-emerald-500/50 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                            :class="{
                                'bg-zinc-600! opacity-80! scale-95! cursor-progress!': submitState == 'loading',
                                'bg-invalid-1/70!  scale-100! cursor-not-allowed!': submitState == 'failed'
                            }" unstyled>
                            <div v-if="submitState == 'idle'"
                                class="flex gap-0.75 flex-row items-center content-center justify-center">
                                <p class="text-sm font-bold"> Submit </p>
                                <CheckIcon :stroke-width="'4'" :size="17" class="scale-90" />
                            </div>
                            <div v-if="submitState == 'loading'"
                                class="flex gap-0.75 flex-row items-center content-center justify-center">
                                <p class="text-sm font-bold"> Submit </p>
                                <LoadingIcon class="size-5! animate-pulse!" v-if="submitState == 'loading'" />
                            </div>
                            <div v-if="submitState == 'failed'"
                                class="flex gap-0.75 flex-row items-center content-center justify-center">
                                <p class="text-sm font-bold"> Failed </p>
                                <TriangleAlertIcon :stroke-width="'3'" :size="17" class="scale-90" />
                            </div>
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
        @apply bg-bg-3 flex-1 gap-px border-ring-soft border-2 p-1.5 px-10 font-semibold rounded-md flex flex-col justify-center items-center content-center cursor-pointer transition-colors
    }

    .formTabBtn:hover {
        @apply bg-bg-soft !border-ring-3
    }

    .noShrink {
        @apply shrink-0
    }

    .formTabBtn-selected, .formTabBtn-selected:hover {
        @apply !bg-brand-1/70 !border-brand-1
    }

    .formTabBtn-invalid, .formTabBtn-invalid:hover {
        @apply !bg-invalid-3/50 !border-invalid-1/80
    }


</style>