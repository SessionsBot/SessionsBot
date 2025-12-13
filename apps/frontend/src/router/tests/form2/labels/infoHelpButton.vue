<script lang="ts" setup>
    import type { MaybeElementRef } from '@vueuse/core';
    import { HelpCircleIcon } from 'lucide-vue-next';

    const props = defineProps<{
        fieldName?: string
        docPath: string
    }>()

    const elmRef = ref<MaybeElementRef>()
    const isActive = ref<boolean>(false)

    function toggle() {
        isActive.value = !isActive.value;
    }
    function show() {
        isActive.value = true;
    }
    function hide() {
        isActive.value = false;
    }

    function handleClick(e: MouseEvent) {
        if (isActive.value) {
            // If already active (on mobile), allow link to be followed
            isActive.value = false;
            // Let the link work
            let dest = 'https://docs.sessionsbot.fyi'
            if (props.docPath) {
                dest = dest + props.docPath;
            }
            window.open(dest, '_blank')
        } else {
            // On first tap, just show extra content, prevent navigation
            e.preventDefault();
            isActive.value = true;
        }
    }

</script>


<template>

    <div ref="elmRef" @mouseenter="show" @mouseleave="hide" @touchstart.prevent="toggle" @click="handleClick"
        class="flex extra-content overflow-clip flex-nowrap p-0.5 py-0.25 gap-0.75 justify-center items-center cursor-pointer rounded-full transition-[0.4s] active:bg-zinc-800 ring-ring"
        :class="{ 'bg-zinc-700 ring-2': isActive }">
        <Transition name="slide-in">
            <p v-if="isActive" class="text-[11px] pl-1  text-nowrap relative ">
                Learn more
            </p>
        </Transition>
        <HelpCircleIcon :class="{ 'bg-zinc-700! rounded-full opacity-85': isActive }"
            class="bg-zinc-900 opacity-70 transition-all" :size="15" />

    </div>


</template>


<style scoped>

    .slide-in-enter-active,
    .slide-in-leave-active {
        transition: all 0.3s ease;

    }

    .slide-in-enter-from,
    .slide-in-leave-to {
        transform: translateX(10px);
        opacity: 0;
    }

    .slide-in-enter-to {
        transform: translate(0px);
        opacity: 1;
    }



</style>