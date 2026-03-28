<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { externalUrls } from '@/stores/nav';
    import useNotifier from '@/stores/notifier';
    import type { PopoverDesignTokens } from '@primeuix/themes/types/popover';
    import { ArrowLeftCircle, CircleDollarSignIcon } from 'lucide-vue-next';
    import type { Popover } from 'primevue';

    // Service(s):
    const dashboard = useDashboardStore();
    const notifier = useNotifier()

    // Root - Popover Ref:
    const switchServerPoRef = ref<InstanceType<typeof Popover>>()
    const togglePopOver = (e: Event) => {
        switchServerPoRef.value?.toggle(e)
    }

    // Last Fetch Date: 
    const lastGuildFetchDate = computed(() => dashboard.guildDataState.fetchedAt);

    // FN - Refresh API Data:
    async function refreshApiData() {
        let prevSelectionId = dashboard.guildId;
        if (prevSelectionId) {
            dashboard.guildId = null;
            setTimeout(() => {
                dashboard.guildId = prevSelectionId
            }, 300);
        }
    }

    async function attemptRefresh() {
        const difMins = Math.abs(lastGuildFetchDate.value?.diffNow('minutes')?.minutes ?? 2)
        const minCooldownMins = 2;
        if (difMins < minCooldownMins) {
            notifier.send({
                level: 'warn',
                header: 'Please Wait!',
                content: `Please wait at least ${minCooldownMins - difMins > 1 ? Math.round(minCooldownMins - difMins) + ' min(s)' : Math.floor((minCooldownMins - difMins) * 60) + ' sec(s)'} before refreshing your dashboard server data!`
            })
        } else await refreshApiData()
    }

</script>


<template>
    <slot :togglePopOver="togglePopOver" />
    <Popover unstyled class="mt-2 p-2 rounded bg-bg-soft border border-ring-soft!" ref="switchServerPoRef">

        <!-- Options List -->
        <ul class="options-list">

            <Button @click="dashboard.guildId = null;" unstyled class="option-button">
                <ArrowLeftCircle :size="17" />
                <p class="text-sm">
                    Manage another server
                </p>
            </Button>

            <a :href="externalUrls.discordStore" target="_blank">
                <Button unstyled class="option-button">
                    <CircleDollarSignIcon :size="17" />
                    <p class="text-sm">
                        Upgrade Bot Plan
                    </p>
                </Button>
            </a>

            <Button @click="attemptRefresh" unstyled class="option-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 485 485">
                    <path fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="35"
                        d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192s192-86 192-192Z" />
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="35"
                        d="M351.82 271.87v-16A96.15 96.15 0 0 0 184.09 192m-24.2 48.17v16A96.22 96.22 0 0 0 327.81 320" />
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="35" d="m135.87 256l23.59-23.6l24.67 23.6m192 0l-23.59 23.6l-24.67-23.6" />
                </svg>
                <p class="text-sm">
                    Refresh Server Data
                </p>
            </Button>

        </ul>
    </Popover>
</template>


<style scoped>
    @reference '@/styles/main.css';

    .options-list {
        @apply flex flex-col p-0 gap-2.25;
    }

    .option-button {
        @apply bg-text-1/2 text-text-1/80 hover:bg-text-1/7 ring-1 hover:ring-ring-2 ring-ring-soft active:scale-98 w-full flex items-center justify-start p-1 gap-0.75 rounded-md transition-all font-bold cursor-pointer;
    }
</style>