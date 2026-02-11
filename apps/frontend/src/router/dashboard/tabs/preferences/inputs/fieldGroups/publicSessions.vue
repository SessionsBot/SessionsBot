<script lang="ts" setup>
    import InfoHelpButton from '@/router/dashboard/components/sessionForm/labels/infoHelpButton.vue';
    import InputLabel from '../inputLabel.vue';


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
        <InputLabel title="Public Sessions" iconName="material-symbols:lock" docPath="/" />

        <!-- Input -->
        <div class="input">

            <ToggleSwitch name="publicSessions" v-model:model-value="fieldValue" />

            <p hidden class="opacity-65 text-xs italic font-bold">
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