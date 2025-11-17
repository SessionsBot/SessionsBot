<script setup lang="ts">
    import type { FormInstance, FormResolverOptions, FormSubmitEvent } from '@primevue/forms/form';
    import z from 'zod';
    import { zodResolver } from '@primevue/forms/resolvers/zod'
    import type { TooltipOptions, } from 'primevue';
    import { Clock10Icon, Clock4Icon, TextInitialIcon } from 'lucide-vue-next';
    import type { ComponentPublicInstance, VNodeRef } from 'vue';
    import { DateTime } from 'luxon';

    const testForm = ref({

        /** Reffed Form Element */
        eRef: ref<FormInstance>(),

        /** Form Input Resolver */
        resolver: zodResolver(z.object({
            title: z.string('Please enter a valid title.').regex(/^[A-Za-z0-9 ]*$/, 'Can only include characters A-Z and 0-9.').trim().min(1, 'Title must have at least 1 character(s).'),
            description: z.string('Please enter a valid description.').trim().or(z.null()),
            startDate: z.date('Please enter a valid date.').refine((v) => v.getTime() >= new Date().getTime(), 'Date has already occurred.'),
            endDate: z.date('Please enter a valid date.').refine(
                (v) => {
                    const startDate = (testForm.value.eRef?.getFieldState('startDate')?.value || new Date(0)) as Date
                    const now = new Date();
                    return (v >= now && v >= startDate)
                },
                'End Date must occur after Start Date.'
            ).or(z.null())
        })),

        /** Form Input Options */
        options: ref({
            includeEndDate: true,
            maxSelectableDate: () => DateTime.now().plus({ year: 1 }).toJSDate(),
            minSelectableDate: () => DateTime.now().toJSDate()
        }),

        /** Form Submit Handler */
        submit: (e: FormSubmitEvent) => {
            console.log('Submitted', e)
        }

    })

    const inputToolTipPT = { root: 'translate-x-1.5! -translate-y-1.5!', text: 'text-xs!' }

</script>

<template>
    <main class="flex flex-1 flex-col flex-wrap justify-center items-center content-center">

        <Form unstyled v-slot="$form" :ref="(el) => testForm.eRef = <any>el" :resolver="testForm.resolver"
            @submit="testForm.submit"
            class="gap-2! max-w-full flex flex-col flex-wrap justify-center items-center content-center">

            <!-- INPUT: Session Title -->
            <div class="inputArea">
                <!-- Input/Label -->
                <label for="title" class="inputLabel" :class="{ 'text-red-400!': $form.title?.invalid }">
                    <TextInitialIcon :size="13" :stroke-width="2.75" />
                    <p> Title </p>
                </label>
                <!-- Text Input -->
                <InputText fluid type="text" size="small" name="title"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Give this session a brief title.', pt: { text: 'text-xs!', root: '' } }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in $form.title?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>


            <!-- INPUT: Session Description -->
            <div class="inputArea">
                <!-- Input/Label -->
                <label for="description" class="inputLabel" :class="{ 'text-red-400!': $form.description?.invalid }">
                    <TextInitialIcon :size="13" :stroke-width="2.75" />
                    <p> Description </p>
                </label>
                <!-- Text Input -->
                <TextArea fluid auto-resize size="small" name="description"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Give this session an optional description.', pt: inputToolTipPT }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in $form.description?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>


            <!-- INPUT: Session Start Time -->
            <div class="inputArea">
                <!-- Input/Label -->
                <label for="startDate" class="inputLabel" :class="{ 'text-red-400!': $form.startDate?.invalid }">
                    <Clock10Icon :size="13" :stroke-width="2.75" />
                    <p> Start Time </p>
                </label>
                <!-- Date Picker -->
                <DatePicker name="startDate" fluid date-format="m/d/y" :step-minute="5" size="small" :show-time="true"
                    hour-format="12" :max-date="testForm.options.maxSelectableDate()"
                    :min-date="testForm.options.minSelectableDate()" @value-change="testForm.eRef?.validate('endDate')"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Assign the sessions start date and time.', pt: inputToolTipPT }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in $form.startDate?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>


            <!-- INPUT: Session End Time -->
            <div class="inputArea">

                <!-- Input/Label -->
                <label for="endDate" class="inputLabel" :class="{ 'text-red-400!': $form.endDate?.invalid }">
                    <Clock4Icon :size="13" :stroke-width="2.75" />
                    <p> End Time </p>
                </label>
                <!-- Toggle -->
                <div class="flex w-full flex-row items-center justify-start relative right-1.5">
                    <ToggleSwitch class="scale-70" v-model="testForm.options.includeEndDate"
                        @value-change="(toggled) => { if (!toggled) { testForm.eRef?.setFieldValue('endDate', null) }; testForm.eRef?.validate('endDate'); }" />
                    <p class="font-medium text-[13px] text-white/85"> Include End Time? </p>
                </div>
                <!-- Date Picker -->
                <DatePicker name="endDate" fluid date-format="m/d/y" :step-minute="5" size="small" :show-time="true"
                    hour-format="12" :max-date="testForm.options.maxSelectableDate()"
                    :min-date="testForm.options.minSelectableDate()" v-if="testForm.options.includeEndDate"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Assign the sessions end date and time. (optional)', pt: inputToolTipPT }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in $form.endDate?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>

            <Button class="my-4 self-end! mr-2" label="Submit" type="submit" />
        </Form>




    </main>
</template>

<style scoped>
    @reference "../../styles/main.css";

    .inputArea {
        @apply flex flex-col !w-60 !sticky gap-2
    }

    .inputLabel {
        @apply text-white/75 relative right-1.5 font-medium gap-0.5 flex justify-start items-center flex-row flex-nowrap
    }

</style>