<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { XIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import { RRule } from 'rrule';


    // Incoming Props / Modals:
    const isVisible = defineModel<boolean>('visible');
    const selectedDay = defineModel<DateTime | undefined>('selectedDay');

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

                return false;
            }
        }).sort((a, b) => {
            const startDateA = DateTime.fromISO(String(a?.next_post_utc)).plus({ millisecond: a.post_before_ms })
            const startDateB = DateTime.fromISO(String(b?.next_post_utc)).plus({ millisecond: b.post_before_ms })
            return (startDateA.toUnixInteger() - startDateB.toUnixInteger())
        })


    })


</script>


<template>
    <!-- Day View - Modal/Dialog -->
    <Dialog v-model:visible="isVisible" modal block-scroll :pt="{ root: 'bg-transparent! border-0! text-white/80!' }"
        class="w-[85%] max-w-130 bg-transparent! max-h-full overflow-auto">
        <template #container>
            <div
                class="flex flex-col w-full h-full justify-center items-start border-2 bg-surface border-ring rounded-md">
                <!-- Header -->
                <div
                    class="flex bg-black/20 border-b-2 border-inherit p-2 pb-1 gap-4 flex-row justify-between items-center w-full">
                    <span>
                        <p class="uppercase font-black text-xs text-white/40"> Day View </p>
                        <p class="font-extrabold p-0.5 pl-0">
                            {{ selectedDay?.toFormat('D') || 'Select a Day!' }}
                        </p>
                    </span>
                    <Button unstyled @click="isVisible = false"
                        class="p-1 flex items-center justify-center hover:bg-white/10 rounded-md cursor-pointer">
                        <XIcon :size="20" />
                    </Button>

                </div>
                <!-- Content -->
                <div class="flex bg-white/2 p-15 w-full! h-fit items-center justify-center">
                    Content Here!
                </div>

                <p> SESSIONS </p>
                <p v-for="session in thisDaysSessions">
                    {{ session?.title || '?' }}
                </p>


                <p> TEMPLATES </p>
                <p v-for="template in thisDaysTemplates">
                    {{ template?.title || '?' }} {{ template.time_zone }}
                </p>

            </div>

        </template>
    </Dialog>
</template>


<style scoped></style>