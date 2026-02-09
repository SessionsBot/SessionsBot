<script lang="ts" setup>
    import InfoHelpButton from '@/router/dashboard/components/sessionForm/labels/infoHelpButton.vue';


    // Props
    const props = defineProps<{
        inputErrors: string[]
    }>()

    // Field Value - Modal:
    const fieldValue = defineModel<boolean>('field-value')

    // Emits:
    const emits = defineEmits<{
        validate: []
    }>()



</script>


<template>
    <!-- Input - Public Sessions -->
    <span class="input-group">
        <!-- Label -->
        <div class="label">
            <span class="flex items-center gap-1 flex-wrap">
                <Iconify :size="18" icon="material-symbols:lock" />
                Public Sessions
            </span>

            <InfoHelpButton doc-path="/" />
        </div>

        <!-- Input -->
        <div class="input">

            <ToggleSwitch name="publicSessions" v-model:model-value="fieldValue" />

            <p class="opacity-65 text-xs italic font-bold">
                Sessions are {{ fieldValue ? 'PUBLIC' : 'PRIVATE' }}
            </p>

        </div>

        <!-- Errors -->
        <div class="errors" v-if="inputErrors?.length">
            <p v-for="err of inputErrors" :key="err.slice(0, 15)">
                - {{ err || 'Invalid Input!' }}
            </p>
        </div>

    </span>
</template>


<style scoped></style>