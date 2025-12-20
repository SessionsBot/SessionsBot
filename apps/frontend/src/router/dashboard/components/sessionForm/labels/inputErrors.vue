<script lang="ts" setup>
    import type { NewSessions_FieldNames } from '../sesForm.vue';


    // Incoming Props:
    const props = defineProps<{
        fieldName: NewSessions_FieldNames
        invalidFields: Map<any, string[]>

    }>()

</script>


<template>
    <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
        v-for="err in invalidFields.get(fieldName) || []">
        <p class="text-sm! pl-0.5">
            {{ err || 'Invalid Input!' }}
        </p>
    </Message>
</template>


<style scoped></style>