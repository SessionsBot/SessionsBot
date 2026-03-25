<script lang="ts" setup>

    // Props 
    const props = defineProps<{
        title: string,
        iconName: string,
        docPath?: string | undefined
        premiumType?: 'PREMIUM' | 'ENTERPRISE'
        required?: true
        showOptional?: true
    }>()
</script>


<template>
    <div class="w-full p-0.5 flex flex-row gap-1 items-center justify-between flex-nowrap font-bold">
        <!-- Title & Icon -->
        <span class="flex items-center gap-1 flex-wrap">
            <Iconify :size="18" :icon="props.iconName" />
            <span class="flex w-fit h-fit relative items-center">
                {{ props?.title || '?' }}
                <p v-if="props.required" title="Required" class="pl-0.5 self-start text-invalid-1/80 text-xs">
                    *
                </p>
                <p v-if="props.showOptional" class="text-text-soft pl-1 relative top-px text-[10px] italic">
                    (optional)
                </p>
            </span>
            <!-- Premium Feature Badge -->
            <span v-if="props.premiumType"
                class="mx-0.5 flex flex-row gap-px p-0.5 pr-1 bg-text-1/8 text-text-1/80 border-indigo-400/70 border-2 rounded-lg">
                <DiamondIcon class="size-4! fill-transparent!" />
                <p v-if="props.premiumType == 'PREMIUM'" class="font-bold text-xs"> Premium </p>
                <p v-if="props.premiumType == 'ENTERPRISE'" class="font-bold text-xs"> Enterprise </p>
            </span>
        </span>

        <!-- Help / Docs Info Button -->
        <HelpIconButton v-if="props.docPath" :doc-path="props.docPath" />
    </div>

</template>


<style scoped></style>