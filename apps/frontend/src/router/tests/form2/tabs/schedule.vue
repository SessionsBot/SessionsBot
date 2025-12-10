<script lang="ts" setup>
    import { CalendarDaysIcon, CalendarRangeIcon, CalendarSyncIcon, CalendarX2Icon, CalendarXIcon, Clock8Icon, RefreshCcwDotIcon, TextInitialIcon } from 'lucide-vue-next';
    import z, { safeParse, treeifyError, type infer } from 'zod'
    import type { NewSessions_FieldNames } from '../sesForm.vue';
    import { ToggleSwitch } from 'primevue';
    import type { ValueOf } from '@sessionsbot/shared';


    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames) => void
    }>();
    const { invalidFields, validateField } = props;

    // Recurrence Enabled Toggle:
    const recurrenceEnabled = defineModel<boolean>('recurrenceEnabled');

    // End Repeat Date Toggle:
    const endRepeatDateEnabled = ref(false)

    // End Repeat Count Toggle:
    const endRepeatCountEnabled = ref(false)

    // Local Form Schema:
    const localFormSchema = z.object({
        frequency: z.string().trim(),
        interval: z.number(),
        weekdays: z.any(),
        endRepeatDate: z.nullish(z.date()),
        endRepeatCount: z.nullish(z.number().min(1))
    });

    // Local Form Ref:
    const localForm = ref({
        formValues: <LocalForm_ValueType>{
            frequency: <'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>'',
            interval: 0,
            endRepeatDate: null,
            endRepeatCount: null,
        },
        invalidFields: new Map<LocalForm_FieldName | undefined, string[]>(),
        validateField: (name: LocalForm_FieldName, value: any) => {
            const fieldSchema = localFormSchema.shape?.[name];
            if (!fieldSchema) console.warn('Missing field schema', { name, value });

            const validateResult = safeParse(fieldSchema, value);
            if (!validateResult.success) {
                const errs = treeifyError(validateResult.error).errors;
                localForm.value.invalidFields.set(name, errs);
            } else {
                localForm.value.invalidFields.delete(name);
            }
        },
    });

    // Local Form - TYPES:
    type LocalForm_ValueType = z.infer<typeof localFormSchema> & { frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' }
    type LocalForm_FieldName = keyof LocalForm_ValueType;


    // Dynamic Interval Suffix
    const intervalSuffix = computed(() => {
        const pluralEnd = ((Number(localForm.value.formValues.interval) || 0) > 1) ? 's' : '';
        if (localForm.value.formValues.frequency == 'Daily') {
            return ' Day' + pluralEnd;
        } else if (localForm.value.formValues.frequency == 'Weekly') {
            return ' Week' + pluralEnd;
        } else if (localForm.value.formValues.frequency == 'Monthly') {
            return ' Month' + pluralEnd;
        } else if (localForm.value.formValues.frequency == 'Yearly') {
            return ' Year' + pluralEnd;
        };
    });

    // Weekday Selection
    const weekdayOptions = [
        { name: 'Mo', value: 'Monday' },
        { name: 'Tu', value: 'Tuesday' },
        { name: 'We', value: 'Wednesday' },
        { name: 'Th', value: 'Thursday' },
        { name: 'Fr', value: 'Friday' },
        { name: 'Sa', value: 'Saturday' },
        { name: 'Su', value: 'Sunday' },
    ];
    const weekdaysSelected: Ref<Set<'Su' | 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa'>> = ref(new Set());
    function toggleWeekday(name: string) {
        if (name == 'Su') {
            if (weekdaysSelected.value.has('Su')) return weekdaysSelected.value.delete('Su');
            else return weekdaysSelected.value.add('Su');
        } else if (name == 'Mo') {
            if (weekdaysSelected.value.has('Mo')) return weekdaysSelected.value.delete('Mo');
            else return weekdaysSelected.value.add('Mo');
        } else if (name == 'Tu') {
            if (weekdaysSelected.value.has('Tu')) return weekdaysSelected.value.delete('Tu');
            else return weekdaysSelected.value.add('Tu');
        } else if (name == 'We') {
            if (weekdaysSelected.value.has('We')) return weekdaysSelected.value.delete('We');
            else return weekdaysSelected.value.add('We');
        } else if (name == 'Th') {
            if (weekdaysSelected.value.has('Th')) return weekdaysSelected.value.delete('Th');
            else return weekdaysSelected.value.add('Th');
        } else if (name == 'Fr') {
            if (weekdaysSelected.value.has('Fr')) return weekdaysSelected.value.delete('Fr');
            else return weekdaysSelected.value.add('Fr');
        } else if (name == 'Sa') {
            if (weekdaysSelected.value.has('Sa')) return weekdaysSelected.value.delete('Sa');
            else return weekdaysSelected.value.add('Sa');
        }
    };

    // Field Auto Validation:
    watch(() => localForm.value.formValues.frequency, (val) => {
        localForm.value.validateField('frequency', val)
    })
    watch(() => localForm.value.formValues.interval, (val) => {
        localForm.value.validateField('interval', val)
    })

    watch(() => localForm.value.formValues.weekdays, (val) => {
        localForm.value.validateField('weekdays', val)
    })
    watch(() => localForm.value.formValues.endRepeatDate, (val) => {
        localForm.value.validateField('endRepeatDate', val)
    })
    watch(() => localForm.value.formValues.endRepeatCount, (val) => {
        localForm.value.validateField('endRepeatCount', val)
    })
    // Tab Btn - Invalidation:
    watch(localForm.value.invalidFields, (val) => {
        console.info('local invalid fields changed!', val)
        if (val.size >= 1) {
            console.log('errs found')
            return invalidFields.set('recurrence', ['Session recurrence is invalid!']);
        } else {
            console.log('errs NOT found')
            return invalidFields.delete('recurrence');
        }
    })


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
                    <label for="frequency" class="flex flex-row gap-0.75 items-center">
                        <CalendarDaysIcon :size="17" />
                        <p> Frequency </p>
                    </label>
                    <Select name="frequency" :options="['Daily', 'Weekly', 'Monthly', 'Yearly']" fluid
                        v-model="localForm.formValues['frequency']"
                        :invalid="localForm.invalidFields.has('frequency')" />
                    <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                        v-for="err in localForm.invalidFields.get('frequency') || []">
                        <p class="text-sm! pl-0.5">
                            {{ err || 'Invalid Input!' }}
                        </p>
                    </Message>
                </div>

                <!-- INPUT: Interval -->
                <div v-if="localForm.formValues.frequency != 'Weekly'" class="flex flex-col gap-1 w-full items-start"
                    :class="{ 'text-red-400! ring-red-400 border-red-400!': localForm.invalidFields.has('interval') }">
                    <label for="interval" class="flex flex-row gap-0.75 items-center">
                        <RefreshCcwDotIcon :size="17" />
                        <p> Interval </p>
                    </label>
                    <InputNumber :disabled="localForm.formValues.frequency == '' as any"
                        :invalid="localForm.invalidFields.has('interval')"
                        v-model="localForm.formValues.interval as any" inputId="horizontal-buttons" showButtons
                        :step="1" :min="1" :suffix="intervalSuffix" fluid
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
                <div v-else class="flex flex-col gap-1 w-full items-start"
                    :class="{ 'text-red-400! ring-red-400 border-red-400!': localForm.invalidFields.has('weekdays') }">
                    <label for="weekdays" class="flex flex-row gap-0.75 items-center">
                        <CalendarRangeIcon :size="17" />
                        <p> Weekdays </p>
                    </label>
                    <!-- Selection Input -->
                    <div class="gap-3 p-3 w-full h-fit flex flex-wrap justify-start items-center content-center">

                        <Button class="weekdayBtn" v-for="{ name, value } in weekdayOptions" unstyled :title="value"
                            :class="{ 'bg-indigo-500/70! border-white!': weekdaysSelected.has(name as any) }"
                            @click="toggleWeekday(name)">
                            <p class="text-sm font-medium"> {{ value }} </p>
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
                    <ToggleSwitch input-id="endRepeatDateEnabled" v-model="endRepeatDateEnabled" class="scale-85" />
                    <label for="endRepeatDateEnabled" class="block gap-0.25 flex-row items-center">
                        <p class="inline!"> End Repeat Date </p>
                    </label>
                </div>

                <!-- INPUT: End Repeat Date -->
                <Transition name="zoom" :duration=".75" mode="out-in">
                    <div v-if="endRepeatDateEnabled" class="flex flex-col gap-1 w-full items-start"
                        :class="{ 'text-red-400! ring-red-400!': localForm.invalidFields.has('endRepeatDate') }">
                        <label for="endRepeatDate" class="flex flex-row gap-0.75 items-center">
                            <CalendarX2Icon :size="17" />
                            <p> End Repeat Date </p>
                        </label>
                        <DatePicker name="endRepeatDate" v-model="localForm.formValues.endRepeatDate" fluid
                            date-format="m/d/y" class="w-full flex " :min-date="new Date()"
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
                    <ToggleSwitch input-id="endRepeatCountEnabled" v-model="endRepeatCountEnabled" class="scale-85" />
                    <label for="endRepeatCountEnabled" class="block gap-0.25 flex-row items-center">
                        <p class="inline!"> Max Repeat Count </p>
                    </label>
                </div>

                <!-- INPUT: Max Repeat Count -->
                <Transition name="zoom" :duration=".75" mode="out-in">
                    <div v-if="endRepeatCountEnabled" class="flex flex-col gap-1 w-full items-start"
                        :class="{ 'text-red-400! ring-red-400!': localForm.invalidFields.has('endRepeatCount') }">
                        <label for="endRepeatCount" class="flex flex-row gap-0.75 items-center">
                            <CalendarSyncIcon :size="17" />
                            <p> Max Repeat Count </p>
                        </label>
                        <InputNumber :invalid="localForm.invalidFields.has('endRepeatCount')"
                            v-model="localForm.formValues.endRepeatCount as any" inputId="horizontal-buttons"
                            showButtons :step="1" :min="1" suffix=" Repeats" fluid
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