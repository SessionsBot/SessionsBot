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
                <Button unstyled @click="(e) => dashboard.sessionForm.visible = true"
                    class="bg-[#178954] hover:bg-[#178954]/80 py-0.5 p-2.25 rounded-sm active:scale-95 transition-all cursor-pointer">
                    <span class=" font-extrabold text-sm">
                        Create
                        <span class="hidden sm:inline">
                            Schedule
                        </span>
                    </span>
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
            <span class="w-full p-3 pt-2 flex flex-col gap-2 items-center justify-center flex-wrap first:bg-red-500!">
                <TemplateCard v-for="t in guildTemplates?.slice(tPageIndexStart ?? 0, ((tPageIndexStart ?? 0) + 5))"
                    kind="template" :template="t" :key="t.id" />
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

    /* Paginator Styles */
    .paginator {
        @apply !w-full p-1 border-t-2 border-ring;
        --p-paginator-background: var(--color-surface);
        --p-paginator-nav-button-hover-background: var(--color-ring);
        --p-paginator-nav-button-selected-background: var(--color-indigo-500);
        --p-paginator-nav-button-color: var(--color-white);
        --p-paginator-nav-button-hover-color: var(--color-white);
        --p-paginator-nav-button-selected-color: var(--color-white);
    }


    .upcoming-sessions-card {
        @apply bg-surface w-[90%] max-w-140 h-fit ring-ring ring-2 rounded-md flex flex-col items-center justify-center content-center flex-wrap;

        .card-header {
            @apply bg-black/20 border-b-2 border-ring flex w-full gap-8 p-3 justify-between items-center content-center flex-row;
        }

        .section-heading {
            @apply bg-black/20 border-2 border-ring/50 text-white/50 p-1.5 py-0.75 gap-0.5 flex self-start relative left-1.5 w-fit mt-2 rounded-lg flex-row items-center justify-center;

            p {
                @apply font-extrabold text-sm
            }
        }
    }

</style>