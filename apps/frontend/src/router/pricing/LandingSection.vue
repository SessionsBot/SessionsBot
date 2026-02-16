<script setup lang="ts">
    import { externalUrls } from '@/stores/nav';


</script>

<template>
    <div class="landing-section">
        <p class="title">
            Pricing Plans
        </p>
        <p class="subtitle">
            Find the right solution to best fit your needs.
        </p>
        <!-- Action Buttons -->
        <div class="actions-wrap">
            <!-- FREE - Invite -->
            <a hidden :href="externalUrls.inviteBot" target="_blank">
                <Button unstyled
                    class="action-button bg-emerald-500/80 hover:bg-emerald-500/60 active:bg-emerald-500/50">
                    <svg class="aspect-square max-h-full" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 64 64">
                        <path fill="currentColor"
                            d="M52 2H12C6.477 2 2 6.477 2 12v40c0 5.523 4.477 10 10 10h40c5.523 0 10-4.477 10-10V12c0-5.523-4.477-10-10-10M18 26h-5.09v4.5H18v3h-5.09V41H10V23h8zm12.475 15h-3.021l-2.471-7.5h-1.125V41H21V23h5c2.758 0 5 2.355 5 5.25c0 2.197-1.293 4.084-3.121 4.865zM42 26h-5.09v4.5H42v3h-5.09V38H42v3h-8V23h8zm12 0h-5.09v4.5H54v3h-5.09V38H54v3h-8V23h8z" />
                        <path fill="currentColor"
                            d="M26 26h-2.143v4.5H26c1.182 0 2.143-1.01 2.143-2.25S27.182 26 26 26" />
                    </svg>
                    Use for FREE
                </Button>
            </a>
            <!-- DIRECT - Discord Shop Link -->
            <a :href="externalUrls.discordStore" target="_blank">
                <Button unstyled class="action-button bg-brand-1/80 hover:bg-brand-1/65 active:bg-brand-1/50">
                    <ShopIcon />
                    View Discord Shop
                </Button>
            </a>
        </div>
    </div>
</template>


<style>
    @reference '@/styles/main.css';

    .landing-section {
        @apply bg-bg-2 w-full flex flex-col gap-2 p-7 items-center justify-center;

        *.title {
            @apply text-4xl sm:text-5xl font-black font-rubik uppercase;
        }

        *.subtitle {
            @apply text-sm sm:text-lg pb-1 opacity-80;
        }

        *.actions-wrap {
            @apply flex flex-row gap-3 flex-wrap items-center justify-center;
        }
    }
</style>
