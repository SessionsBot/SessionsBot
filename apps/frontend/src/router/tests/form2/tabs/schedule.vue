<script lang="ts" setup>
    import { TextInitialIcon } from 'lucide-vue-next';
    import z, { safeParse, treeifyError, type infer } from 'zod'
    import type { NewSessions_FieldNames } from '../sesForm.vue';
    import { ToggleSwitch } from 'primevue';
    import type { ValueOf } from '@sessionsbot/shared';


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

    // Recurrence Enabled Toggle:
    const recurrenceEnabled = defineModel<boolean>('recurrenceEnabled');

    // Local Form Schema:
    const localFormSchema = z.object({
        frequency: z.string().trim(),
        interval: z.number().or(z.string())
    });

    // Local Form Ref:
    const localForm = ref({
        formValues: <LocalForm_ValueType>{
            frequency: <'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>'',
            interval: '',
            endRepeatDate: ''
        },
        invalidFields: new Map<LocalForm_FieldName | undefined, string[]>(

        ),
        validateField: (name: LocalForm_FieldName, value: any) => {
            const fieldSchema = localFormSchema.shape?.[name];
            if (!fieldSchema) console.warn('Missing field schema', { name, value });

            const validateResult = safeParse(fieldSchema, value);
            if (!validateResult.success) {
                const errs = treeifyError(validateResult.error).errors;
                localForm.value.invalidFields.set(name, errs);
            } else {
                localForm.value.invalidFields.set(name, []);
            }
        },
    });

    // Local Form - TYPES:
    type LocalForm_ValueType = z.infer<typeof localFormSchema> & { frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' }
    type LocalForm_FieldName = keyof LocalForm_ValueType;


    // Dynamic Interval Suffix:
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
        }
    })

    // Field Auto Validation:
    watch(() => localForm.value.formValues.frequency, (val) => {
        console.log('FREQ -> CHANGED!')
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
                        <TextInitialIcon :size="17" />
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
                <div class="flex flex-col gap-1 w-full items-start"
                    :class="{ 'text-red-400! ring-red-400 border-red-400!': localForm.invalidFields.has('interval') }">
                    <label for="interval" class="flex flex-row gap-0.75 items-center">
                        <TextInitialIcon :size="17" />
                        <p> Interval </p>
                    </label>
                    <InputNumber :invalid="localForm.invalidFields.has('interval')"
                        v-model="localForm.formValues.interval as any" inputId="horizontal-buttons" showButtons
                        buttonLayout="horizontal" :step="1" :min="1" :suffix="intervalSuffix" fluid
                        :class="{ 'border-red-400!': localForm.invalidFields.has('interval') }">
                        <template #incrementicon>
                            <span class="pi pi-plus" />
                        </template>
                        <template #decrementicon>
                            <span class="pi pi-minus" />
                        </template>
                    </InputNumber>
                    <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                        v-for="err in localForm.invalidFields.get('interval') || []">
                        <p class="text-sm! pl-0.5">
                            {{ err || 'Invalid Input!' }}
                        </p>
                    </Message>
                </div>

            </section>
        </Transition>
    </main>
</template>


<style scoped></style>