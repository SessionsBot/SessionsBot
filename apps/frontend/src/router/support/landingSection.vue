<script setup lang="ts">
    import { externalUrls } from '@/stores/nav';


</script>

<template>
    <div class="landing-section">
        <p class="title">
            Support Center
        </p>
        <p class="subtitle">
            Experiencing trouble or have questions about Sessions Bot?
        </p>
        <p class="text-xs sm:text-sm opacity-70 mb-2 px-4 relative bottom-1">
            <b>Don't worry</b> there's plenty of resources to assist you!
        </p>
        <!-- Action Buttons -->
        <div class="actions-wrap">
            <!-- Documentation -->
            <a :href="externalUrls.documentation" target="_blank">
                <Button unstyled class="action-button bg-zinc-500/75 hover:bg-zinc-500/60 active:bg-zinc-500/65">
                    <Iconify icon="mingcute:paper-fill" :size="23" />
                    Read Documentation
                </Button>
            </a>
            <!-- Chat with Support -->
            <a :href="externalUrls.discordServer.supportInvite" target="_blank">
                <Button unstyled class="action-button bg-brand-1/80 hover:bg-brand-1/60 active:bg-brand-1/50">
                    <ChatIcon />
                    Chat with Support
                </Button>
            </a>
        </div>
    </div>
</template>


<style scoped>
    @reference '@/styles/main.css';

    .landing-section {
        @apply bg-bg-2 w-full flex flex-col gap-2 p-7 items-center justify-center;

        .title {
            @apply text-4xl sm:text-5xl font-black font-rubik uppercase;
        }

        .subtitle {
            @apply sm:text-lg pb-1 opacity-80 px-4;
        }

        .actions-wrap {
            @apply flex flex-row gap-3 flex-wrap items-center justify-center;
        }

        .action-button {
            @apply text-sm sm:text-[16px] p-1 px-1.5 font-bold active:scale-98 transition-all cursor-pointer rounded-md flex flex-row gap-0.75 items-center justify-center;
        }
    }
</style>
