<script lang="ts" setup>

    // Props
    const props = defineProps<{
        icon?: string
        /** Pixel size of the icon. @default_ 24px */
        size?: number | string
    }>()

</script>


<template>
    <iconify-icon :height="size || 24" :width="size || 24"
        class="flex items-center justify-center w-fit! h-fit! aspect-square"
        :icon="props.icon || 'mingcute:question-fill'" />
</template>


<style scoped></style>