<script lang="ts" setup>
    import { Icon } from '@iconify/vue';
    import { KeepAlive, type ClassValue } from 'vue';


    // Props
    const props = defineProps<{
        icon?: string
        /** Pixel size of the icon. @default_ 24px */
        size?: number | string,
        /** Class name(s) to apply to the icon itself */
        class?: ClassValue

        // /** Pixel size of the stroke width. @default_ 2px */
        // strokeWidth?: number
    }>()

</script>


<template>
    <icon :icon="String(props?.icon)" :class="props?.class" :width="props.size || 24" :height="props.size || 24"
        class="align-middle" />
</template>


<style scoped></style>