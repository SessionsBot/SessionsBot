<script lang="ts" setup>
    import { safeGTag } from '@/stores/analytics'
    import { Icon } from '@iconify/vue'




    const colorMode = useColorMode({
        disableTransition: false,
        initialValue: 'dark'
    })

    function gTagColorMode(mode: string) {

        safeGTag('event', 'color_mode_change', {
            theme: mode
        })
    }

    function toggleColorMode() {
        if (colorMode.value == 'light'
            || colorMode.value == 'auto') {
            document.documentElement.style.colorScheme = 'dark'
            gTagColorMode('dark')
            return colorMode.value = 'dark'
        }

        if (colorMode.value == 'dark')
            document.documentElement.style.colorScheme = 'light'
        gTagColorMode('light')
        return colorMode.value = 'light'

    }


</script>


<template>

    <!-- Toggler -->
    <div @click="toggleColorMode" title="Color Mode"
        class="bg-bg-3/20 group/cm hover:border-ring-4 w-11 rounded-full cursor-pointer h-5 border-2 border-ring-soft gap-1.5 flex overflow-auto relative transition-all">

        <!-- Handle -->
        <div class="h-full text-text-1 overflow-clip left-0 bg-bg-3 group-hover/cm:bg-bg-4 w-fit flex p-0.5 rounded-full aspect-square absolute items-center justify-center transition-all duration-250 ease-in-out"
            :class="{
                'translate-x-0': colorMode == 'dark',
                'translate-x-6': (colorMode == 'light' || colorMode == 'auto')
            }">

            <!-- SUN Icon -->
            <Icon v-if="colorMode == 'auto' || colorMode == 'light'" icon="flowbite:sun-solid" />
            <!-- MOON Icon -->
            <Icon v-else icon="tabler:moon-filled" class="p-0.5" />

        </div>

    </div>

</template>


<style scoped></style>