<script lang="ts" setup>
    import StatusBadge from '../../components/StatusBadge.vue';
    import { arrow, autoPlacement, autoUpdate, computePosition, flip, offset, shift, useFloating } from '@floating-ui/vue'
    import ColorModeShades from './ColorModeShades.vue'
    import MultiButton from './MultiButton.vue';

    // Floating ToolTip:
    const showToolTip = ref(false)
    const reference = ref<HTMLElement>()
    const floating = ref<HTMLElement>()
    const arrowRef = ref<HTMLElement>()
    const { floatingStyles, middlewareData, placement } = useFloating(reference, floating, {
        placement: 'top',
        whileElementsMounted: autoUpdate,
        middleware: [
            offset({
                alignmentAxis: 20,
                crossAxis: 10,
                mainAxis: 10

            }),
            shift(),
            flip({
                padding: 10,
            }),
            arrow({ element: arrowRef, padding: 7 })
        ]
    })


    const arrowStyles = computed(() => {
        const { x, y } = middlewareData.value.arrow ?? {}

        const base = {
            left: x != null ? `${x}px` : '',
            // right: x != null ? '10px' : '',
            top: y != null ? `${y}px` : ''
        }

        const staticSide = () => {
            switch (placement.value) {
                case 'bottom':
                case 'bottom-start':
                case 'bottom-end':
                    return 'top'

                case 'top':
                case 'top-start':
                case 'top-end':
                default:
                    return 'bottom'

                case 'left':
                case 'left-start':
                case 'left-end':
                    return 'right'

                case 'right':
                case 'right-start':
                case 'right-end':
                    return 'left'
            }
        }

        console.info('Current Position', placement.value)

        return {
            ...base,
            [staticSide()]: '-0.375rem', // half of size-3
        }

    })




</script>


<template>
    <div class="flex flex-col gap-2 justify-center items-center content-center p-5 grow w-full h-full bg-bg-1!">

        <StatusBadge hidden />

        <ColorModeToggle />

        <!-- Popper/Floating UI Tests -->

        <div class="w-100 h-100 bg-bg-3 flex overflow-auto resize">


            <div class="w-300! h-500! pl-70 block! min-w-250! relative">

                <button ref="reference" @pointerenter="showToolTip = true" @pointerleave="showToolTip = false"
                    class="p-1 py-0.5 m-10 mt-300 rounded border border-ring-soft flex flex-row gap-1 items-center bg-bg-4">
                    Hover Me!
                </button>

                <!-- ToolTip -->
                <Transition name="fade">

                    <div v-if="showToolTip" ref="floating" :style="floatingStyles" class="absolute z-10">
                        <!-- Arrow -->
                        <div ref="arrowRef" :style="arrowStyles" class="absolute size-3 rotate-45 bg-bg-2 rounded " />

                        <!-- Tooltip box -->
                        <div class="relative bg-bg-2 p-1.5 px-2 text-xs rounded-md">
                            This is extra info long info that exceeds the reference!
                        </div>
                    </div>


                </Transition>


                <MultiButton />

            </div>

            <ColorModeShades hidden />

        </div>
    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .display-area {
        @apply flex flex-col gap-2 p-4 bg-bg-1 text-text-1 font-bold text-lg rounded-md border-2 border-ring-1;

        .title {
            @apply opacity-50 text-sm;
        }
    }


</style>