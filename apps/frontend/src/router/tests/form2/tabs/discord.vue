<script lang="ts" setup>
    import { BaselineIcon, ClockArrowUpIcon, CalendarArrowUpIcon } from 'lucide-vue-next';
    import type { NewSessions_FieldNames } from '../sesForm.vue';


    // Outgoing Emits:
    const emit = defineEmits<{
        validateField: [name: NewSessions_FieldNames, value: any],
    }>();

    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames, value: any) => void
    }>();
    const { invalidFields, validateField } = props;

    // Form Values:
    const channelId = defineModel<string>('channelId');
    const postTime = defineModel<string | any>('postTime');
    const postDay = defineModel<string | any>('postDay');
    const nativeEvents = defineModel<string | any>('nativeEvents');

    const setPostDay = (opt: string) => {
        postDay.value = opt;
        validateField('postDay', opt)
    }


</script>


<template>
    <main class="flex w-full gap-3.5 flex-1 justify-center items-center content-center flex-wrap my-5">

        <!-- INPUT: Post Channel -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('channelId') }">
            <label for="postChannel" class="required-field flex flex-row gap-0.75 items-center">
                <BaselineIcon :size="17" />
                <p> Post Channel </p>
            </label>
            <Select v-model="channelId" @value-change="(val) => validateField('channelId', val)" fluid
                :options="['97840324993842345667253', '32895482394823948932472', '37892934762398345342876']" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields.get('channelId') || []">
                <p class="text-sm! pl-0.5">
                    {{ err || 'Invalid Input!' }}
                </p>
            </Message>
        </div>

        <!-- INPUT: Post Day -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('postDay') }">
            <label for="postDay" class="required-field flex flex-row gap-0.75 items-center">
                <CalendarArrowUpIcon :size="17" />
                <p> Post Day </p>
            </label>
            <!-- Selection Input -->
            <div class="gap-3 p-1 px-0 w-full h-fit flex flex-wrap justify-start items-center content-center">

                <Button class="postDayBtn" v-for="opt in ['Day of', 'Day before']" unstyled :title="opt"
                    :class="{ 'bg-indigo-500/70! border-white!': postDay == opt }" @click="setPostDay(opt)">
                    <p class="text-sm font-medium p-1"> {{ opt }} </p>
                </Button>

            </div>

            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields.get('postDay') || []">
                <p class="text-sm! pl-0.5">
                    {{ err || 'Invalid Input!' }}
                </p>
            </Message>
        </div>

        <!-- INPUT: Post Time -->
        <div class="flex relative bottom-1 flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('postTime') }">
            <label for="postTime" class="required-field flex flex-row gap-0.75 items-center">
                <ClockArrowUpIcon :size="17" />
                <p> Post Time </p>
            </label>
            <DatePicker input-id="postTime" time-only fluid class="w-full!" hour-format="12"
                @value-change="(val) => validateField('postTime', val)" v-model="postTime" />
            <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                v-for="err in invalidFields.get('postTime') || []">
                <p class="text-sm! pl-0.5">
                    {{ err || 'Invalid Input!' }}
                </p>
            </Message>
        </div>

        <!-- INPUT: Native Events -->
        <div class="flex flex-row gap-1 w-full items-start">
            <ToggleSwitch input-id="recurrenceEnabled" v-model="nativeEvents" class="scale-85"
                @value-change="(val) => validateField('nativeEvents', val)" />
            <label for="recurrenceEnabled" class="gap-0.25 flex-row items-center">
                <p class="inline!"> Native Discord Events </p>
            </label>
        </div>
    </main>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .postDayBtn {
        @apply px-2 py-1 gap-1 grow bg-zinc-800 border-2 border-white rounded-md cursor-pointer flex justify-center items-center transition-all;
    }

    .postDayBtn:hover {
        @apply border-indigo-300
    }
</style>