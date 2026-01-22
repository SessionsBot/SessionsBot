<script setup lang="ts">
    import { calculateExpiresAtUTC, calculateNextPostUTC, dbIsoUtcToDateTime } from "@sessionsbot/shared";
    import type { API_SessionTemplateBodyInterface } from "@sessionsbot/shared/zodSchemas";
    import { DateTime } from "luxon";
    import { getTimeZones } from "@vvo/tzdb";
    import { ArrowBigDown, ArrowBigDownIcon, Calendar1Icon, CalendarSyncIcon, FilterIcon, MotorbikeIcon, PencilIcon, Trash2Icon, UserCheck2Icon, UserX2Icon } from "lucide-vue-next";
    import { motion, stagger, type Variants } from 'motion-v'
    import useDashboardStore from "@/stores/dashboard/dashboard";


    // Services:
    const dashboard = useDashboardStore();

    // Guild/Session Templates Data:
    const sessionTemplates = computed(() => dashboard.guild.sessionTemplates);

    // Session Form Control
    const sessionsFormVisible = computed({
        get: () => dashboard.sessionForm.visible,
        set: (v) => (dashboard.sessionForm.visible = v)
    })
    const startSessionFormEdit = dashboard.startNewSessionFormEdit

    // Session List - Animation Variants:
    const sessionListVariants = {
        hidden: {},
        visible: {
            transition: {
                delayChildren: stagger(0.2, { from: "first" }),
            },
        }
    }
    const sessionItemVariants = {
        hidden: { opacity: 0, scale: 0 },
        visible: {
            opacity: 1, scale: 1, transition: {
                duration: 0.15,

            }
        }
    }
    const sessionItemExtraVariants = {
        hidden: { opacity: 0, scale: 1, y: 15 },
        visible: {
            opacity: 1, scale: 1, y: 0, transition: {
                duration: 0.25,
            },
        }
    }

    // Util: Has RSVPs Boolean Fn:
    function hasRsvps(session: API_SessionTemplateBodyInterface) {
        if (!session.rsvps) return false;
        try {
            const json = JSON.parse(String(session.rsvps));
            return true;
        } catch (err) {
            return false;
        }
    }

</script>

