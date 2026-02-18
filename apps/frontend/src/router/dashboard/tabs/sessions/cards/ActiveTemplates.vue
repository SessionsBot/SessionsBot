<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { CalendarClockIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import TemplateCard from './SessionCard.vue';


    // Services:
    const dashboard = useDashboardStore();

    // ALL Active Templates - Sorted by Time next START time
    const guildTemplates = computed(() =>
        dashboard.guildData.sessionTemplates.state?.filter(t => {
            if (!t.next_post_utc) return false
            const nextPost = DateTime.fromISO(t.next_post_utc, { zone: 'utc' })
            return nextPost >= DateTime.utc()
        }).sort((a, b) => {
            const nextStartA = DateTime.fromISO(String(a.next_post_utc), { zone: 'utc' })
                .plus({ milliseconds: a.post_before_ms })
            const nextStartB = DateTime.fromISO(String(b.next_post_utc), { zone: 'utc' })
                .plus({ milliseconds: b.post_before_ms })
            return (nextStartA.toUnixInteger() - nextStartB.toUnixInteger())
        })
    );


    // All Templates/Schedules Paginator:
    const tPageIndexStart = ref<number>(0)


</script>


<template>
    <div class="flex justify-center items-center min-w-fit pt-10">

        <!-- Current Sessions Card -->
        <section class="upcoming-sessions-card">

            <!-- Header -->
            <div class="card-header">
                <!-- Card Title -->
                <div class="flex flex-row items-center justify-center gap-1 p-0.5 font-bold">
                    <CalendarClockIcon class="size-4.5 sm:size-5.5" />
                    <h1 class="sm:text-lg"> Schedules </h1>
                </div>


                <!-- Create Schedule - Button -->
                <Button unstyled class="button-primary" @click="dashboard.sessionForm.createNew()">
                    <Iconify icon="mdi:plus" />
                </Button>
            </div>


            <!-- All Schedules - Section -->
            <div class="section-heading">

                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="m12 20l1.3.86c-.2-.58-.3-1.21-.3-1.86c0-.24 0-.5.04-.71L12 17.6l-3 2l-3-2l-1 .66V5h14v8c.7 0 1.37.12 2 .34V3H3v19l3-2l3 2zm5-11V7H7v2zm-2 4v-2H7v2zm.5 6l2.75 3L23 17.23l-1.16-1.41l-3.59 3.59l-1.59-1.59z"
                        stroke-width="0.25" stroke="currentColor" />
                </svg>

                <p>
                    All Schedules:
                </p>
            </div>
            <!-- All Schedules - List -->
            <span class="w-full p-3 pt-2 flex flex-col gap-2 items-center justify-center flex-wrap">
                <TemplateCard v-for="t in guildTemplates?.slice(tPageIndexStart ?? 0, ((tPageIndexStart ?? 0) + 5))"
                    kind="template" :template="t" :key="t.id" />

                <!-- No Schedules - Card -->
                <div v-if="!guildTemplates?.length">
                    <p class="text-bold text-text-1">
                        No Schedules!
                    </p>
                    <p class="text-text-3 px-1 text-sm">
                        Start utilizing Sessions Bot and configure your first schedule..
                    </p>
                    <Button unstyled
                        class="button-base mt-1.5 active:scale-95 pr-1.5 gap-0 font-semibold bg-brand-1/90 hover:bg-brand-1/75">
                        <Iconify icon="mdi:plus" size="21" />
                        <p class="text-sm"> Create Schedule </p>
                    </Button>
                </div>
            </span>
            <!-- All Schedules - Paginator -->
            <Paginator v-model:first="tPageIndexStart" v-if="guildTemplates?.length"
                :total-records="guildTemplates?.length" :rows="5" :always-show="false" class="paginator">
            </Paginator>

        </section>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";


    .upcoming-sessions-card {
        @apply bg-bg-2 w-[90%] max-w-140 h-fit ring-ring-soft ring-2 rounded-md flex flex-col items-center justify-center content-center flex-wrap;

        .card-header {
            @apply bg-bg-4/20 border-b-2 border-ring-soft flex w-full gap-8 p-3 justify-between items-center content-center flex-row;
        }

        .section-heading {
            @apply bg-bg-4/20 border-2 border-ring-soft/50 text-text-1/50 p-1.5 py-0.75 gap-0.5 flex self-start relative left-1.5 w-fit mt-2 rounded-lg flex-row items-center justify-center;

            p {
                @apply font-extrabold text-sm
            }
        }
    }

</style>