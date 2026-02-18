<script lang="ts" setup>
    import { KeepAlive } from 'vue';


    // Props
    const props = defineProps<{
        icon?: string
        /** Pixel size of the icon. @default_ 24px */
        size?: number | string,
        /** Pixel size of the stroke width. @default_ 2px */
        strokeWidth?: number
        /** Class name(s) to apply to the icon itself */
        class?: string
    }>()

</script>


<template>
    <keep-alive>
        <iconify-icon :height="size || 24" :width="size || 24"
            class="flex items-center justify-center w-fit! h-fit! aspect-square" :class="props.class"
            :icon="props.icon || 'mingcute:question-fill'" />
    </keep-alive>
</template>


<style scoped></style>