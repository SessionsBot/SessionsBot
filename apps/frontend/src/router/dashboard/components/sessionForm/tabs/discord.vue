<script lang="ts" setup>
    import { BaselineIcon, ClockArrowUpIcon, CalendarArrowUpIcon, BellIcon, ArrowUpCircleIcon } from 'lucide-vue-next';
    import type { NewSessions_FieldNames } from '../sesForm.vue';
    import InputTitle from '../labels/inputTitle.vue';
    import InputErrors from '../labels/inputErrors.vue';
    import type { AppUserGuilds } from '@sessionsbot/shared';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import useNotifier from '@/stores/notifier';

    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames) => void,
        validateFields: (fields: NewSessions_FieldNames[]) => void
    }>()
    const { invalidFields, validateField, validateFields } = props;

    // Services:
    const notifier = useNotifier();
    const dashboard = useDashboardStore();
    // Guild Data:
    const guildChannels = computed(() => dashboard.guildData.channels);
    const guildRoles = computed(() => dashboard.guildData.roles.state);
    const mentionRolesAllowed = computed(() => dashboard.guildData.subscription?.state?.limits?.ALLOW_MENTION_ROLES || false)

    // Form Values:
    const channelId = defineModel<string>('channelId');
    const postTime = defineModel<string | any>('postTime');
    const postDay = defineModel<string | any>('postDay');
    const mentionRoles = defineModel<string | any>('mention_roles'); // stopped here - adding mention roles input - fixing verify guild member api (middleware)
    const nativeEvents = defineModel<string | any>('nativeEvents');
    const postInThread = defineModel<string | any>('postInThread');
    // Select Post Channel Options:
    const selectChannelOpts = computed(() => {
        if (!guildChannels.value || typeof guildChannels.value != typeof []) return [];
        let channelCategories: any[] = [];
        guildChannels.value?.state?.all.forEach((val: any) => {
            if (val?.type == 4) {
                const catChannels = guildChannels.value?.state?.sendable?.filter((ch: any) => ch.parentId == val.id).sort((a: any, b: any) => a.rawPosition - b.rawPosition);
                if (catChannels?.length) {
                    channelCategories.push({ name: val?.name, items: catChannels })
                }
            }
        })
        return channelCategories;
    });
    // Mention Roles Options:
    const mentionRolesOpts = computed(() => {
        if (!guildRoles.value || typeof guildRoles.value != typeof []) return [];
        return guildRoles.value?.map(r => {
            if (r?.name === '@everyone') {
                return { name: 'Everyone', value: r?.id }
            }
            else return { name: r?.name, value: r?.id }
        })
    });

    // Watch Mention Roles:
    watch(mentionRoles, (v) => console.info('Mention Roles - Changed', v))


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
            :class="{ 'text-invalid-1!': invalidFields.has('channelId') }">
            <InputTitle fieldTitle="Post Channel" required :icon="BaselineIcon" />
            <Select v-model="channelId" @value-change="(val) => validateField('channelId')" fluid
                :options="selectChannelOpts" option-group-label="name" option-group-children="items"
                :option-label="(opt) => opt?.name" :option-value="(opt) => opt?.id" />
            <InputErrors fieldName="channelId" :invalidFields />

        </div>

        <!-- INPUT: Post Day -->
        <div class="flex flex-col gap-1 w-full items-start"
            :class="{ 'text-invalid-1!': invalidFields.has('postDay') }">
            <InputTitle fieldTitle="Post Day" required :icon="CalendarArrowUpIcon" />
            <!-- Selection Input -->
            <div class="gap-3 p-1 px-0 w-full h-fit flex flex-wrap justify-start items-center content-center">

                <Button class="postDayBtn" v-for="opt in ['Day of', 'Day before']" unstyled :title="opt"
                    :class="{ 'bg-brand-1/80! border-text-1!': postDay == opt }" @click="setPostDay(opt)">
                    <p class="text-sm font-medium p-1"> {{ opt }} </p>
                </Button>

            </div>
            <InputErrors fieldName="postDay" :invalidFields />

        </div>

        <!-- INPUT: Post Time -->
        <div class="flex  flex-col gap-1 w-full items-start"
            :class="{ 'text-invalid-1!': invalidFields.has('postTime') }">
            <InputTitle fieldTitle="Post Time" required :icon="ClockArrowUpIcon" />
            <DatePicker input-id="postTime" time-only fluid class="w-full!" :step-minute="5" hour-format="12"
                @value-change="() => { validateFields(['postTime', 'startDate']) }" v-model="postTime" />
            <InputErrors fieldName="postTime" :invalidFields />
        </div>


        <!-- INPUT: Mention Roles -->
        <div class="flex relative flex-col gap-1 w-full items-start"
            :class="{ 'text-invalid-1!': invalidFields.has('mention_roles') }">
            <InputTitle fieldTitle="Mention Roles" :icon="BellIcon" premium-type="PREMIUM" :show-help="{ path: '/' }" />
            <!-- Input Area - Wrap -->
            <span class="w-full relative flex">
                <MultiSelect :disabled="!mentionRolesAllowed" v-model="mentionRoles"
                    @value-change="(val) => validateField('mention_roles')" fluid :options="mentionRolesOpts"
                    :option-label="(opt) => opt?.name" :option-value="(opt) => opt?.value" filter />
                <!-- Premium Feature - Alerter -->
                <span v-if="!mentionRolesAllowed" @click="notifier.send({
                    level: 'upgrade', header: 'Premium Feature!', content: `Your current subscription plan doesn't include this feature. <br><span class='
                    text-xs opacity-50'>Consider upgrading today! </span>` })" class="absolute cursor-pointer font-bold gap-0.5 rounded-md -inset-px w-[calc(100%+2px)]
                h-[calc(100%+2px)] bg-brand-1/7 flex items-center p-2 text-text-soft">
                    <ArrowUpCircleIcon class="p-0.25" />
                    Upgrade Bot
                </span>
            </span>

            <InputErrors fieldName="mention_roles" :invalidFields />



        </div>


        <!-- INPUT: Post in Thread -->
        <div class="mt-2 flex flex-row gap-1 w-full items-start">
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
        background: color-mix(in oklab, var(--c-bg-2), black 11%);
        @apply px-2 py-1 gap-1 grow border-2 border-ring-soft rounded-md cursor-pointer flex justify-center items-center transition-all;
    }

    .postDayBtn:hover {
        @apply border-indigo-300
    }
</style>