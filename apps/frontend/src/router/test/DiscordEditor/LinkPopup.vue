<script lang="ts" setup>
    import type { FormInstance, FormSubmitEvent } from '@primevue/forms/form';
    import { zodResolver } from '@primevue/forms/resolvers/zod';
    import { Plus } from 'lucide-vue-next';
    import { z } from 'zod'

    // Incoming Props:
    const props = defineProps<{
        popupSelection: string | undefined
    }>()

    // Form:
    const formRef = ref<FormInstance>()
    const resolver = zodResolver(z.object({
        urlHref: z.url('Please enter a valid Url.').startsWith('https://', "Url must start with \"https://\"."),
        linkText: z.string('Please enter a valid Link Title.').trim().normalize().min(1, 'Please enter a valid Link Title.')
    }))
    function submitForm(e: FormSubmitEvent) {
        if (e.valid) {
            let resultLink = `[${e.values?.linkText}](${e.values?.urlHref})`
            emits('addLink', resultLink)
        } else return
    }

    // Outgoing Emits:
    const emits = defineEmits<{
        addLink: [string]
    }>()

    // On Mount:
    onMounted(() => {
        // Auto Assign Selected Text to Text Input:
        if (props.popupSelection) {
            const value = props.popupSelection
            if (value == '') return
            formRef.value?.setFieldValue('linkText', props.popupSelection)
        }
    })

</script>


<template>
    <Form ref="formRef" v-slot="$form" @submit="submitForm" :resolver class="popup-form">

        <span class="input-wrap">
            <label for="urlHref" class="input-label">
                <Iconify icon="material-symbols:link-rounded" size="18" />
                <p class="font-semibold text-xs"> URL </p>
            </label>
            <InputText placeholder="https://sessionsbot.fyi" type="url" size="small" name="urlHref" fluid />
            <p v-for="err in $form.urlHref?.errors" class="w-full px-1.5 text-red-400 text-xs font-semibold">
                - {{ err?.message }}
            </p>
        </span>

        <span class="input-wrap">
            <label for="linkText" class="input-label">
                <Iconify icon="mdi:text" size="18" class="relative right-px" />
                <p class="font-semibold text-xs"> Link Text </p>
            </label>
            <InputText placeholder="Sessions Bot" type="text" size="small" name="linkText" fluid />
            <p v-for="err in $form.linkText?.errors" class="w-full px-1.5 text-red-400 text-xs font-semibold">
                - {{ err?.message }}
            </p>
        </span>


        <Button unstyled type="submit"
            class="px-2.75 pl-2 p-0.5 mt-1.25 mb-0.5 gap-0.5 text-sm font-bold uppercase flex items-center justify-center bg-white/20 rounded-full ring-ring ring cursor-pointer active:scale-95 hover:bg-white/15 transition-all">
            <Plus :size="16" />
            Add
        </Button>
    </Form>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .popup-form {
        --p-inputtext-placeholder-color: color-mix(in oklab, var(--color-ring), white 20%) !important;
        --p-select-placeholder-color: color-mix(in oklab, var(--color-ring), white 20%) !important;

        @apply flex gap-1.75 flex-col items-center justify-start content-center;
    }

    .input-wrap {
        @apply w-full flex flex-col gap-1 items-center justify-center;

        .input-label {
            @apply w-full flex flex-row gap-0.5 items-center justify-start;
        }

        /* Invalid Styles */
        &:has(.p-invalid) {
            .input-label {
                @apply !text-red-400;
            }
        }
    }

</style>