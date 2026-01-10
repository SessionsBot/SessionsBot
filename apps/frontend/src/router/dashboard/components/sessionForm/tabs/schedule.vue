<script lang="ts" setup>
    import { CalendarDaysIcon, CalendarRangeIcon, CalendarSyncIcon, CalendarX2Icon, CalendarXIcon, Clock8Icon, RefreshCcwDotIcon, TextInitialIcon } from 'lucide-vue-next';
    import z, { number, prettifyError, safeParse, treeifyError, type infer } from 'zod'
    import type { NewSessions_FieldNames } from '../sesForm.vue';
    import { ToggleSwitch } from 'primevue';
    import { Frequency, RRule, ALL_WEEKDAYS, Weekday, datetime, type WeekdayStr } from 'rrule'
    import InputTitle from '../labels/inputTitle.vue';
    import { DateTime } from 'luxon';
    import useDashboardStore from '@/stores/dashboard/dashboard';

    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames) => void
    }>();
    const { invalidFields, validateField } = props;

    const dashboard = useDashboardStore();


    // Recurrence Enabled Toggle:
    const recurrenceEnabled = defineModel<boolean>('recurrenceEnabled');
    // End Repeat Date Toggle:
    const endRepeatDateEnabled = ref(false)
    // End Repeat Count Toggle:
    const endRepeatCountEnabled = ref(false)

    // Recurrence RRule String:
    const recurrence = defineModel<string>('recurrence');
    const RRuleText = computed(() => {
        if (!recurrence.value) return 'Add more info to fields!';
        const rule = RRule.fromString(recurrence.value);
        return rule?.toText()
    })

    // Local Form Schema:
    const localFormSchema = z.object({
        frequency: z.enum(Frequency),
        interval: z.number().min(1, "Interval must be greater than or equal to 1."),
        weekdays: z.array(z.any()).optional().nullish().default([]),
        endRepeatDate: z.nullish(z.date()),
        endRepeatCount: z.nullish(z.number().min(1))
    });

    // Local Form Ref:
    const localForm = ref({
        formValues: <LocalForm_ValueType>{
            frequency: '' as any,
            interval: '' as any,
            endRepeatDate: null,
            endRepeatCount: null,
        },
        invalidFields: new Map<LocalForm_FieldName | undefined, string[]>(),
        validateField: (name: LocalForm_FieldName, value: any) => {
            const fieldSchema = localFormSchema.shape?.[name];
            const validateResult = safeParse(fieldSchema, value);
            if (!validateResult.success) {
                const errs = treeifyError(validateResult.error).errors;
                // console.warn('INPUT ERROR', name, errs)
                localForm.value.invalidFields.set(name, errs);
            } else {
                localForm.value.invalidFields.delete(name);
            }
        },
    })

    // Field Validation:
    const validateLocalField = (name: LocalForm_FieldName, value: any) => localForm.value.validateField(name, value);

    // Local Form - TYPES:
    type LocalForm_ValueType = z.infer<typeof localFormSchema>
    type LocalForm_FieldName = keyof LocalForm_ValueType;


    // Dynamic Interval Suffix
    const intervalSuffix = computed(() => {
        const pluralEnd = ((Number(localForm.value.formValues.interval) || 0) > 1) ? 's' : '';
        if (localForm.value.formValues.frequency == Frequency.DAILY as any) {
            return ' Day' + pluralEnd;
        } else if (localForm.value.formValues.frequency === Frequency.WEEKLY as any) {
            return ' Week' + pluralEnd;
        } else if (localForm.value.formValues.frequency === Frequency.MONTHLY as any) {
            return ' Month' + pluralEnd;
        } else if (localForm.value.formValues.frequency === Frequency.YEARLY as any) {
            return ' Year' + pluralEnd;
        } else return '';
    });


    // Weekday Selection
    const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;
    type WD = (typeof WEEKDAYS)[number];
    const weekdaysSelected: Ref<Set<WD>> = ref(new Set());
    function toggleWeekday(weekday: WD) {
        weekdaysSelected.value.has(weekday)
            ? weekdaysSelected.value.delete(weekday)
            : weekdaysSelected.value.add(weekday);

        const r = Array.from(weekdaysSelected?.value?.keys())?.map((i) => Weekday?.fromStr(i))
        localForm.value.formValues.weekdays = r;
        validateLocalField('weekdays', r);
    };
    function clearWeekdays() {
        weekdaysSelected.value.clear();
        localForm.value.formValues.weekdays = [];
    }


    // Tab Btn - Invalidation:
    watch(localForm.value.invalidFields, (val) => {
        if (val.size >= 1) {
            return invalidFields.set('recurrence', ['Session recurrence is invalid!']);
        } else {
            return invalidFields.delete('recurrence');
        }
    })


    // Watch EACH Input -> Create RRULE String:
    watch(localForm.value.formValues, (v) => {
        const validate = safeParse(localFormSchema, v);
        if (validate.success) {
            // Confirm Required Inputs:
            if ((
                !v.frequency && v.frequency != 0) ||
                !v.interval
            ) return;

            const endDate = v.endRepeatDate
                ? DateTime.fromJSDate(v.endRepeatDate)
                    .startOf('day')
                : null;

            // Create Recurrence RRule:
            const newRule = new RRule({
                freq: v.frequency as any,
                interval: v.interval,
                byweekday: v.weekdays || undefined,
                count: v.endRepeatCount,
                until: endDate
                    ? endDate.toJSDate() // datetime(endDate.year, endDate.month, endDate.day, 0, 0, 0)
                    : undefined,
                // tzid: 'UTC'
            });
            if (newRule) {
                // Assign to form values:
                // console.info('CREATED RULE', newRule, newRule.toString())
                recurrence.value = newRule.toString();
            }

        } else {
            // Errors Found - Add to Invalid MSGs:
            const { properties } = treeifyError(validate.error);
            for (const [fieldName, fieldErrs] of Object.entries(properties as any)) {
                const errs = fieldErrs as any;
                localForm.value.invalidFields.set(fieldName as any, errs?.errors as any)

            }
            console.info('Form Invalid - No RRule created or updated', validate)
        }

    })

    // Watch recurrence/rrule -> On EDIT -> Load Options:
    watch(() => dashboard.sessionForm.editPayload, (payload) => {
        if (payload) {
            const ruleText = payload?.rrule
            if (!ruleText) return;
            // Get Editing RRule
            const rule = RRule.fromString(ruleText)
            // Set freq:
            localForm.value.formValues.frequency = rule.options.freq
            // Set interval:
            localForm.value.formValues.interval = rule.options.interval
            // Set weekdays:
            if (rule.origOptions.byweekday) {
                for (const dayNum of rule.options.byweekday) {
                    const d = ALL_WEEKDAYS[dayNum] as WeekdayStr;
                    weekdaysSelected.value.add(d);
                }
                localForm.value.formValues.weekdays = rule.origOptions.byweekday as any;
            }
            // Set End Repeat Date:
            if (rule.options.until) {
                const untilLocal = DateTime.fromJSDate(rule.options.until, { zone: payload.time_zone })
                    .setZone('local', { keepLocalTime: true })
                    .toJSDate();
                endRepeatDateEnabled.value = true;
                localForm.value.formValues.endRepeatDate = untilLocal;

            }
            // Set Max Repeat Count:
            if (rule.origOptions.count) {
                endRepeatCountEnabled.value = true;
                localForm.value.formValues.endRepeatCount = rule.origOptions.count
            }
        }
    }, { deep: true, immediate: true })

