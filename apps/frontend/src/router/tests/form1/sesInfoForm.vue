<script setup lang="ts">
    import { DateTime } from 'luxon';
    import type { TooltipOptions } from 'primevue';
    import { ClipboardCheckIcon, Clock10Icon, Clock4Icon, LinkIcon, NewspaperIcon, TextInitialIcon } from 'lucide-vue-next';
    import type { FormFieldState } from '@primevue/forms/form';

    const formInView = defineModel<'discord' | 'information' | 'signup'>('formInView');

    const props = defineProps<{
        sesForm: any,
        formInView: any,
        form$: {
            register: (field: string, options: any) => any;
            reset: () => void;
            valid: boolean;
        } & {
            [key: string]: FormFieldState;
        }
    }>();

    // Auto fill session end date:
    const firstStartDateSelection = ref(true);
    const startDateModel = ref();
    const endDateModel = ref();
    const onStartDateEntered = (startDate: any) => {
        // Apply default end date on first selection:
        if (firstStartDateSelection.value) {
            firstStartDateSelection.value = false;
            const defaultEnd = DateTime.fromJSDate(startDate).plus({ hours: 1 }).toJSDate();
            props.sesForm.eRef?.setFieldValue('endDate', defaultEnd)
            endDateModel.value = defaultEnd
        };
        // Validate end date:
        props.sesForm.eRef?.validate('endDate');
    }

    // Styling Pass Through(s):
    const inputToolTipPT = { root: 'translate-x-1.5! -translate-y-1.5!', text: 'text-xs!' }


</script>

<template>
    <main class="gap-2! w-full flex flex-col flex-wrap justify-center items-center content-center">

        <!-- Form/Page Header -->
        <span
            class="bg-zinc-900 border-b-white/50 border-b-2 p-1 w-full gap-1 flex flex-row flex-wrap justify-center items-center">
            <NewspaperIcon class="opacity-50" :size="16" />
            <p class="opacity-50 font-medium text-sm"> Session Information </p>
        </span>

        <!-- Form Fields -->
        <span class="flex flex-col flex-wrap justify-center items-center gap-2 mt-2">
            <!-- INPUT: Session Title -->
            <div class="inputArea">
                <!-- Input/Label -->
                <label for="title" class="inputLabel" :class="{ 'text-red-400!': form$.title?.invalid }">
                    <TextInitialIcon :size="13" :stroke-width="2.75" />
                    <p> Title </p>
                </label>
                <!-- Text Input -->
                <InputText fluid type="text" size="small" name="title"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Give this session a brief title.', pt: { text: 'text-xs!', root: '' } }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in form$.title?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>


            <!-- INPUT: Session Description -->
            <div class="inputArea">
                <!-- Input/Label -->
                <label for="description" class="inputLabel" :class="{ 'text-red-400!': form$.description?.invalid }">
                    <TextInitialIcon :size="13" :stroke-width="2.75" />
                    <p> Description </p>
                </label>
                <!-- Text Input -->
                <TextArea fluid auto-resize size="small" name="description"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Give this session an optional description.', pt: inputToolTipPT }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in form$.description?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>


            <!-- INPUT: Session Start Time -->
            <div class="inputArea">
                <!-- Input/Label -->
                <label for="startDate" class="inputLabel" :class="{ 'text-red-400!': form$.startDate?.invalid }">
                    <Clock10Icon :size="13" :stroke-width="2.75" />
                    <p> Start Time </p>
                </label>
                <!-- Date Picker -->
                <DatePicker name="startDate" :model-value="startDateModel" fluid date-format="m/d/y" :step-minute="5"
                    size="small" :show-time="true" hour-format="12" :max-date="sesForm.options.maxSelectableDate()"
                    :min-date="sesForm.options.minSelectableDate()" @value-change="onStartDateEntered"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Assign the sessions start date and time.', pt: inputToolTipPT }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in form$.startDate?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>


            <!-- INPUT: Session End Time -->
            <div class="inputArea">

                <!-- Input/Label -->
                <label for="endDate" class="inputLabel" :class="{ 'text-red-400!': form$.endDate?.invalid }">
                    <Clock4Icon :size="13" :stroke-width="2.75" />
                    <p> End Time </p>
                </label>
                <!-- Toggle -->
                <div class="flex w-full flex-row items-center justify-start relative right-1.5">
                    <ToggleSwitch class="scale-70" v-model="sesForm.options.includeEndDate"
                        @value-change="(toggled) => { if (!toggled) { sesForm.eRef?.setFieldValue('endDate', null); endDateModel = '' }; sesForm.eRef?.validate('endDate'); }" />
                    <p class="font-medium text-[13px] text-white/85"> Include End Time? </p>
                </div>
                <!-- Date Picker -->
                <DatePicker name="endDate" :model-value="endDateModel" fluid date-format="m/d/y" :step-minute="5"
                    size="small" :show-time="true" hour-format="12" :max-date="sesForm.options.maxSelectableDate()"
                    :min-date="sesForm.options.minSelectableDate()" v-if="sesForm.options.includeEndDate"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Assign the sessions end date and time. (optional)', pt: inputToolTipPT }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in form$.endDate?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>


            <!-- INPUT: Session Location/url -->
            <div class="inputArea">

                <!-- Input/Label -->
                <label for="location" class="inputLabel" :class="{ 'text-red-400!': form$.location?.invalid }">
                    <LinkIcon :size="13" :stroke-width="2.75" />
                    <p> Location/Url </p>
                </label>
                <!-- Toggle -->
                <div class="flex w-full flex-row items-center justify-start relative right-1.5">
                    <ToggleSwitch class="scale-70" v-model="sesForm.options.includeLocation"
                        @value-change="(toggled) => { if (!toggled) { sesForm.eRef?.setFieldValue('location', null); }; sesForm.eRef?.validate('location'); }" />
                    <p class="font-medium text-[13px] text-white/85"> Include Location? </p>
                </div>
                <!-- Text Input -->
                <InputText fluid type="text" size="small" name="location" v-if="sesForm.options.includeLocation"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Provide the full https:// url for this session. (optional)', pt: { text: 'text-xs!', root: '' } }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in form$.location?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>
        </span>


        <Button class="m-4 self-end!" label="Continue" @click="formInView = 'discord'" />
    </main>
</template>


<style scoped>
    @reference "../../../styles/main.css";

    .inputArea {
        @apply flex flex-col !w-60 !sticky gap-2
    }

    .inputLabel {
        @apply text-white/75 relative right-1.5 top-0.5 font-medium gap-0.5 flex justify-start items-center flex-row flex-nowrap
    }

</style>