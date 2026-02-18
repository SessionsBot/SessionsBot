<script setup lang="ts">

    // Tab Buttons:
    export type TabName = "Editor" | "Preview";

    const selectedTab = defineModel<TabName>('selectedTab')


</script>

<template>
    <div class="editor-tab-bar">

        <button class="tab-button" @click="selectedTab = 'Editor'" :class="{ 'selected': selectedTab == 'Editor' }">
            <Iconify icon="mi:edit" size="15" class="h-full! min-w-fit!" />
            Editor
        </button>

        <button class="tab-button" @click="selectedTab = 'Preview'" :class="{ 'selected': selectedTab == 'Preview' }">
            <Iconify icon="mi:eye" size="15" class="h-full! min-w-fit!" />
            Preview
        </button>

    </div>
</template>


<style scoped>
    @reference "@/styles/main.css";

    .editor-tab-bar {
        @apply gap-1.5 p-1.5 pb-0 w-full min-w-full h-fit flex flex-row items-center border-b-2 border-(--borderColor) transition-colors;
    }

    .tab-button {
        @apply uppercase text-xs text-text-1/55 bg-bg-2/15 font-bold p-1 px-2 border-(--borderColor)/55 border border-b-0 rounded-b-none rounded !cursor-pointer transition-all flex flex-row gap-0.5 items-center justify-center content-center flex-wrap;

        &.selected {
            @apply !bg-bg-2/45 !border-(--borderColor) !text-text-1;
        }

        &:hover {
            background: color-mix(in oklab, var(--c-bg-2), var(--c-text-1) 15%);
        }

    }

</style>