<template>
    <div
        class="bg-white/10 rounded-md overflow-clip ring-2 w-[90%] max-w-170 ring-ring/40 flex flex-wrap flex-col items-center justify-center">
        <!-- Header - Upcoming Sessions -->
        <div
            class="flex gap-1 w-full border-b-2 border-ring/60 bg-zinc-900 p-2.5 flex-row items-center justify-between">
            <div class="flex flex-row gap-0.75 items-center">
                <ArrowBigDownIcon :fill="'white'" :size="22" />
                <p class="sm:text-lg font-extrabold"> Upcoming Sessions </p>
            </div>
            <div class="flex items-center gap-1 ">
                <!-- Filter -->
                <Button hidden unstyled
                    class="bg-zinc-700 hover:bg-zinc-700/80 size-8 rounded-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center">
                    <FilterIcon :size="16" />
                </Button>
                <!-- Create Session Button -->
                <Button unstyled @click="(e) => sessionsFormVisible = true"
                    class="bg-[#178954] hover:bg-[#178954]/80 py-0.5 p-1 rounded-sm active:scale-95 transition-all cursor-pointer">
                    <p class="p-1 font-extrabold text-sm">
                        Create
                        <i class="hidden sm:inline">
                            Session
                        </i>
                    </p>
                </Button>
            </div>
        </div>

        <!-- Content - Sessions List -->
        <motion.ul :variants="sessionListVariants" initial="hidden" animate="visible" v-if="sessionTemplates"
            class="flex bg-black/15 gap-4.5 p-3.5 flex-wrap w-full justify-center items-center">

            <!-- Session Card / Row Item: -->
            <motion.li :variants="sessionItemVariants" v-for="session in sessionTemplates" :key="session.id"
                class="flex flex-wrap gap-1 w-full items-center ring-2 ring-ring bg-black/15 p-1 rounded-md">
                <!-- Card Cover Content -->
                <div class="flex flex-row flex-wrap justify-center items-start grow-4 p-1 gap-2">

                    <!-- Title / Time / Zone -->
                    <div class="flex flex-wrap flex-col justify-center items-start gap-1.5">
                        <!-- Title -->
                        <p class="bg-indigo-500/70 font-bold rounded-md p-0.5 py-0.25"> {{ session.title }} </p>
                        <!-- Time & Zone -->
                        <div class="flex font-bold flex-row flex-nowrap gap-0 items-start justify-center">
                            <p :title="DateTime.fromISO(session.starts_at_utc, { zone: session.time_zone }).toFormat('F')"
                                class="bg-black/25 text-white/75 text-sm rounded-md rounded-tr-none p-0.5">
                                {{ DateTime
                                    .fromISO(session.starts_at_utc, { zone: session.time_zone })
                                    .toLocaleString(DateTime.TIME_SIMPLE)
                                }}
                            </p>
                            <p :title="getTimeZones({ includeUtc: true }).find(tz => tz.name == session.time_zone)?.alternativeName"
                                class="bg-black/25 text-white/50 text-xs h-fit  rounded-tl-none rounded-bl-none rounded-md pb-0.25 p-0.5 pr-0.75">
                                {{
                                    getTimeZones({ includeUtc: true }).find(tz => tz.name ==
                                        session.time_zone)?.abbreviation
                                    ||
                                    'UNK?'
                                }}
                            </p>
                        </div>
                    </div>

                    <!-- Session Info/Data Display -->
                    <div class="flex max-h-15 flex-wrap gap-1 items-start justify-start bg-amber-500/0 grow rounded-md">

                        <!-- Repeat Icon -->
                        <div class="sessionDataBadge">
                            <CalendarSyncIcon v-if="session?.rrule" :size="16" />
                            <Calendar1Icon v-else :size="16" />
                        </div>

                        <!-- RSVPs Icon -->
                        <div class="sessionDataBadge">
                            <UserCheck2Icon v-if="hasRsvps(session as any)" :size="16" />
                            <UserX2Icon v-else :size="16" />
                        </div>

                    </div>

                </div>

                <!-- Session/Template Buttons -->
                <div class="flex grow flex-row gap-1.5 items-center justify-end p-1.5">

                    <!-- Edit Schedule - Button -->
                    <Button @click="startSessionFormEdit?.(session as any)" v-if="session.rrule" unstyled
                        title="Edit Schedule"
                        class="bg-zinc-600/80 hover:bg-zinc-600/60 size-6.5 flex flex-col flex-wrap items-center justify-center transition-all active:scale-95 p-0.5 px-1 cursor-pointer rounded-md">
                        <PencilIcon :size="17" class="p-px" />
                    </Button>

                </div>
            </motion.li>

            <!-- Trailing / End of Sessions Text -->
            <motion.li :variants="sessionItemExtraVariants" v-if="sessionTemplates?.length"
                class="w-full gap-0.5 flex flex-col items-center justify-center">
                <div class="h-1 my-0.5 w-22 bg-ring/70 rounded-full" />
                <p class="italic opacity-30"> Thats all for now!</p>
            </motion.li>

            <!-- No Sessions Found - Card -->
            <motion.li :variants="sessionItemExtraVariants" v-if="!sessionTemplates?.length">
                <div class="flex bg-white/5 p-1 my-5 rounded-md ring-2 ring-ring/50">
                    <p class="opacity-70 p-1 px-3.75"> No upcoming sessions.. </p>
                </div>
            </motion.li>

        </motion.ul>

    </div>
</template>

<style scoped>
    @reference "@/styles/main.css";

    .sessionDataBadge {
        @apply flex items-center justify-center gap-0.25 flex-nowrap bg-black/15 text-white/80 font-semibold p-0.75 rounded-md
    }
</style>
