<script lang="ts" setup>
    import InfoHelpButton from '@/router/dashboard/components/sessionForm/labels/infoHelpButton.vue';

    // Props 
    const props = defineProps<{
        title: string,
        iconName: string,
        docPath?: string | undefined
        premiumType?: 'PREMIUM' | 'ENTERPRISE'
    }>()
</script>


<template>
    <div class="w-full p-0.5 flex flex-row gap-1 items-center justify-between flex-nowrap font-bold">
        <!-- Title & Icon -->
        <span class="flex items-center gap-1 flex-wrap">
            <Iconify :size="18" :icon="props.iconName" />
            {{ props?.title || 'Input Title?' }}
            <!-- Premium Feature Badge -->
            <span v-if="props.premiumType"
                class="mx-0.5 flex flex-row gap-px p-0.5 pr-1 bg-black/5 text-white/80 border-indigo-400/70 border-2 rounded-lg">
                <DiamondIcon class="size-4! fill-transparent!" />
                <p v-if="props.premiumType == 'PREMIUM'" class="font-bold text-xs"> Premium </p>
                <p v-if="props.premiumType == 'ENTERPRISE'" class="font-bold text-xs"> Enterprise </p>
            </span>
        </span>

        <!-- Help / Docs Info Button -->
        <InfoHelpButton v-if="props.docPath" :doc-path="props.docPath" />
    </div>

</template>


<style scoped></style>