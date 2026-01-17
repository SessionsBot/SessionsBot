<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import router from '../router';
    import { externalUrls } from '@/stores/nav';
    import type { SubscriptionPlanName } from '@sessionsbot/shared';
    import { features } from 'process';
    import { CheckIcon } from 'lucide-vue-next';


    // Services:
    const dashboard = useDashboardStore();
    const route = useRoute()

    // Guild Id passed from route - possibly present
    const guildQuery = computed(() => route.query?.guild)

    const planDetails = <Record<SubscriptionPlanName, {
        title: string,
        description: string,
        price: number,
        features: string[]
    }>>{
            FREE: {
                title: 'Free',
                description: 'Available for all to enjoy, at absolutely no cost!',
                price: 0,
                features: [
                    'Schedule up to 7 active sessions.',
                    'Configure a max of 3 RSVP slots per session.',
                    'Post to a specified channel for EACH session.'
                ]
            },
            PREMIUM: {
                title: 'Premium',
                description: 'Great for medium-large servers, ready to get scheduling!',
                price: 3.99,
                features: [
                    'Schedule up to 15 active sessions.',
                    'Configure a max of 5 RSVP slots per session.',
                    'All features from FREE Plan.'
                ]
            },
            ENTERPRISE: {
                title: 'Enterprise',
                description: 'Best for largest servers, looking to get the most from Sessions Bot!',
                price: 8.99,
                features: [
                    'Schedule up to ∞ active sessions.',
                    'Configure a max of 10 RSVP slots per session.',
                    'All features from PREMIUM Plan.'
                ]
            },
        }

</script>


