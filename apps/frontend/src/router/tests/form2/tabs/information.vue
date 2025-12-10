<script lang="ts" setup>
    import { BaselineIcon, Clock10Icon, Clock8Icon, ClockIcon, LinkIcon, TextInitialIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import z, { safeParse } from 'zod'
    import type { NewSessions_FieldNames } from '../sesForm.vue';

    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames) => void,
        validateFields: (fields: NewSessions_FieldNames[]) => void
    }>();
    const { invalidFields, validateField, validateFields } = props;

    // Form Values:
    const title = defineModel<string>('title');
    const description = defineModel<string>('description');
    const location = defineModel<string>('location');
    const startDate = defineModel<Date>('startDate');
    const endDate = defineModel<Date>('endDate');



    // Max/Min Session Dates:
    const minSelectDate = DateTime.now().toJSDate()
    const maxSelectDate = DateTime.now().plus({ year: 1 }).toJSDate();


    // Field Auto Validation:
    watch(() => title.value, (val) => {
        validateField('title');
    })
    watch(() => description.value, (val) => {
        validateField('description');
    })
    watch(() => location.value, (val) => {
        validateField('location');
    })
    watch(startDate, (val) => {
        validateFields(['startDate', 'endDate']);
    })
    watch(endDate, (val) => {
        validateFields(['startDate', 'endDate']);
    })

</script>


<template>
    <main class="flex w-full gap-3.5 flex-1 justify-center items-center content-center flex-wrap my-5">

        <!-- INPUT: Title -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('title') }">
            <label for="title" class="required-field flex flex-row gap-0.75 items-center">
                <BaselineIcon :size="17" />
                <p> Title </p>
            </label>
            <inputText name="title" fluid v-model="title" :invalid="invalidFields.has('title')" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields.get('title') || []">
                <p class="text-sm! pl-0.5">
                    {{ err || 'Invalid Input!' }}
                </p>
            </Message>
        </div>


        <!-- INPUT: Description -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('description') }">
            <label for="description" class="flex flex-row gap-0.75 items-center">
                <TextInitialIcon :size="17" />
                <p> Description </p>
            </label>
            <inputText name="description" fluid v-model="description" :invalid="invalidFields.has('description')" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields.get('description') || []">
                <p class="text-sm! pl-0.5">
                    {{ err || 'Invalid Input!' }}
                </p>
            </Message>
        </div>


        <!-- INPUT: Location -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('location') }">
            <label for="location" class="flex flex-row gap-0.75 items-center">
                <LinkIcon :size="17" />
                <p> Location </p>
            </label>
            <inputText name="location" fluid v-model="location" :invalid="invalidFields.has('location')" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields.get('location') || []">
                <p class="text-sm! pl-0.5">
                    {{ err || 'Invalid Input!' }}
                </p>
            </Message>
        </div>


        <!-- INPUT: Start Time -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('startDate') }">
            <label for="startDate" class="required-field flex flex-row gap-0.75 items-center">
                <ClockIcon :size="17" />
                <p> Start Time </p>
            </label>
            <DatePicker name="startDate" v-model="startDate" fluid date-format="m/d/y" class=" flex w-full"
                :show-time="true" hour-format="12" :max-date="maxSelectDate" :min-date="minSelectDate"
                :invalid="invalidFields.has('startDate')" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields.get('startDate') || []">
                <p class="text-sm! pl-0.5">
                    {{ err || 'Invalid Input!' }}
                </p>
            </Message>
        </div>


        <!-- INPUT: End Time -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('endDate') }">
            <label for="endDate" class="flex flex-row gap-0.75 items-center">
                <Clock8Icon :size="17" />
                <p> End Time </p>
            </label>
            <DatePicker name="endDate" v-model="endDate" fluid date-format="m/d/y" class="w-full flex "
                :show-time="true" hour-format="12" :max-date="maxSelectDate" :min-date="startDate || minSelectDate"
                :invalid="invalidFields.has('endDate')" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400! hover:bg-white/5"
                v-for="err in invalidFields.get('endDate') || []">
                <p class="text-sm! pl-0.5">
                    {{ err || 'Invalid Input!' }}
                </p>
            </Message>
        </div>


    </main>
</template>


<style scoped>

    .required-field {
        position: relative;
    }

    .required-field::after {
        z-index: 2;
        content: "*";
        font-size: small;
        text-align: center;
        position: absolute;
        padding-top: 5px;
        right: -11px;
        bottom: 19.5px;
        width: 12px;
        height: 12px;
        border-radius: 5px;
        color: rgba(255, 0, 0, 0.507);
        background: rgba(218, 69, 69, 0);
    }

</style>