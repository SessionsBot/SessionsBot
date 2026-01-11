<script lang="ts" setup>
    import { XIcon } from 'lucide-vue-next';
    import { motion } from 'motion-v';


</script>


<template>
    <!-- Notification(s) Wrap -->
    <div
        class="fixed bottom-0 z-75 right-0 m-4 w-fit max-h-screen flex gap-2 items-center content-center justify-end flex-col">

        <!-- Notification Card -->
        <motion.div :initial="{
            x: 200,
            y: 50,
            opacity: 0,
            scale: 0.5
        }" :animate="{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1
        }" :transition="{
            duration: 0.3,
            animation: {
                delay: 1,
                bounce: 1,
                ease: ['backInOut']
            }
        }"
            class="bg-zinc-800 ring-2 p-2 gap-1.5 ring-ring rounded-md flex flex-row flex-wrap items-center justify-start content-center">
            <iconify-icon icon="mdi:information-variant-box" width="22" height="22"></iconify-icon>
            <p class="font-semibold font-rubik">
                This is an example notification!
            </p>
            <Button unstyled
                class="rounded-md ml-2 group hover:bg-zinc-400/20 transition-all cursor-pointer active:scale-95">
                <XIcon class="p-1 text-white/50 group-hover:text-white/70 transition-all" />
            </Button>

        </motion.div>

    </div>
</template>


<style scoped></style>