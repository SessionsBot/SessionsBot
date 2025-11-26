<script lang="ts" setup>
    import { Clock10Icon, TextInitialIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import z, { safeParse } from 'zod'
    import type { NewSessions_FieldNames } from '../sesForm.vue';
    import { defaultWindow } from '@vueuse/core';

    // Outgoing Emits:
    const emit = defineEmits<{
        validateField: [name: NewSessions_FieldNames, value: any]
    }>()

    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: {
            [fieldName: string]: any[];
        },
        validateField: (name: NewSessions_FieldNames, value: any) => void
    }>();
    const { invalidFields, validateField } = props;

    // Form Values:
    const title = defineModel<string>('title');
    const description = defineModel<string>('description');
    const startDate = defineModel<Date>('startDate');
    const endDate = defineModel<Date>('endDate');



    // Max/Min Session Dates:
    const minSelectDate = DateTime.now().toJSDate()
    const maxSelectDate = DateTime.now().plus({ year: 1 }).toJSDate();

    // Auto fill session end date:
    const firstStartDateSelection = ref(true);
    const onStartDateEntered = (startDate: any) => {
        // Apply default end date on first selection:
        if (firstStartDateSelection.value) {
            firstStartDateSelection.value = false;
            const defaultEnd = DateTime.fromJSDate(startDate).plus({ hours: 1 }).toJSDate();
            endDate.value = defaultEnd;
        };
    }


    // Field Auto Validation:
    watch(() => title.value, (val) => {
        validateField('title', val);
    }, { deep: true })
    watch(() => description.value, (val) => {
        validateField('description', val);
    })
    watch(startDate, (val) => {
        validateField('startDate', val);
    })
    watch(endDate, (val) => {
        validateField('endDate', val);
    })

</script>


<template>
    <main class="flex w-full gap-3.5 flex-1 justify-center items-center content-center flex-wrap">

        <!-- INPUT: Title -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields?.title?.length }">
            <label for="title" class="flex flex-row gap-0.75 items-center">
                <TextInitialIcon :size="17" />
                <p> Title </p>
            </label>
            <inputText name="title" fluid v-model="title" :invalid="((invalidFields?.title?.length || 0) >= 1)" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields?.title">
                <p class="text-sm! pl-0.5">
                    {{ err?.message || err[0]?.message || 'Invalid Input!' }}
                </p>
            </Message>
        </div>

        <!-- INPUT: Description -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields?.description?.length }">
            <label for="description" class="flex flex-row gap-0.75 items-center">
                <TextInitialIcon :size="17" />
                <p> Description </p>
            </label>
            <inputText name="description" fluid v-model="description"
                :invalid="((invalidFields?.description?.length || 0) >= 1)" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields?.description">
                <p class="text-sm! pl-0.5"> {{ err?.message || err[0]?.message || 'Invalid Input!' }}</p>
            </Message>
        </div>


        <!-- INPUT: Start Time -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields?.startDate?.length }">
            <label for="startDate" class="flex flex-row gap-0.75 items-center">
                <Clock10Icon :size="17" />
                <p> Start Time </p>
            </label>
            <DatePicker name="startDate" v-model="startDate" fluid date-format="m/d/y" :step-minute="5"
                class="w-full flex flex-1 " :show-time="true" hour-format="12" :max-date="maxSelectDate"
                :min-date="minSelectDate" @value-change="onStartDateEntered"
                :invalid="(invalidFields?.startDate?.length || 0) >= 1" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields?.startDate">
                <p class="text-sm! pl-0.5"> {{ err.message || err[0]?.message || 'Invalid Input!' }}</p>
            </Message>
        </div>





    </main>
</template>


<style scoped></style>