</script>


<template>
    <main class="flex w-full gap-3.5 flex-1 justify-center items-center content-center flex-wrap my-5">

        <!-- INPUT: Recurrence Toggle -->
        <div class="flex gap-1 mb-1 flex-wrap flex-row w-full items-center justify-start">
            <ToggleSwitch input-id="recurrenceEnabled" v-model="recurrenceEnabled" class="scale-85" />
            <label for="recurrenceEnabled" class="block gap-0.25 flex-row items-center">
                <p class="inline!"> Repeating Session </p>
            </label>
        </div>

        <!-- Recurrence/Schedule Form Area -->
        <Transition name="zoom" :duration=".75" mode="out-in">
            <section v-show="recurrenceEnabled"
                class="flex flex-col relative gap-3.5 w-full items-center justify-start transition-all">

                <!-- INPUT: Frequency -->
                <div class="flex flex-col gap-1 w-full items-start"
                    :class="{ 'text-red-400! ring-red-400!': localForm.invalidFields.has('frequency') }">
                    <InputTitle fieldTitle="Frequency" required :icon="CalendarDaysIcon" />
                    <Select name="frequency" :options="[
                        { name: 'Daily', value: Frequency.DAILY },
                        { name: 'Weekly', value: Frequency.WEEKLY },
                        { name: 'Monthly', value: Frequency.MONTHLY },
                        { name: 'Yearly', value: Frequency.YEARLY }
                    ]" option-label="name" option-value="value" fluid v-model="localForm.formValues['frequency']"
                        @value-change="(v) => { validateLocalField('frequency', v); clearWeekdays(); localForm.formValues.interval = 1; }"
                        :invalid="localForm.invalidFields.has('frequency')" />
                    <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                        v-for="err in localForm.invalidFields.get('frequency') || []">
                        <p class="text-sm! pl-0.5">
                            {{ err || 'Invalid Input!' }}
                        </p>
                    </Message>
                </div>

                <!-- INPUT: Interval -->
                <div class="flex flex-col gap-1 w-full items-start"
                    :class="{ 'text-red-400! ring-red-400 border-red-400!': localForm.invalidFields.has('interval') }">
                    <InputTitle fieldTitle="Interval" required :icon="RefreshCcwDotIcon" />
                    <InputNumber :invalid="localForm.invalidFields.has('interval')"
                        @value-change="(v) => validateLocalField('interval', v)" v-model="localForm.formValues.interval"
                        inputId="horizontal-buttons" showButtons :step="1" :min="1" :suffix="intervalSuffix" fluid
                        :pt="{ incrementButton: 'bg-transparent!', decrementButton: 'bg-transparent!' }"
                        :class="{ 'border-red-400!': localForm.invalidFields.has('interval') }">

                    </InputNumber>
                    <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                        v-for="err in localForm.invalidFields.get('interval') || []">
                        <p class="text-sm! pl-0.5">
                            {{ err || 'Invalid Input!' }}
                        </p>
                    </Message>
                </div>

                <!-- INPUT: Weekdays -->
                <div v-if="localForm.formValues.frequency == Frequency.WEEKLY as any"
                    class="flex flex-col gap-1 w-full items-start"
                    :class="{ 'text-red-400! ring-red-400 border-red-400!': localForm.invalidFields.has('weekdays') }">
                    <InputTitle fieldTitle="Weekdays" :icon="CalendarRangeIcon" />

                    <!-- Selection Input -->
                    <div class="gap-3 p-3 w-full h-fit flex flex-wrap justify-start items-center content-center">

                        <Button class="weekdayBtn" v-for="{ name, value } in [
                            { value: 'MO', name: 'Monday' },
                            { value: 'TU', name: 'Tuesday' },
                            { value: 'WE', name: 'Wednesday' },
                            { value: 'TH', name: 'Thursday' },
                            { value: 'FR', name: 'Friday' },
                            { value: 'SA', name: 'Saturday' },
                            { value: 'SU', name: 'Sunday' },
                        ]" unstyled :title="value.toString()"
                            :class="{ 'bg-indigo-500/70! border-white!': weekdaysSelected.has(value as any) }"
                            @click="toggleWeekday(value as any)">
                            <p class="text-sm font-medium"> {{ name }} </p>
                        </Button>

                    </div>
                    <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                        v-for="err in localForm.invalidFields.get('weekdays') || []">
                        <p class="text-sm! pl-0.5">
                            {{ err || 'Invalid Input!' }}
                        </p>
                    </Message>
                </div>

                <!-- INPUT: End Repeat Date - Toggle -->
                <div class="flex gap-1 flex-wrap my-2 mb-0.75 flex-row w-full items-center justify-start">
                    <ToggleSwitch input-id="endRepeatDateEnabled" @value-change="(v) => {
                        if (!v) { localForm.formValues.endRepeatDate = null }
                    }" v-model="endRepeatDateEnabled" class="scale-85" />
                    <label for="endRepeatDateEnabled" class="block gap-0.25 flex-row items-center">
                        <p class="inline!"> End Repeat Date </p>
                    </label>
                </div>

                <!-- INPUT: End Repeat Date -->
                <Transition name="zoom" :duration=".75" mode="out-in">
                    <div v-if="endRepeatDateEnabled" class="flex flex-col gap-1 w-full items-start"
                        :class="{ 'text-red-400! ring-red-400!': localForm.invalidFields.has('endRepeatDate') }">

                        <InputTitle fieldTitle="End Repeat Date" :icon="CalendarX2Icon" />
                        <DatePicker name="endRepeatDate" v-model="localForm.formValues.endRepeatDate" fluid
                            date-format="m/d/y" class="w-full flex " show-clear :min-date="new Date()"
                            @value-change="(v) => validateLocalField('endRepeatDate', v)"
                            :invalid="localForm.invalidFields.has('endRepeatDate')" />
                        <Message unstyled
                            class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400! hover:bg-white/5"
                            v-for="err in localForm.invalidFields.get('endRepeatDate') || []">
                            <p class="text-sm! pl-0.5">
                                {{ err || 'Invalid Input!' }}
                            </p>
                        </Message>
                    </div>
                </Transition>


                <!-- INPUT: Max Repeat Count - Toggle -->
                <div class="flex gap-1 flex-wrap my-2 mb-0.75 flex-row w-full items-center justify-start">
                    <ToggleSwitch input-id="endRepeatCountEnabled" @value-change="(v) => {
                        if (!v) { localForm.formValues.endRepeatCount = null }
                    }" v-model="endRepeatCountEnabled" class="scale-85" />
                    <label for="endRepeatCountEnabled" class="block gap-0.25 flex-row items-center">
                        <p class="inline!"> Max Repeat Count </p>
                    </label>
                </div>

                <!-- INPUT: Max Repeat Count -->
                <Transition name="zoom" :duration=".75" mode="out-in">
                    <div v-if="endRepeatCountEnabled" class="flex flex-col gap-1 w-full items-start"
                        :class="{ 'text-red-400! ring-red-400!': localForm.invalidFields.has('endRepeatCount') }">
                        <InputTitle fieldTitle="Max Repeat Count" required :icon="CalendarSyncIcon" />

                        <InputNumber :invalid="localForm.invalidFields.has('endRepeatCount')"
                            @value-change="(v) => validateLocalField('endRepeatCount', v)"
                            v-model="localForm.formValues.endRepeatCount as any" inputId="horizontal-buttons"
                            showButtons show-clear :step="1" :min="1" suffix=" Repeats" fluid
                            :pt="{ incrementButton: 'bg-transparent!', decrementButton: 'bg-transparent!' }"
                            :class="{ 'border-red-400!': localForm.invalidFields.has('endRepeatCount') }" />

                        <Message unstyled
                            class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400! hover:bg-white/5"
                            v-for="err in localForm.invalidFields.get('endRepeatCount') || []">
                            <p class="text-sm! pl-0.5">
                                {{ err || 'Invalid Input!' }}
                            </p>
                        </Message>
                    </div>
                </Transition>

                <!-- RRULE - Info Text -->
                <div class="flex w-full gap-2 flex-wrap mb-2 flex-col items-start justify-center">

                    <p class="opacity-50 w-full"> <span class="pi pi-info-circle relative top-[2px]" /> This
                        session
                        will repeat: </p>
                    <p class="ml-1.5 mt-0.5 bg-yellow-500/40 text-sm px-2 py-0.5 rounded-md ring-2 ring-white/50">
                        {{ RRuleText || 'Add more information to fields...' }}
                    </p>

                </div>

            </section>
        </Transition>
    </main>
</template>


<style scoped>

    @reference '@/styles/main.css';

    .weekdayBtn {
        @apply px-2 py-1 gap-1 grow bg-zinc-800 border-2 border-white rounded-md cursor-pointer flex justify-center items-center transition-all;
    }

    .weekdayBtn:hover {
        @apply border-indigo-300
    }
</style>