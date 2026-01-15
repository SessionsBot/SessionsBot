<script lang="ts" setup>
    import { externalUrls } from '@/stores/nav';


</script>


<template>
    <section class="bg-black/20 w-full flex px-7 p-4 pb-6 border-b-2 border-ring gap-4 flex-col">

        <!-- Heading - Text Area -->
        <div class="flex gap-0 flex-col w-ful h-fit text-center">
            <div class="flex flex-row gap-0.75 items-center justify-center w-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="M20 18H4V8h16m0-2h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2m-1 5.7c0 1.7-2 1.8-2 3.3h-1.3c0-2.2 2-2 2-3.3c0-.7-.6-1.3-1.3-1.3s-1.3.6-1.3 1.3h-1.3c0-1.5 1.2-2.7 2.7-2.7s2.5 1.2 2.5 2.7m-2 4V17h-1.3v-1.3z" />
                </svg>
                <p class="font-extrabold text-3xl">
                    Support Center
                </p>
            </div>
            <p class="text-white/80 mt-3 font-semibold">
                Experiencing trouble using or getting set up with Session Bot?
            </p>
            <p class="text-sm text-white/40">
                Don't worry there's plenty of resources to assist you!
            </p>
        </div>

        <!-- Redirect - Action - Buttons -->
        <div class="flex flex-col sm:flex-row w-full gap-1.75 flex-wrap items-center justify-center">
            <Button unstyled class="bg-indigo-500/80 hover:bg-indigo-500/60 actionButton">
                <svg class="p-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12" />
                </svg>
                <p> Chat with Support</p>
            </Button>
            <a :href="externalUrls.documentation" target="_blank">
                <Button unstyled class="bg-sky-500/80 hover:bg-sky-500/60 actionButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M8.385 12.308h7.23v-1h-7.23zm0 2.769h7.23v-1h-7.23zm0 2.77h4.23v-1h-4.23zM6.615 21q-.69 0-1.152-.462T5 19.385V4.615q0-.69.463-1.152T6.616 3H14.5L19 7.5v11.885q0 .69-.462 1.153T17.384 21zM14 8h4l-4-4z" />
                    </svg>
                    <p> View Documentation</p>
                </Button>
            </a>
            <Button unstyled class="bg-amber-600/80 hover:bg-amber-600/60 actionButton">
                <svg class="ml-1 m-0.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
                    <path fill="currentColor" fill-rule="evenodd"
                        d="M1.44.44A1.5 1.5 0 0 1 2.5 0h10A1.5 1.5 0 0 1 14 1.5v10a1.5 1.5 0 0 1-1.5 1.5H4.562l-3.94.985a.5.5 0 0 1-.596-.643L1 10.419V1.5c0-.398.158-.78.44-1.06m5.692 3.19a1.007 1.007 0 1 1 .385 1.936a.625.625 0 0 0-.625.625V7.28a.625.625 0 1 0 1.25 0v-.551A2.256 2.256 0 1 0 5.261 4.56a.625.625 0 1 0 1.25 0a1.01 1.01 0 0 1 .621-.93m.385 6.994a.897.897 0 1 1 .002 0z"
                        clip-rule="evenodd" />
                </svg>
                <p> Read the FAQs</p>
            </Button>
        </div>

    </section>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .actionButton {
        @apply gap-0.5 font-semibold grayscale-30 p-1 drop-shadow-sm drop-shadow-black/30 w-fit active:scale-95 transition-all cursor-pointer rounded-md flex items-center justify-center
    }

</style>