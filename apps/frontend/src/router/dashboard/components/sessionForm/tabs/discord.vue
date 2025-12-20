<script lang="ts" setup>
    import { BaselineIcon, ClockArrowUpIcon, CalendarArrowUpIcon } from 'lucide-vue-next';
    import type { NewSessions_FieldNames } from '../sesForm.vue';
    import InputTitle from '../labels/inputTitle.vue';
    import InputErrors from '../labels/inputErrors.vue';
    import type { AppUserGuilds } from '@sessionsbot/shared';


    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames) => void,
        validateFields: (fields: NewSessions_FieldNames[]) => void
    }>()
    const { invalidFields, validateField, validateFields } = props;

    // Guild Channels - Model:
    const guildChannels = defineModel<{ all: any, sendable: any }>('guildChannels');

    // Form Values:
    const channelId = defineModel<string>('channelId');
    const postTime = defineModel<string | any>('postTime');
    const postDay = defineModel<string | any>('postDay');
    const nativeEvents = defineModel<string | any>('nativeEvents');
    const postInThread = defineModel<string | any>('postInThread');
    // Select Post Channel Options:
    const selectChannelOpts = computed(() => {
        if (!guildChannels || typeof guildChannels != typeof []) return [];
        let channelCategories: any[] = [];
        guildChannels.value?.all.forEach((val: any) => {
            if (val?.type == 4) {
                const catChannels = guildChannels.value?.sendable?.filter((ch: any) => ch.parentId == val.id).sort((a: any, b: any) => a.rawPosition - b.rawPosition);
                if (catChannels?.length) {
                    channelCategories.push({ name: val?.name, items: catChannels })
                }
            }
        })
        return channelCategories;
    });


    // Set/Toggle Post Day - Fn:
    const setPostDay = (opt: string) => {
        postDay.value = opt;
        validateFields(['postDay', 'postTime']);
    }

</script>


<template>
    <main class="flex w-full gap-3.5 flex-1 justify-center items-center content-center flex-wrap my-5">

        <!-- INPUT: Post Channel -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('channelId') }">
            <InputTitle fieldTitle="Post Channel" required :icon="BaselineIcon" />
            <Select v-model="channelId" @value-change="(val) => validateField('channelId')" fluid
                :options="selectChannelOpts" option-group-label="name" option-group-children="items"
                :option-label="(opt) => opt?.name" :option-value="(opt) => opt?.id" />
            <InputErrors fieldName="channelId" :invalidFields />

        </div>

        <!-- INPUT: Post Day -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('postDay') }">
            <InputTitle fieldTitle="Post Day" required :icon="CalendarArrowUpIcon" />
            <!-- Selection Input -->
            <div class="gap-3 p-1 px-0 w-full h-fit flex flex-wrap justify-start items-center content-center">

                <Button class="postDayBtn" v-for="opt in ['Day of', 'Day before']" unstyled :title="opt"
                    :class="{ 'bg-indigo-500/70! border-white!': postDay == opt }" @click="setPostDay(opt)">
                    <p class="text-sm font-medium p-1"> {{ opt }} </p>
                </Button>

            </div>
            <InputErrors fieldName="postDay" :invalidFields />

        </div>

        <!-- INPUT: Post Time -->
        <div class="flex relative bottom-1 flex-col gap-1 w-full items-start"
            :class="{ 'text-red-400! ring-red-400!': invalidFields.has('postTime') }">
            <InputTitle fieldTitle="Post Time" required :icon="ClockArrowUpIcon" />
            <DatePicker input-id="postTime" time-only fluid class="w-full!" hour-format="12"
                @value-change="() => { validateFields(['postTime', 'startDate']) }" v-model="postTime" />
            <InputErrors fieldName="postTime" :invalidFields />
        </div>

        <!-- INPUT: Post in Thread -->
        <div class="flex flex-row gap-1 w-full items-start">
            <ToggleSwitch input-id="postInThread" v-model="postInThread" class="scale-85"
                @value-change="(val) => validateField('postInThread')" />
            <label for="postInThread" class="gap-0.25 flex-row items-center">
                <p class="inline!"> Post in Thread </p>
            </label>
        </div>

        <!-- INPUT: Native Events -->
        <div class="flex flex-row gap-1 w-full items-start">
            <ToggleSwitch input-id="nativeEvents" v-model="nativeEvents" class="scale-85"
                @value-change="(val) => validateField('nativeEvents')" />
            <label for="nativeEvents" class="gap-0.25 flex-row items-center">
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