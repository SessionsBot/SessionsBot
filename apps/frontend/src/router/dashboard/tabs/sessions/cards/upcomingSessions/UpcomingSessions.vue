<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { ArrowBigDown } from 'lucide-vue-next';
    import SessionCard from './SessionCard.vue';
    import { DateTime } from 'luxon';

    // Services:
    const dashboard = useDashboardStore();

    // Active Guild Sessions - From Start of Today in Sessions Selected Zone
    const guildSessions = computed(() => dashboard.guildData.sessions.state?.filter(s => {
        const startDate = DateTime.fromISO(s.starts_at_utc)
        return startDate >= DateTime.now().setZone(s.time_zone).startOf('day')
    }));


    // Guild Templates that post past today in selected zone:
    const guildTemplates = computed(() => dashboard.guildData.sessionTemplates.state?.filter(s => {
        if (!s.next_post_utc) return false
        const nextStart = DateTime.fromISO(s.next_post_utc)
        return nextStart >= DateTime.now().setZone(s.time_zone).startOf('day')
    }));

</script>


<template>
    <div class="flex justify-center items-center w-full pt-10">

        <!-- Current Sessions Card -->
        <section class="upcoming-sessions-card">

            <!-- Header -->
            <div class="card-header">
                <!-- Card Title -->
                <div class="flex flex-row items-center justify-center gap-0.5 p-0.5 font-bold">
                    <ArrowBigDown fill="white" class="size-4.5 sm:size-5.5" />
                    <h1 class="sm:text-lg"> Upcoming Sessions </h1>
                </div>
                <!-- Create Session - Button -->
                <Button unstyled @click="(e) => dashboard.sessionForm.visible = true"
                    class="bg-[#178954] hover:bg-[#178954]/80 py-0.5 p-1 rounded-sm active:scale-95 transition-all cursor-pointer">
                    <span class=" font-extrabold text-sm">
                        Create
                        <span class="hidden sm:inline">
                            Session
                        </span>
                    </span>
                </Button>
            </div>

            <div class="section-heading">
                <!-- <Iconify icon="tabler:clock-check" :size="15" /> -->

                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="m12 20l1.3.86c-.2-.58-.3-1.21-.3-1.86c0-.24 0-.5.04-.71L12 17.6l-3 2l-3-2l-1 .66V5h14v8c.7 0 1.37.12 2 .34V3H3v19l3-2l3 2zm5-11V7H7v2zm-2 4v-2H7v2zm.5 6l2.75 3L23 17.23l-1.16-1.41l-3.59 3.59l-1.59-1.59z"
                        stroke-width="0.25" stroke="currentColor" />
                </svg>

                <p>
                    Recently Posted
                </p>
            </div>

            <div class="w-full flex flex-col gap-2 items-center justify-center pt-2 p-4 min-h-15 ">

                <SessionCard v-for="s in guildSessions" :session="s" />

            </div>

            <div class="section-heading">

                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="M17 9H7V7h10zm-2 4v3.69l3.19 1.84l.75-1.3l-2.44-1.41V13zm-6 9l1.87-1.24A6.95 6.95 0 0 0 16 23c3.87 0 7-3.13 7-7c0-1.91-.76-3.64-2-4.9V3H3v19l3-2zm0-2.4l-3-2l-1 .66V5h14v4.67c-.91-.43-1.93-.67-3-.67c-1.91 0-3.64.76-4.9 2H7v2h2.67c-.43.91-.67 1.93-.67 3c0 1.12.26 2.17.73 3.11zm7 1.4c-2.76 0-5-2.24-5-5s2.24-5 5-5s5 2.24 5 5s-2.24 5-5 5"
                        stroke-width="0.25" stroke="currentColor" />
                </svg>

                <p>
                    Posting Soon
                </p>
            </div>

            <div class="w-full flex flex-col gap-2 items-center justify-center pt-2 p-4 min-h-15 ">

                <!-- <SessionCard v-for="t in guildTemplates" :session="t" /> -->

            </div>
        </section>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

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