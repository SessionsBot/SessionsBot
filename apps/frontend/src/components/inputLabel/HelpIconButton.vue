<script lang="ts" setup>
    import { externalUrls } from '@/stores/nav';
    import { HelpCircleIcon } from 'lucide-vue-next';

    const props = defineProps<{
        fieldName?: string
        docPath: string
    }>()

    const isActive = ref(false)

    const canHover = window.matchMedia('(hover: hover)').matches

    function handleClick(e: MouseEvent) {
        if (canHover) return // desktop: let link behave normally

        if (!isActive.value) {
            e.preventDefault()
            isActive.value = true
        } else {
            isActive.value = false
            // allow navigation
        }
    }

    const href = computed(() => {
        let dest = externalUrls.documentation
        if (props.docPath) dest += props.docPath
        return dest
    })


</script>


<template>

    <a :href="href" target="_blank" ref="elmRef" @mouseenter="isActive = true" @mouseleave="isActive = false"
        @click="handleClick"
        class="flex extra-content overflow-clip flex-nowrap p-0.5 py-0.25 gap-0.75 justify-center items-center cursor-pointer rounded-full transition-[0.4s] active:bg-zinc-800 ring-ring"
        :class="{ 'bg-bg-3 ring-2': isActive }">
        <Transition name="slide-in">
            <p v-if="isActive" class="text-[11px]/tight pl-1 font-medium text-nowrap">
                Learn more
            </p>
        </Transition>
        <HelpCircleIcon :class="{ 'rounded-full opacity-85': isActive }" class="opacity-70 transition-all" :size="15" />
    </a>


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