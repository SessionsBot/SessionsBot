<script lang="ts" setup>
    import LandingSection from './landingSection.vue';

</script>


<template>
    <div class="flex justify-start items-center flex-col">
        <!-- Hero - Top Landing Area -->
        <LandingSection />

        <!-- Resources -->
        <div class="w-full p-5 flex items-center justify-center">
            <div
                class="ring-2 max-w-200 gap-3 p-3 pt-2 ring-ring rounded-md flex items-center justify-center flex-wrap">
                <!-- Header -->
                <div class="w-full flex flex-wrap justify-between items-center content-center p-0">
                    <p class="text-white/70 font-extrabold uppercase text-sm">
                        Resources:
                    </p>

                    <input type="text"
                        class="h-5 p-2 font-bold text-sm rounded-full bg-white/20 ring-ring ring-2 accent-indigo-400 focus:outline-none!"
                        placeholder="Search for a resource..." />
                </div>

                <!-- Resources -->
                <Button unstyled
                    class="bg-zinc-800/80 w-fit min-h-fit! flex items-center flex-row gap-0 rounded-md ring-2 ring-ring hover:ring-white/70 hover:scale-103 active:scale-95 overflow-clip cursor-pointer transition-all">
                    <!-- Icon -->
                    <svg class="h-full w-fit p-2" xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                        viewBox="0 0 26 26">
                        <path fill="currentColor"
                            d="M13 0c-1.7 0-3 1.3-3 3v6c0 1.7 1.3 3 3 3h6l4 4v-4c1.7 0 3-1.3 3-3V3c0-1.7-1.3-3-3-3zm4.188 3h1.718l1.688 6h-1.5l-.407-1.5h-1.5L16.813 9H15.5zM18 4c-.1.4-.212.888-.313 1.188l-.28 1.312h1.187l-.282-1.313C18.113 4.888 18 4.4 18 4M3 10c-1.7 0-3 1.3-3 3v6c0 1.7 1.3 3 3 3v4l4-4h6c1.7 0 3-1.3 3-3v-6h-3c-1.9 0-3.406-1.3-3.906-3zm4.594 2.906c1.7 0 2.5 1.4 2.5 3c0 1.4-.481 2.288-1.281 2.688c.4.2.874.306 1.374.406l-.374 1c-.7-.2-1.426-.512-2.126-.813c-.1-.1-.275-.093-.375-.093C6.112 18.994 5 18 5 16c0-1.7.994-3.094 2.594-3.094m0 1.094c-.8 0-1.188.9-1.188 2c0 1.2.388 2 1.188 2s1.218-.9 1.218-2s-.418-2-1.218-2" />
                    </svg>

                    <!-- Title -->
                    <div class="flex grow items-center justify-center pl-0 p-1 pr-2 flex-col">
                        <p class="font-semibold font-rubik uppercase font-white/70 text-lg">
                            FaQs
                        </p>
                    </div>
                </Button>

                <Button unstyled
                    class="bg-zinc-800/80 w-fit min-h-fit! flex items-center flex-row gap-0 rounded-md ring-2 ring-ring hover:ring-white/70 hover:scale-103 active:scale-95 overflow-clip cursor-pointer transition-all">
                    <!-- Icon -->
                    <svg class="h-full w-fit p-2 pr-1" xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                        viewBox="0 0 24 24">
                        <g fill="none">
                            <path
                                d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                            <path fill="currentColor"
                                d="M16 3a3 3 0 0 1 2.995 2.824L19 6v10h.75c.647 0 1.18.492 1.244 1.122l.006.128V19a3 3 0 0 1-2.824 2.995L18 22H8a3 3 0 0 1-2.995-2.824L5 19V9H3.25a1.25 1.25 0 0 1-1.244-1.122L2 7.75V6a3 3 0 0 1 2.824-2.995L5 3zm3 15h-9v1c0 .35-.06.687-.17 1H18a1 1 0 0 0 1-1zm-7-6h-2a1 1 0 0 0-.117 1.993L10 14h2a1 1 0 0 0 .117-1.993zm2-4h-4a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2M5 5a1 1 0 0 0-1 1v1h1z" />
                        </g>
                    </svg>

                    <!-- Title -->
                    <div class="flex grow items-center justify-center pl-0 p-1 pr-2 flex-col">
                        <p class="font-semibold font-rubik uppercase font-white/70 text-lg">
                            Documentation
                        </p>
                    </div>
                </Button>
            </div>

        </div>
    </div>
</template>


<style scoped></style>