<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { XIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import { RRule } from 'rrule';


    // Incoming Props / Modals:
    const isVisible = defineModel<boolean>('visible');
    const selectedDay = defineModel<DateTime | undefined>('selectedDay');

    const pastDay = computed(() => {
        if (!selectedDay.value) return true;
        else return selectedDay.value?.startOf('day') < DateTime.now().startOf('day')
    })

    // Services:
    const dashboard = useDashboardStore();

    // Get Sessions that OCCURRED this day:
    const thisDaysSessions = computed(() => {
        return dashboard.guildData.sessions.state?.filter(s => {
            const startInZone = DateTime.fromISO(s.starts_at_utc, { zone: 'local' });
            return startInZone.startOf('day').toSeconds() == selectedDay.value?.toSeconds()
        }).sort((a, b) => DateTime.fromISO(a.starts_at_utc).toSeconds() - DateTime.fromISO(b.starts_at_utc).toSeconds()) || []
    })

    // Get Sessions that are SCHEDULED to this day:
    const thisDaysTemplates = computed(() => {
        const guildTemplates = dashboard.guildData.sessionTemplates.state;
        if (!guildTemplates || !guildTemplates.length) return [];

        // Check each template:
        return guildTemplates.filter((t) => {
            const templateStartDay = DateTime.fromISO(t.starts_at_utc, { zone: 'local' }).startOf('day')
            // If template start date:
            if (templateStartDay.toSeconds() == selectedDay.value?.toSeconds()) return true;
            // Else - Check recurrences for this month:
            if (t.rrule) {
                const rule = RRule.fromString(t.rrule)
                if (!selectedDay.value) return false;
                const todaysRecurrence = rule.between(
                    selectedDay.value?.startOf('day').toJSDate(),
                    selectedDay.value?.endOf('day').toJSDate(),
                    true
                )
                if (todaysRecurrence) {
                    // Recurrences THIS Month:
                    for (const reDateJs of todaysRecurrence) {
                        const localRecurrenceDate = DateTime.fromJSDate(reDateJs)
                        // const zonedRecurrenceDate = localRecurrenceDate.setZone(t.time_zone)
                        if (localRecurrenceDate.startOf('day').toSeconds() == selectedDay.value?.toSeconds()) return true;
                    }
                }
            }
            // Check(s) Failed:
            return false;
        }).sort((a, b) => {
            // Sort by Next Start Time
            const startDateA = DateTime.fromISO(String(a?.next_post_utc)).plus({ millisecond: a.post_before_ms })
            const startDateB = DateTime.fromISO(String(b?.next_post_utc)).plus({ millisecond: b.post_before_ms })
            return (startDateA.toUnixInteger() - startDateB.toUnixInteger())
        })


    })


</script>


<template>
    <!-- Day View - Modal/Dialog -->
    <Dialog v-model:visible="isVisible" modal block-scroll :pt="{ root: 'bg-transparent! border-0! text-white/80!' }"
        class="w-[85%] max-w-130 bg-transparent! max-h-[90%] overflow-clip! rounded-md!">
        <template #container>
            <div
                class="flex flex-col w-full h-full justify-start items-start overflow-y-auto border-2 bg-surface border-ring rounded-md">
                <!-- Header -->
                <div
                    class="flex bg-black/20 border-b-2 border-inherit p-2 pb-1 gap-4 flex-row justify-between items-center w-full">
                    <span>
                        <p class="uppercase font-black text-xs text-white/40">
                            Day View - {{ selectedDay?.toFormat('D') || '?/?/?' }}
                        </p>
                        <p class="font-extrabold text-lg p-0.5 pl-0">
                            {{ selectedDay?.toFormat(`DDDD`) }}
                        </p>
                    </span>
                    <Button unstyled @click="isVisible = false"
                        class="p-1 flex items-center justify-center hover:bg-white/10 rounded-md cursor-pointer">
                        <XIcon :size="20" />
                    </Button>

                </div>

                <!-- Content -->
                <div class="content-wrap">

                    <!-- Occurred Sessions - List -->
                    <span class="section-wrap">
                        <p class="section-heading"> Occurred Sessions: </p>

                        <!-- Session Card -->
                        <div v-for="session in thisDaysSessions" class="list-item-card ">
                            <!-- Title / Details -->
                            <span class="flex flex-col gap-2">
                                <p class="font-bold text-[17px] truncate">
                                    {{ session?.title || 'Unknown Title' }}
                                </p>
                                <p>
                                    Started:
                                    {{ DateTime.fromISO(session.starts_at_utc, { zone: 'local' })?.toFormat('t')
                                        || '?' }}
                                </p>
                            </span>
                            <!-- Actions -->
                            <Button unstyled title="View Session" @click="$router.push(`/sessions/${session?.id}`)"
                                class="action-button text-indigo-400">
                                <Iconify icon="material-symbols:chat-paste-go-rounded" />
                            </Button>
                        </div>

                        <div v-if="!thisDaysSessions.length" class="list-item-card bg-white/10!">
                            <p v-if="pastDay" class="font-semibold italic opacity-55 inline">
                                No Sessions Created!
                            </p>
                            <p v-else="pastDay" class="font-semibold italic opacity-55 inline">
                                No Sessions Created Yet!
                            </p>
                        </div>
                    </span>

                    <!-- Scheduled Sessions - List -->
                    <span class="section-wrap">
                        <p class="section-heading"> Scheduled Sessions: </p>
                        <div v-for="template in thisDaysTemplates" class="list-item-card">
                            <!-- Title / Details -->
                            <span class="flex flex-col gap-2">
                                <p class="font-bold text-[17px] truncate">
                                    {{ template?.title || 'Unknown Title' }}
                                </p>
                                <p>
                                    Posts At:
                                    {{ DateTime.fromISO(String(template?.next_post_utc), {
                                        zone: 'local'
                                    })?.toFormat('t')
                                        || 'UNKNOWN?' }}
                                </p>
                            </span>
                            <!-- Actions -->
                            <Button unstyled title="Edit Schedule"
                                @click="dashboard.sessionForm.startEdit(template as any)"
                                class="action-button text-amber-400/80">
                                <Iconify icon="mdi:pencil" />
                            </Button>
                        </div>
                        <div v-if="!thisDaysTemplates.length" class="list-item-card bg-white/10!">
                            <p class="font-semibold italic opacity-55">
                                No Sessions Scheduled!
                            </p>
                            <br>
                            <Button v-if="!pastDay" unstyled title="Create Schedule"
                                @click="dashboard.sessionForm.visible = true" class="action-button p-1! px-2!">
                                Create One
                            </Button>
                        </div>
                    </span>

                </div>


            </div>

        </template>
    </Dialog>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .content-wrap {
        @apply w-full flex gap-2 p-2 items-center justify-start flex-col overflow-auto;
    }

    .section-heading {
        @apply uppercase text-sm self-start font-extrabold text-white/50 text-center bg-black/15 border-2 border-ring p-0.5 px-1.75 rounded-md;
    }

    .section-wrap {
        @apply flex w-full flex-col items-center justify-center gap-2 flex-wrap;
    }

    .list-item-card {
        @apply flex p-2 w-full max-w-[80%] gap-1.5 rounded-md bg-white/12 flex-row items-center justify-between;

        .action-button {
            @apply bg-black/27 font-bold cursor-pointer text-sm hover:bg-black/20 active:scale-95 transition-all rounded-md flex items-center justify-center gap-2 p-2;
        }

    }

</style>