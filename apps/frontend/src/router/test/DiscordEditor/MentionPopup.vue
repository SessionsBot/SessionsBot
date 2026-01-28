<script lang="ts" setup>
    import type { FormInstance, FormSubmitEvent } from '@primevue/forms/form';
    import { zodResolver } from '@primevue/forms/resolvers/zod';
    import { Plus } from 'lucide-vue-next';
    import { z } from 'zod'

    // Incoming Props:
    const props = defineProps<{
        popupSelection: string | undefined
    }>()




    // Vars:
    const mentionOptions = [
        'User', 'Role', 'Channel'
    ] as const;
    const mentionTypeSelected = ref<typeof mentionOptions[number]>()

    // Form Ref:
    const formRef = ref<FormInstance>()

    // Discord Id Schema
    const discordIdSchema = z
        .string()
        .trim()
        .transform((val) => {
            // Strip Discord mention formatting if present
            const match = val.match(/\d+/)
            return match?.[0] ?? val
        })
        .refine(
            (val) => /^\d+$/.test(val),
            { message: 'Discord ID must contain only numbers' }
        )
        .refine(
            (val) => val.length >= 17,
            { message: 'Discord ID must be at least 17 digits long' }
        )
    // Form Schema:
    const resolver = zodResolver(z.object({
        mentionType: z.literal(mentionOptions, 'Please select a valid mention type.'),
        mentionValue: discordIdSchema
    }))

    function submitForm(e: FormSubmitEvent) {
        if (e.valid) {
            const mentionId = e.values?.mentionValue
            const mentionText = () => {
                switch (mentionTypeSelected.value) {
                    case 'Channel':
                        return `<#${mentionId}>`
                    case 'Role':
                        return `<@&${mentionId}>`
                    case 'User':
                    default:
                        return `<@${mentionId}>`
                }
            }
            // Add to form:
            emits('addMention', mentionText())
        } else return
    }

    // Outgoing Emits:
    const emits = defineEmits<{
        addMention: [string]
    }>()


    // On Mount:
    onMounted(() => {
        // Auto Assign Selected Text to Text Input:
        if (props.popupSelection) {
            const value = props.popupSelection
            if (value == '') return
            formRef.value?.setFieldValue('mentionValue', props.popupSelection?.trim())
        }
    })


</script>


<template>
    <Form ref="formRef" v-slot="$form" @submit="submitForm" :resolver class="popup-form">

        <span class="input-wrap">
            <label for="mentionType" class="input-label">
                <Iconify icon="fluent:mention-32-filled" class="scale-90 relative bottom-px left-px" size="18" />
                <p class="font-semibold text-xs"> Mention Type </p>
            </label>
            <Select placeholder="Mention Type" name="mentionType" v-model="mentionTypeSelected" size="small"
                :options="Array.from(mentionOptions)" fluid />
            <p v-for="err in $form.mentionType?.errors" class="w-full px-1.5 text-red-400 text-xs font-semibold">
                - {{ err?.message }}
            </p>
        </span>

        <span class="input-wrap">
            <label for="mentionValue" class="input-label">
                <Iconify icon="mdi:text" size="18" class="relative right-px" />
                <p class="font-semibold text-xs"> {{ mentionTypeSelected || 'Mention' }} ID </p>
            </label>
            <InputText placeholder="123456789123456789" type="text" size="small" name="mentionValue" fluid />
            <p v-for="err in $form.mentionValue?.errors" class="w-full px-1.5 text-red-400 text-xs font-semibold">
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
        --p-inputtext-placeholder-color: color-mix(in oklab, var(--color-ring), white 20%);
        --p-select-placeholder-color: color-mix(in oklab, var(--color-ring), white 20%);
        --p-select-invalid-placeholder-color: var(--color-red-400);
        --p-select-invalid-color: var(--color-red-400);

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