<script lang="ts" setup>
    import InfoHelpButton from '@/router/dashboard/components/sessionForm/labels/infoHelpButton.vue';
    import InputLabel from '../inputLabel.vue';


    // Props
    const props = defineProps<{
        inputErrors: string[]
    }>()

    // Field Value - Modal:
    const fieldValue = defineModel<any>('field-value')

    // Emits:
    const emits = defineEmits<{
        validate: []
    }>()



</script>


<template>
    <!-- Input - Public Sessions -->
    <span class="input-group">

        <!-- Label -->
        <InputLabel title="NAME" icon-name="mdi:color" :doc-path="undefined" />

        <!-- Input -->
        <div class="input">

            <InputText v-model="fieldValue" fluid @blur="$emit('validate')" />

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