<script setup lang="ts">
    import { DateTime } from 'luxon';
    import type { TooltipOptions } from 'primevue';
    import { Clock10Icon, Clock4Icon, FileTypeIcon, LinkIcon, TextInitialIcon } from 'lucide-vue-next';
    import type { FormFieldState, FormInstance, FormSubmitEvent } from '@primevue/forms/form';
    import type { zodResolver } from '@primevue/forms/resolvers/zod'
    import z from 'zod'
    import { useForm, type useFormReturn } from '@primevue/forms/useform';

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

    // Styling Pass Through(s):
    const inputToolTipPT = { root: 'translate-x-1.5! -translate-y-1.5!', text: 'text-xs!' }


</script>

<template>
    <main class="gap-2! w-full flex flex-col flex-wrap justify-center items-center content-center">
        <!-- Form/Page Header -->
        <span
            class="bg-zinc-900 border-b-white/50 border-b-2 p-1 w-full gap-1 flex flex-row flex-wrap justify-center items-center">
            <i class="pi pi-discord p-px opacity-50" />
            <p class="opacity-50 font-medium text-sm"> Discord Settings </p>
        </span>

        <!-- Form Fields -->
        <span class="flex flex-col flex-wrap justify-center items-center gap-2 mt-2">
            <!-- INPUT: Session Title -->
            <div class="inputArea">
                <!-- Input/Label -->
                <label for="channelId" class="inputLabel" :class="{ 'text-red-400!': form$?.channelId?.invalid }">
                    <FileTypeIcon :size="13" :stroke-width="2.75" />
                    <p> Signup Channel </p>
                </label>
                <!-- Text Input -->
                <InputText fluid type="text" size="small" name="channelId"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Assign the signup channel this session will be posted to..', pt: { text: 'text-xs!', root: '' } }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in form$.channelId?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>

            <p @click="console.info(form$)">click</p>


            <!-- INPUT: Session Description -->
            <div class="inputArea" hidden>
                <!-- Input/Label -->
                <label for="description" class="inputLabel" :class="{ 'text-red-400!': form$?.description?.invalid }">
                    <TextInitialIcon :size="13" :stroke-width="2.75" />
                    <p> Description </p>
                </label>
                <!-- Text Input -->
                <TextArea fluid auto-resize size="small" name="description"
                    v-tool-tip.bottom="<TooltipOptions>{ value: 'Give this session an optional description.', pt: inputToolTipPT }" />
                <!-- Invalid Message -->
                <Message unstyled class="w-full! text-wrap! flex-wrap! font-medium text-red-400!"
                    v-for="err in form$?.description?.errors">
                    <p class="text-[13px]! pl-0.5"> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>
            </div>

            <Button class="my-4 self-end! mr-2" label="Submit" @click="sesForm.submit(form$)" />

        </span>
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