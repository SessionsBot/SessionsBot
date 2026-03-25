<script lang="ts" setup>
    import InputLabel from '@/components/inputLabel/inputLabel.vue';


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
        <InputLabel title="Add to Calendar Button" icon-name="fa6-solid:calendar-plus"
            docPath="/preferences#add-to-calendar-button" />


        <!-- Input -->
        <div class="input">

            <ToggleSwitch v-model="fieldValue" @value-change="$emit('validate')" />

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