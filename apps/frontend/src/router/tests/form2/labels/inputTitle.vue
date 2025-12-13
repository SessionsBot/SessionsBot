<script lang="ts" setup>
    import { ClockIcon, type LucideIcon } from 'lucide-vue-next';
    import type { Component } from 'vue';
    import InfoHelpButton from './infoHelpButton.vue';

    const props = defineProps<{
        /** The title or name to display for the input label. */
        fieldTitle: string,
        /** The `LucideIcon` component to display within the input label. */
        icon: LucideIcon | Component,
        /** If this field is required or not.
         * @ default = false
         */
        required?: true,
        /** Weather to show a field help/info button or not.
         * @ default = false
         */
        showHelp?: {
            /** The url path string to link to relevant documentation pages after the root url. 
             * 
             * @ex `https//docs.sessionsbot.fyi`(provided) + **`docPath(this)`**;
             * @note
             * Include `/` at the beginning of the doc path.
            */
            path: string
        },
    }>();


</script>


<template>
    <label for="endDate" class="flex w-full flex-wrap gap-0.75 justify-between items-center">
        <span class="flex flex-row gap-0.75 items-center" :class="{ 'required-field': required }">
            <component :is="icon" :size="17" />
            <p> {{ fieldTitle }} </p>
        </span>
        <InfoHelpButton v-if="showHelp" :docPath="showHelp.path" />
    </label>
</template>


<style scoped>

    :deep().required-field {
        position: relative;
    }

    :deep().required-field::after {
        z-index: 2;
        content: "*";
        font-size: small;
        text-align: center;
        position: absolute;
        padding-top: 5px;
        right: -11px;
        bottom: 19.5px;
        width: 12px;
        height: 12px;
        border-radius: 5px;
        color: rgba(255, 0, 0, 0.507);
        background: rgba(218, 69, 69, 0);
    }

</style>