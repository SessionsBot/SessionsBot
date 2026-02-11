<script lang="ts" setup>
    import { SubscriptionLevel } from '@sessionsbot/shared';
    import InputLabel from '../inputLabel.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { ExternalLinkIcon } from 'lucide-vue-next';


    // Services:
    const dashboard = useDashboardStore();

    // Field Value - Modal:
    // const fieldValue = defineModel<any>('field-value')

    // Emits:
    const emits = defineEmits<{
        validate: []
    }>()


</script>


<template>
    <!-- Input - Public Sessions -->
    <span class="input-group">

        <!-- Label -->
        <InputLabel title="Subscription Plan" icon-name="tabler:star-filled" :doc-path="undefined" />

        <!-- Input -->
        <div class="input">

            <!-- Simulated Input -->
            <RouterLink :to="`/pricing?guild=${dashboard?.guildId}`" class="w-full">
                <div title="Open Plan Details"
                    class="relative h-11 w-full p-1.25 py-1.5 gap-px bg-white/7 flex items-center justify-stretch border-2 border-zinc-300 hover:border-indigo-300 active:border-indigo-400 transition-all cursor-pointer rounded-md">

                    <Iconify v-if="dashboard.guildData.subscription.state?.level == 0" icon="mdi:dollar-off" />
                    <Iconify v-else icon="ri:diamond-line" class="relative bottom-px pl-0.5 pr-px" :size="22" />
                    <p class="font-bold uppercase">
                        {{ dashboard.guildData.subscription?.state?.title }}
                    </p>
                    <ExternalLinkIcon class="absolute right-2" :size="12" />


                </div>
            </RouterLink>

        </div>

    </span>
</template>


<style scoped></style>