<script setup lang="ts">
    import { CheckIcon, SparklesIcon, StarIcon, XIcon } from 'lucide-vue-next'
    import FeatureValue from './FeatureValue.vue';
    import { SubscriptionLimits, type SubscriptionPlanName } from '@sessionsbot/shared';
    import DiamondIcon from '../../components/icons/DiamondIcon.vue'

    const limits = SubscriptionLimits


    const features = [
        {
            key: 'max_schedules',
            title: 'Maximum Active Schedules',
            values: {
                FREE: limits.FREE.MAX_SCHEDULES,
                PREMIUM: limits.PREMIUM.MAX_SCHEDULES,
                ENTERPRISE: limits.ENTERPRISE.MAX_SCHEDULES,
            },
        },
        {
            key: 'max_rsvp_slots',
            title: 'Maximum RSVP Slots',
            values: {
                FREE: limits.FREE.MAX_RSVP_SLOTS,
                PREMIUM: limits.PREMIUM.MAX_RSVP_SLOTS,
                ENTERPRISE: limits.ENTERPRISE.MAX_RSVP_SLOTS,
            },
        },
        {
            key: 'max_rsvp_capacity',
            title: 'Maximum RSVP Capacity',
            values: {
                FREE: limits.FREE.MAX_RSVP_CAPACITY,
                PREMIUM: limits.PREMIUM.MAX_RSVP_CAPACITY,
                ENTERPRISE: limits.ENTERPRISE.MAX_RSVP_CAPACITY,
            },
        },
        {
            key: 'session_panels',
            title: 'Automatic Session Panel Posts',
            values: {
                FREE: true,
                PREMIUM: true,
                ENTERPRISE: true,
            },
        },
        {
            key: 'custom_rsvps',
            title: 'Customizable RSVP Slots',
            values: {
                FREE: true,
                PREMIUM: true,
                ENTERPRISE: true,
            },
        },
        {
            key: 'privatize_sessions',
            title: 'Private Sessions',
            values: {
                FREE: true,
                PREMIUM: true,
                ENTERPRISE: true,
            },
        },
        {
            key: 'custom_accent_color',
            title: 'Customizable Accent Color',
            values: {
                FREE: limits.FREE.CUSTOM_ACCENT_COLOR,
                PREMIUM: limits.PREMIUM.CUSTOM_ACCENT_COLOR,
                ENTERPRISE: limits.ENTERPRISE.CUSTOM_ACCENT_COLOR,
            },
        },
        {
            key: 'watermark_shown',
            title: 'Session Bot Watermark Removed',
            values: {
                FREE: !limits.FREE.SHOW_WATERMARK,
                PREMIUM: !limits.PREMIUM.SHOW_WATERMARK,
                ENTERPRISE: !limits.ENTERPRISE.SHOW_WATERMARK,
            },
        },
        {
            key: 'allow_mentions',
            title: 'Discord Mentions Allowed',
            values: {
                FREE: limits.FREE.ALLOW_MENTION_ROLES,
                PREMIUM: limits.PREMIUM.ALLOW_MENTION_ROLES,
                ENTERPRISE: limits.ENTERPRISE.ALLOW_MENTION_ROLES,
            },
        },
        {
            key: 'rsvp_role_restrictions',
            title: 'RSVP Role Restrictions',
            values: {
                FREE: limits.FREE.ALLOW_RSVP_ROLE_RESTRICTION,
                PREMIUM: limits.PREMIUM.ALLOW_RSVP_ROLE_RESTRICTION,
                ENTERPRISE: limits.ENTERPRISE.ALLOW_RSVP_ROLE_RESTRICTION,
            },
        },
        {
            key: 'custom_thread_mode',
            title: 'Customizable Thread Mode',
            values: {
                FREE: limits.FREE.CUSTOM_THREAD_START_MESSAGE,
                PREMIUM: limits.PREMIUM.CUSTOM_THREAD_START_MESSAGE,
                ENTERPRISE: limits.ENTERPRISE.CUSTOM_THREAD_START_MESSAGE,
            },
        },
        {
            key: 'data_retention',
            title: 'Data Retention Days',
            values: {
                FREE: `${limits.FREE.MAX_DATA_RETENTION_AGE.SESSIONS} days`,
                PREMIUM: `${limits.PREMIUM.MAX_DATA_RETENTION_AGE.SESSIONS} days`,
                ENTERPRISE: `${limits.ENTERPRISE.MAX_DATA_RETENTION_AGE.SESSIONS} days`,
            },
        },
    ]

    const plans: SubscriptionPlanName[] = ['FREE', 'PREMIUM', 'ENTERPRISE']
</script>


<template>
    <span class="w-full px-8">

        <!-- DESKTOP TABLE -->
        <div
            class="hidden bg-text-soft md:grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-0.5 border-2 border-ring-soft rounded-md overflow-hidden">

            <!-- Header -->
            <div class="bg-bg-3 p-3 flex flex-row items-center gap-0.75">
                <StarIcon :size="18" class="w-fit! aspect-square! fill-amber-400/60" />
                <p class="font-bold"> Feature </p>
            </div>
            <div class="bg-bg-3 p-3 flex flex-row items-center justify-center gap-0.75">
                <Iconify icon="tabler:free-rights" class="opacity-80" />
                <p class="font-bold"> Free </p>
            </div>
            <div class="bg-bg-3 p-3 flex flex-row items-center justify-center gap-0.75">
                <DiamondIcon class="size-5.5 fill-sky-700/50" />
                <p class="font-bold"> Premium </p>
            </div>
            <div class="bg-bg-3 p-3 flex flex-row items-center justify-center gap-0.75">
                <DiamondIcon class="size-5.5 fill-purple-700/50" />
                <p class="font-bold"> Enterprise </p>
            </div>


            <!-- Rows -->
            <template v-for="feature in features" :key="feature.key">
                <div class="bg-bg-3 p-3 font-semibold text-text-1/80">
                    {{ feature.title }}
                </div>

                <div v-for="plan in plans" :key="feature.key + plan"
                    class=" bg-bg-soft p-3 flex items-center justify-center">
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


    </span>
</template>



<style scoped></style>