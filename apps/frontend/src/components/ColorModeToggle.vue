<script lang="ts" setup>

    const colorMode = useColorMode({
        disableTransition: false,
        initialValue: 'dark'
    })

    function gTagColorMode(mode: string) {
        if (typeof gtag == undefined) return console.warn('No gTag available for color mode change!');
        else gtag('event', 'color_mode_change', {
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
    <div @click="toggleColorMode"
        class="bg-bg-3/20 group/cm hover:border-ring-4 w-11 rounded-full cursor-pointer h-5 border-2 border-ring-soft gap-1.5 flex overflow-auto relative transition-all">

        <!-- Handle -->
        <div class="h-full left-0 bg-bg-3 group-hover/cm:bg-bg-4 w-fit flex p-1 rounded-full aspect-square absolute items-center justify-center transition-all duration-250 ease-in-out"
            :class="{
                'translate-x-0 text-purple-500': colorMode == 'dark',
                'translate-x-6 text-orange-500': (colorMode == 'light' || colorMode == 'auto')
            }">
            <!-- SUN Icon -->

            <svg v-if="colorMode == 'auto' || colorMode == 'light'" xmlns="http://www.w3.org/2000/svg" width="24"
                height="24" viewBox="0 0 24 24">
                <path fill="currentColor"
                    d="M12 2.25a.75.75 0 0 1 .75.75v2a.75.75 0 1 1-1.5 0V3a.75.75 0 0 1 .75-.75m0 16.004a.75.75 0 0 1 .75.75v2a.75.75 0 1 1-1.5 0v-2a.75.75 0 0 1 .75-.75M2.25 12a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75m16 0a.75.75 0 0 1 .75-.75h2a.75.75 0 1 1 0 1.5h-2a.75.75 0 0 1-.75-.75m1.28-7.53a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 1 1-1.06-1.06l2-2a.75.75 0 0 1 1.06 0m-15.06 0a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06m3.06 12a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 0 1-1.06-1.06l2-2a.75.75 0 0 1 1.06 0m8.94 0a.75.75 0 0 1 1.06 0l2 2a.75.75 0 1 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06M12 7.25a4.75 4.75 0 1 0 0 9.5a4.75 4.75 0 0 0 0-9.5" />
            </svg>
            <!-- MOON Icon -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor"
                    d="M12 22c5.523 0 10-4.477 10-10c0-.463-.694-.54-.933-.143a6.5 6.5 0 1 1-8.924-8.924C12.54 2.693 12.463 2 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10" />
            </svg>
        </div>

    </div>

</template>


<style scoped></style>