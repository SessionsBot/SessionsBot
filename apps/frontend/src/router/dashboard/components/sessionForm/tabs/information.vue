<script lang="ts" setup>
    import { BaselineIcon, Clock8Icon, ClockIcon, Globe2Icon, LinkIcon, TextInitialIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import z from 'zod'
    import type { NewSessions_FieldNames } from '../sesForm.vue';
    import { getTimeZones, } from '@vvo/tzdb'
    import type { AutoCompleteCompleteEvent, AutoCompleteOptionSelectEvent } from 'primevue';
    import InputTitle from '../labels/inputTitle.vue';
    import InputErrors from '../labels/inputErrors.vue';

    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames) => void,
        validateFields: (fields: NewSessions_FieldNames[]) => void
        formAction: 'edit' | 'new'
    }>();
    const { invalidFields, validateField, validateFields } = props;

    // Form Values:
    const title = defineModel<string>('title');
    const description = defineModel<string>('description');
    const url = defineModel<string>('url');
    const startDate = defineModel<Date>('startDate');
    const endDate = defineModel<Date>('endDate');
    const timeZone = defineModel<object | string>('timeZone');


    // Max/Min Session Dates:
    const minSelectDate = computed(() => { return (props.formAction == 'new') ? DateTime.now().toJSDate() : undefined })

    // Timezone Opts/Selection:
    const timeZoneSuggestions = ref<any[]>([]);
    const timeZoneSearch = (e: AutoCompleteCompleteEvent) => {
        const { query } = e;
        timeZoneSuggestions.value = [];
        const zones = getTimeZones({ includeUtc: true });
        const result = zones.filter((z) => {
            if (z.name.toLowerCase().includes(query.toLowerCase())) return true;
            else if (z.alternativeName.toLowerCase().includes(query.toLowerCase())) return true;
            else if (z.abbreviation.toLowerCase().includes(query.toLowerCase())) return true;
            else if (z.mainCities.some((c) => c.toLowerCase().includes(query.toLowerCase()))) return true;
        }).map((z) => {
            const offsetHrs = (z.rawOffsetInMinutes / 60)
            return {
                name: `${z.alternativeName} - ${z.mainCities[0] || ''} (${offsetHrs}:00)`,
                value: z.name
            }
        })
        timeZoneSuggestions.value = result;
    }
    function selectTimeZone(e: AutoCompleteOptionSelectEvent) {
        // Update TimeZone:
        const { value } = e;
        timeZone.value = value
        // Validate Field:
        validateField('timeZone');
    }

</script>


<template>
    <main class="flex w-full gap-3.5 flex-1 justify-center items-center content-center flex-wrap my-5">

        <!-- INPUT: Title -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('title') }">
            <InputTitle fieldTitle="Title" required :icon="BaselineIcon" />
            <inputText name="title" fluid v-model="title" @focusout="validateField('title')"
                :invalid="invalidFields.has('title')" />
            <InputErrors fieldName="title" :invalidFields />
        </div>


        <!-- INPUT: Description -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('description') }">
            <InputTitle fieldTitle="Description" :icon="TextInitialIcon" />
            <inputText name="description" fluid v-model="description" @focusout="validateField('description')"
                :invalid="invalidFields.has('description')" />
            <InputErrors fieldName="description" :invalidFields />
        </div>


        <!-- INPUT: url -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('url') }">
            <InputTitle fieldTitle="Url" :icon="LinkIcon" :show-help="{ path: '/' }" />
            <inputText name="url" fluid v-model="url"
                @focusin="() => { if (!url || url.trim() == '') { url = `https://` } }" @focusout="validateField('url')"
                :invalid="invalidFields.has('url')" />
            <InputErrors fieldName="url" :invalidFields />
        </div>


        <!-- INPUT: Start Time -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('startDate') }">
            <InputTitle fieldTitle="Start Time" required :icon="ClockIcon" />
            <DatePicker name="startDate" v-model="startDate" fluid date-format="m/d/y" class=" flex w-full"
                :show-time="true" show-clear hour-format="12" :min-date="minSelectDate"
                @value-change="validateFields(['startDate', 'endDate'])" :invalid="invalidFields.has('startDate')" />
            <InputErrors fieldName="startDate" :invalidFields />
        </div>


        <!-- INPUT: End Time -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('endDate') }">
            <InputTitle fieldTitle="End Time" :icon="Clock8Icon" />
            <DatePicker name="endDate" v-model="endDate" fluid date-format="m/d/y" class="w-full flex "
                :show-time="true" show-clear hour-format="12" :min-date="startDate || minSelectDate"
                @value-change="validateFields(['startDate', 'endDate'])" :invalid="invalidFields.has('endDate')" />
            <InputErrors fieldName="endDate" :invalidFields />
        </div>


        <!-- INPUT: Time Zone -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('timeZone') }">
            <InputTitle fieldTitle="Time Zone" required :icon="Globe2Icon" :show-help="{ path: '/' }" />
            <AutoComplete class="w-full" v-model="timeZone" @option-select="selectTimeZone"
                :invalid="invalidFields.has('timeZone')" :suggestions="timeZoneSuggestions" @complete="timeZoneSearch"
                forceSelection option-label="name" dropdown show-clear fluid auto-option-focus />
            <InputErrors fieldName="timeZone" :invalidFields />
        </div>


    </main>
</template>


<style scoped></style>