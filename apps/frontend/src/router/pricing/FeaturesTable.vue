<script setup lang="ts">
    import { CheckIcon, SparklesIcon, StarIcon, XIcon } from 'lucide-vue-next'
    import FeatureValue from './FeatureValue.vue';
    import type { SubscriptionPlanName } from '@sessionsbot/shared';
    import DiamondIcon from '../../components/icons/DiamondIcon.vue'


    const features = [
        {
            key: 'max_sessions',
            title: 'Maximum Active Sessions',
            values: {
                FREE: 7,
                PREMIUM: 15,
                ENTERPRISE: '∞',
            },
        },
        {
            key: 'max_rsvp_slots',
            title: 'Maximum RSVP Slots',
            values: {
                FREE: 3,
                PREMIUM: 5,
                ENTERPRISE: 10,
            },
        },
        {
            key: 'max_rsvp_capacity',
            title: 'Maximum RSVP Capacity',
            values: {
                FREE: 10,
                PREMIUM: 20,
                ENTERPRISE: '∞',
            },
        },
        {
            key: 'notifications',
            title: 'Automatic Session Notifications',
            values: {
                FREE: false,
                PREMIUM: true,
                ENTERPRISE: true,
            },
        },
        {
            key: 'custom_accent_color',
            title: 'Customizable Accent Color',
            values: {
                FREE: false,
                PREMIUM: true,
                ENTERPRISE: true,
            },
        },
        {
            key: 'watermark_shown',
            title: 'Session Bot Watermark Removed',
            values: {
                FREE: false,
                PREMIUM: true,
                ENTERPRISE: true,
            },
        },
    ]

    const plans: SubscriptionPlanName[] = ['FREE', 'PREMIUM', 'ENTERPRISE']
</script>


<template>
    <div class="w-full px-8">

        <!-- DESKTOP TABLE -->
        <div
            class="hidden bg-bg-1 md:grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-0.5 border-2 border-ring-2 rounded-md overflow-hidden">

            <!-- Header -->
            <div class="bg-bg-3/75 p-3 flex flex-row items-center gap-0.75">
                <StarIcon :size="18" class="w-fit! aspect-square! fill-amber-400/60" />
                <p class="font-bold"> Feature </p>
            </div>
            <div class="bg-bg-3/75 p-3 flex flex-row items-center justify-center gap-0.75">
                <svg class="fill-zinc-500/25!" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                    viewBox="0 0 24 24">
                    <g fill="inherit" stroke="currentColor" stroke-width="1.5">
                        <path
                            d="M12.005 7.334V5.011m0 11.615v2.323m-3.031-4.646v.865c0 .806.653 1.458 1.458 1.458h3.278c.806 0 1.459-.652 1.459-1.458v-1.643a1.46 1.46 0 0 0-1.05-1.4l-4.095-1.194a1.46 1.46 0 0 1-1.05-1.4v-.739c0-.805.653-1.458 1.458-1.458h3.278c.806 0 1.459.653 1.459 1.459v.866" />
                        <path d="M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0m18.66 5l-3.149-1.818M3.34 7l3.149 1.818" />
                    </g>
                </svg>
                <p class="font-bold"> Free </p>
            </div>
            <div class="bg-bg-3/75 p-3 flex flex-row items-center justify-center gap-0.75">
                <DiamondIcon class="size-5.5 fill-sky-700/50" />
                <p class="font-bold"> Premium </p>
            </div>
            <div class="bg-bg-3/75 p-3 flex flex-row items-center justify-center gap-0.75">
                <DiamondIcon class="size-5.5 fill-purple-700/50" />
                <p class="font-bold"> Enterprise </p>
            </div>


            <!-- Rows -->
            <template v-for="feature in features" :key="feature.key">
                <div class="bg-bg-3/75 p-3 font-medium text-text-1/70">
                    {{ feature.title }}
                </div>

                <div v-for="plan in plans" :key="feature.key + plan"
                    class=" bg-bg-2/70 dark:bg-text-1/17 p-3 flex items-center justify-center">
                    <FeatureValue :value="feature.values[plan]" />
                </div>
            </template>
        </div>

        <!-- MOBILE CARDS -->
        <div class="md:hidden flex flex-col items-center gap-4">
            <div v-for="feature in features" :key="feature.key"
                class="bg-bg-2 max-w-122 space-y-1 w-full border-2 border-ring-soft hover:border-ring-2/80 transition-all rounded-md p-4">
                <div class="p-1 pt-0 pl-0 flex gap-0.75 items-center">
                    <StarIcon :size="18" class="fill-zinc-500/40" />
                    <p class="font-bold">
                        {{ feature.title }}
                    </p>
                </div>

                <div class="flex flex-col gap-0 rounded overflow-clip border border-ring-soft/70">
                    <div v-for="plan in plans" :key="plan"
                        class="flex items-center justify-between bg-black/7 dark:bg-bg-3/40 border border-ring-soft/70 p-2">
                        <span class="font-semibold text-sm">
                            {{ plan }}
                        </span>
                        <FeatureValue :value="feature.values[plan]" />
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>



<style scoped></style>