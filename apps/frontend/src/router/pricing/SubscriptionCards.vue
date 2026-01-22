<script lang="ts" setup>
    import { externalUrls } from '@/stores/nav';
    import type { SubscriptionPlanName } from '@sessionsbot/shared';


    type PlanData = {
        title: string,
        description: string,
        price: number,
        features: string[]
    }
    const planCards: Record<SubscriptionPlanName, PlanData> = {
        FREE: {
            title: 'Free',
            description: 'Available for all to enjoy, at absolutely no cost!',
            price: 0,
            features: [
                'Schedule up to 7 active sessions.',
                'Configure a max of 3 RSVP slots per session.',
                'Post to a specified channel for EACH session.',
            ]
        },
        PREMIUM: {
            title: 'Premium',
            description: 'Great for medium-large servers, ready to get scheduling!',
            price: 3.99,
            features: [
                'Schedule up to 15 active sessions.',
                'Configure a max of 5 RSVP slots per session.',
                'All features from FREE Plan.',
            ]
        },
        ENTERPRISE: {
            title: 'Enterprise',
            description: 'Best for largest servers, looking to get the most from Sessions Bot!',
            price: 8.99,
            features: [
                'Schedule ∞ active sessions.',
                'Configure a max of 10 RSVP slots per session.',
                'All features from PREMIUM Plan.',
            ]
        },
    }

</script>


<template>
    <!-- Pricing Plan - Cards -->
    <div class="pricing-plan-cards-wrap">

        <!-- Pricing Cards -->
        <div v-for="plan in planCards" :key="plan.title" class="subscription-plan-card">
            <!-- Title & Desc & Price -->
            <div class="font-rubik flex flex-col p-2 items-center justify-center w-full">
                <p class="text-2xl px-2 p-1 font-black  uppercase w-full">
                    {{ plan.title }}
                </p>

                <div class="flex flex-row flex-nowrap items-start justify-center w-full">

                    <p class="font-bold opacity-45 pr-1">
                        $
                    </p>
                    <p class="text-4xl font-black text-indigo-500">
                        {{ plan.price }}
                    </p>

                    <p class="text-xs opacity-45 uppercase pl-0.5 self-end pb-1">
                        / mo
                    </p>
                </div>

                <p class="text-sm font-semibold text-white/40 px-2 w-full line-clamp-3">
                    {{ plan.description }}
                </p>
            </div>

            <!-- Features -->
            <div class="flex flex-col w-full items-center justify-center gap-2">
                <p class="font-black text-xs opacity-70 uppercase w-full px-2">
                    Features:
                </p>


                <div v-for="[i, feat] of Array.from(plan.features).entries()" :key="plan.title + '-feat-' + i"
                    class="flex relative flex-row flex-nowrap gap-2 px-4 p-2 pb-2.5 w-full items-center justify-center">
                    <CheckIcon class="min-w-fit! text-indigo-500 aspect-square" />
                    <p>
                        {{ feat }}
                    </p>
                    <div v-if="i != plan.features?.length - 1"
                        class="absolute bottom-0.5 w-[85%] h-0.75 bg-ring/40  rounded-full" />
                </div>
            </div>

            <!-- Action Button -->
            <a v-if="plan.title == 'Free'" :href="externalUrls.inviteBot" target="_blank" class="pb-5">
                <Button unstyled class="action-button button-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12m6.148 2.553a.75.75 0 0 0 .155 1.05A5.77 5.77 0 0 0 12 16.75a5.77 5.77 0 0 0 3.447-1.148a.75.75 0 0 0-.894-1.204A4.27 4.27 0 0 1 12 15.25a4.27 4.27 0 0 1-2.553-.852a.75.75 0 0 0-1.05.155M15.25 10a.75.75 0 1 0-1.5 0v.5a.75.75 0 0 0 1.5 0zM9.5 9.25a.75.75 0 0 0-.75.75v.5a.75.75 0 0 0 1.5 0V10a.75.75 0 0 0-.75-.75" />
                    </svg>
                    Use for FREE
                </Button>
            </a>
            <a v-else :href="externalUrls.discordStore" target="_blank" class="pb-5">
                <Button unstyled class="action-button button-secondary">
                    <ShopIcon />
                    View Discord Shop
                </Button>
            </a>
        </div>

    </div>
</template>


<style scoped>

    @reference '@/styles/main.css';

    .pricing-plan-cards-wrap {
        @apply w-full h-fit flex flex-wrap gap-5 px-7 py-0 items-center justify-center;

        .subscription-plan-card {
            @apply bg-black/30 border-2 gap-2 min-w-65 max-w-60 grow flex-1 border-ring hover:border-white/60 transition-all rounded-md flex flex-col items-center justify-center;
        }
    }

</style>