<template>
    <div class="flex flex-col gap-4 justify-start items-center">

        <!-- Landing Section -->
        <div class="landing-section">
            <p class="title">
                Pricing Plans
            </p>
            <p class="subtitle">
                Find the right solution to best fit your needs.
            </p>
            <!-- Action Buttons -->
            <div class="actions-wrap">
                <a :href="externalUrls.inviteBot" target="_blank">
                    <!-- FREE - Invite -->
                    <Button unstyled
                        class="action-button bg-emerald-500/80 hover:bg-emerald-500/60 active:bg-emerald-500/50">
                        <svg class="aspect-square max-h-full" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                            viewBox="0 0 64 64">
                            <path fill="currentColor"
                                d="M52 2H12C6.477 2 2 6.477 2 12v40c0 5.523 4.477 10 10 10h40c5.523 0 10-4.477 10-10V12c0-5.523-4.477-10-10-10M18 26h-5.09v4.5H18v3h-5.09V41H10V23h8zm12.475 15h-3.021l-2.471-7.5h-1.125V41H21V23h5c2.758 0 5 2.355 5 5.25c0 2.197-1.293 4.084-3.121 4.865zM42 26h-5.09v4.5H42v3h-5.09V38H42v3h-8V23h8zm12 0h-5.09v4.5H54v3h-5.09V38H54v3h-8V23h8z" />
                            <path fill="currentColor"
                                d="M26 26h-2.143v4.5H26c1.182 0 2.143-1.01 2.143-2.25S27.182 26 26 26" />
                        </svg>
                        Get Started for FREE
                    </Button>
                </a>
                <!-- DIRECT - Discord Shop Link -->
                <a :href="externalUrls.discordStore" target="_blank">
                    <Button unstyled
                        class="action-button bg-indigo-500/80 hover:bg-indigo-500/60 active:bg-indigo-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" class="aspect-square max-h-full" width="24" height="24"
                            viewBox="0 0 24 24">
                            <path fill="currentColor"
                                d="M3.778 3.655c-.181.36-.27.806-.448 1.696l-.598 2.99a3.06 3.06 0 1 0 6.043.904l.07-.69a3.167 3.167 0 1 0 6.307-.038l.073.728a3.06 3.06 0 1 0 6.043-.904l-.598-2.99c-.178-.89-.267-1.335-.448-1.696a3 3 0 0 0-1.888-1.548C17.944 2 17.49 2 16.582 2H7.418c-.908 0-1.362 0-1.752.107a3 3 0 0 0-1.888 1.548M18.269 13.5a4.53 4.53 0 0 0 2.231-.581V14c0 3.771 0 5.657-1.172 6.828c-.943.944-2.348 1.127-4.828 1.163V18.5c0-.935 0-1.402-.201-1.75a1.5 1.5 0 0 0-.549-.549C13.402 16 12.935 16 12 16s-1.402 0-1.75.201a1.5 1.5 0 0 0-.549.549c-.201.348-.201.815-.201 1.75v3.491c-2.48-.036-3.885-.22-4.828-1.163C3.5 19.657 3.5 17.771 3.5 14v-1.081a4.53 4.53 0 0 0 2.232.581a4.55 4.55 0 0 0 3.112-1.228A4.64 4.64 0 0 0 12 13.5a4.64 4.64 0 0 0 3.156-1.228a4.55 4.55 0 0 0 3.112 1.228" />
                        </svg>
                        View Discord Shop
                    </Button>
                </a>
            </div>
        </div>

        <!-- Pricing Plan - Cards -->
        <div class="pricing-plan-cards-wrap">

            <!-- Pricing Cards -->
            <div v-for="plan in planDetails" :key="plan.title"
                class="bg-black/30 border-2 max-w-60 border-ring rounded-md flex flex-col items-center justify-center">
                <!-- Title & Desc & Price -->
                <div class="flex flex-col p-2 items-center justify-center w-full">
                    <p class="text-2xl px-2 p-1 font-black uppercase w-full">
                        {{ plan.title }}
                    </p>

                    <div class="flex flex-row flex-nowrap items-start justify-center w-full">
                        <p class="text-2xl font-black text-indigo-500">
                            {{ plan.price }}
                        </p>
                        <p class="font-bold opacity-65 pl-px">
                            $
                        </p>
                        <p class="text-xs opacity-45 uppercase pl-0.5 self-end pb-1">
                            / mo
                        </p>
                    </div>

                    <p class="text-sm font-semibold text-white/40 px-4 w-full">
                        {{ plan.description }}
                    </p>
                </div>
                <!-- Features -->
                <div class="flex flex-col w-full items-center justify-center gap-2">
                    <p class="font-black text-xs opacity-70 uppercase w-full px-2">
                        Features:
                    </p>


                    <div v-for="[i, feat] of Array.from(plan.features).entries()" :key="plan.title + '-feat-' + i"
                        class="flex relative flex-row flex-nowrap gap-2 p-2 pb-2.5 w-full items-center justify-center">
                        <CheckIcon class="min-w-fit! text-indigo-500 aspect-square" />
                        <p>
                            {{ feat }}
                        </p>
                        <div v-if="i != plan.features?.length - 1"
                            class="absolute bottom-0.5 w-[85%] h-0.75 bg-ring/40  rounded-full" />
                    </div>
                </div>
            </div>

        </div>

    </div>
</template>


<style scoped>

    @reference '@/styles/main.css';

    .landing-section {
        @apply bg-black/20 w-full flex flex-col gap-2 p-7 items-center justify-center;

        *.title {
            @apply text-4xl sm:text-5xl font-black font-rubik uppercase;
        }

        *.subtitle {
            @apply text-sm sm:text-lg pb-1 opacity-80;
        }

        *.actions-wrap {
            @apply flex flex-row gap-3 flex-wrap items-center justify-center;

            *.action-button {
                @apply gap-1 text-sm sm:text-[16px] p-1 px-1.5 font-bold rounded-md cursor-pointer flex items-center justify-center transition-all;

                &:active {
                    scale: 0.98
                }
            }

        }
    }

    .pricing-plan-cards-wrap {
        @apply w-full h-fit flex flex-wrap gap-3 px-7 p-3 items-start justify-center;
    }

</style>