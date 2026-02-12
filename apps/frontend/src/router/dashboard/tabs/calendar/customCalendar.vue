<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { ArrowLeftCircleIcon, ArrowRightCircleIcon, XIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import { Popover, type PopoverMethods } from 'primevue';
    import { RRule } from 'rrule';
    import DayViewDialog from './dayView/DayViewDialog.vue';

    // Services:
    const dashboard = useDashboardStore();
    const guildSessions = computed(() => dashboard.guildData.sessions.state);
    const guildTemplates = computed(() => dashboard.guildData.sessionTemplates.state);

    // HEADER - Month / Year Select Popover:
    const useMonthPopover = () => {

        const popoverRef = ref<PopoverMethods>()

        function togglePopover(e: Event) {
            popoverRef.value?.toggle(e)
        }

        const monthOptions = computed(() => {
            const months = [
                'January', 'February', 'March', 'April',
                'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'
            ]

            const year = selectedMonth.value.year;

            return months
                .map((name, index) => {
                    const monthNumber = index + 1;

                    const date = DateTime.local(year, monthNumber, 1).startOf('month');

                    const isAfterMin = date >= minMonth.startOf('month');
                    const isBeforeMax = date <= maxMonth.startOf('month');

                    if (!isAfterMin || !isBeforeMax) return null;

                    return {
                        name,
                        value: monthNumber
                    };
                })
                .filter(Boolean);
        });

        const yearOptions = computed(() => {
            // Get available years:
            let years = [];
            let cursor = minMonth.startOf('year');
            while (true) {
                const isAfterMin = cursor >= minMonth.startOf('year');
                const isBeforeMax = cursor <= maxMonth.startOf('year');
                if (!isAfterMin || !isBeforeMax) break;
                else {
                    years.push(cursor.year)
                    cursor = cursor.plus({ year: 1 }).startOf('year')
                }
            }

            return years;
        })



        return {
            popoverRef,
            togglePopover,

            yearOptions,
            monthOptions
        }
    }
    const monthSelectPopover = useMonthPopover();


    // CALENDAR - Current Month:
    const selectedMonth = ref(DateTime.now().startOf('month'));
    const maxMonth = DateTime.now().plus({ year: 15 }).startOf('month');
    const minMonth = DateTime.now().startOf('month').minus({ year: 5 })
    const previousMonth = () => selectedMonth.value = selectedMonth.value.minus({ month: 1 });
    const nextMonth = () => selectedMonth.value = selectedMonth.value.plus({ month: 1 });

    // CALENDAR - Computed Dates:
    const calendarWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthStart = computed(() => selectedMonth.value.startOf('month'));
    const monthEnd = computed(() => selectedMonth.value.endOf('month'));
    const leadingEmptyDays = computed(() => monthStart.value.weekday % 7)
    const daysInMonth = computed(() => {
        const days: DateTime[] = [];
        let cursor = monthStart.value;
        while (cursor <= monthEnd.value) {
            days.push(cursor)
            cursor = cursor.plus({ days: 1 })
        }
        return days;
    });


    // DAY VIEW - Dialog / Modal Panel:
    const dayViewVisible = ref(false);
    const dayViewDaySelected = ref<DateTime | undefined>(undefined);
    function openDayViewFor(d: DateTime) {
        dayViewDaySelected.value = d;
        dayViewVisible.value = true;
    }


    // Calendar Day Badge - Utils:
    function dayHasSessions(d: DateTime) {
        return guildSessions.value?.some((s) => DateTime.fromISO(s.starts_at_utc, { zone: 'local' })?.startOf('day')?.toSeconds() == d?.startOf('day')?.toSeconds())
    }
    function dayHasTemplates(d: DateTime) {
        // Get viewing day start:
        const viewDay = d?.startOf('day')
        if (viewDay.toSeconds() <= DateTime.now().startOf('day').toSeconds()) return false;
        if (!guildTemplates.value) return false;
        // Check each template:
        for (const t of guildTemplates.value) {
            const templateStartDay = DateTime.fromISO(t.starts_at_utc, { zone: 'local' }).startOf('day')
            // If template start date:
            if (templateStartDay.toSeconds() == viewDay.toSeconds()) return true;
            // Else - Check recurrences for this month:
            if (t.rrule) {
                const rule = RRule.fromString(t.rrule)
                const thisMonthOccurrences = rule.between(monthStart.value.toJSDate(), monthEnd.value.toJSDate());
                if (thisMonthOccurrences.length) {
                    // Recurrences THIS Month:
                    for (const reDateJs of thisMonthOccurrences) {
                        const localRecurrenceDate = DateTime.fromJSDate(reDateJs)
                        const zonedRecurrenceDate = localRecurrenceDate.setZone(t.time_zone)
                        if (zonedRecurrenceDate.startOf('day').toSeconds() == viewDay.toSeconds()) return true;
                    }
                }
            }
        }
        // Checks Failed - No Template for Day:
        return false;
    }

</script>


<template>
    <!-- Calendar Container -->
    <div
        class="flex bg-surface flex-col justify-center items-center w-fit h-fit lg:scale-108 mb-10 xl:scale-115 lg:m-5">

        <!-- Calendar Header -->
        <div class="calendar-header">
            <!-- Previous Month - Button -->
            <Button @click="previousMonth" title="Previous Month" unstyled class="adjust-month-button"
                :disabled="selectedMonth.minus({ month: 1 }) < minMonth">
                <ArrowLeftCircleIcon />
            </Button>

            <!-- This Month - Button / Popover -->
            <div @click="monthSelectPopover?.togglePopover" class="select-month-button">
                <p> {{ selectedMonth?.monthLong }} </p>
                <p> {{ selectedMonth?.year }} </p>

                <!-- Exact Select - Popover -->
                <Popover :ref="monthSelectPopover.popoverRef">
                    <div class="flex flex-row flex-nowrap gap-2 p-2 items-center justify-center">
                        <!-- Month Select -->
                        <Select inputId="month" size="small"
                            @value-change="(v) => selectedMonth = selectedMonth.set({ month: v })" option-label="name"
                            option-value="value" :options="monthSelectPopover.monthOptions.value" placeholder="Month"
                            v-bind:default-value="selectedMonth.month" />

                        <!-- Year Select -->
                        <Select inputId="year" size="small"
                            @value-change="(v) => selectedMonth = selectedMonth.set({ year: v })"
                            :options="monthSelectPopover.yearOptions.value" v-bind:default-value="selectedMonth.year"
                            placeholder="Year" />

                    </div>
                </Popover>
            </div>

            <!-- Next Month - Button -->
            <Button @click="nextMonth" title="Next Month" unstyled class="adjust-month-button"
                :disabled="selectedMonth.plus({ month: 1 }) > maxMonth">
                <ArrowRightCircleIcon />
            </Button>
        </div>


        <!-- Calendar Wrap -->
        <div class="calendar-wrap">

            <!-- Weekday Header Row -->
            <div class="weekday-header-row">
                <p v-for="weekday in calendarWeekdays" class="weekday-header">
                    {{ weekday }}
                </p>
            </div>

            <!-- Month / Calendar Days -->
            <div class="calendar-days-wrap">

                <!-- Leading EMPTY DAYS -->
                <div v-for="_ in leadingEmptyDays" class="size-px" />

                <!-- Calendar DAYS -->
                <Button unstyled v-for="day in daysInMonth" class="calendar-day" @click="openDayViewFor(day)" :class="{
                    'today-day': (DateTime.now().startOf('day').toSeconds() == day?.toSeconds())
                }">
                    {{ day.day }}
                    <!-- Chip Bar -->
                    <div class="absolute bottom-0.75 w-full h-1.75 gap-1 py-px flex items-center justify-center">
                        <!-- Single Session - Chip -->
                        <div :class="{ 'flex!': dayHasSessions(day) }"
                            class="hidden h-full w-fit rounded-full aspect-square bg-slate-600" />
                        <!-- Repeating Session - Chip -->
                        <div :class="{ 'flex!': dayHasTemplates(day) }"
                            class="hidden h-full w-fit rounded-full aspect-square bg-indigo-500/80" />
                    </div>
                </Button>

            </div>

            <!-- Guide/Key Footer -->
            <div class="calendar-footer-row">

                <!-- Calender Key/Guide -->
                <span class="flex flex-row items-center justify-center gap-2 w-fit h-full">
                    <!-- Session Item - Key -->
                    <div class="key-item">
                        <div class="size-2! rounded-full bg-slate-600" />
                        <p> Occurred </p>
                    </div>

                    <!-- Template Item - Key -->
                    <div class="key-item">
                        <div class="size-2! rounded-full bg-indigo-500/80" />
                        <p> Scheduled </p>
                    </div>
                </span>

                <!-- Today Button -->
                <Button v-if="selectedMonth.toSeconds() != DateTime.now().startOf('month').toSeconds()"
                    @click="selectedMonth = DateTime.now().startOf('month')" title="Today" unstyled
                    class="today-button">
                    <p> Today </p>
                </Button>

            </div>

        </div>

    </div>

    <!-- Calendar - Day View - Dialog -->
    <DayViewDialog v-model:visible="dayViewVisible" v-model:selected-day="dayViewDaySelected" />


</template>


<style scoped>

    @reference '@/styles/main.css';

    .calendar-header {
        @apply bg-black/20 w-full p-2 sm:text-lg rounded-md rounded-b-none border-2 border-ring flex justify-between items-center;

        .adjust-month-button {
            @apply p-0.5 rounded-md cursor-pointer transition-all hover:bg-white/20;

            &:active {
                @apply bg-white/15
            }

            &:disabled {
                @apply cursor-not-allowed opacity-40 bg-transparent
            }
        }

        .select-month-button {
            @apply p-0.5 px-2 gap-1 bg-white/15 hover:bg-white/10 flex flex-row items-center justify-center text-center font-extrabold text-nowrap rounded-md select-none cursor-pointer transition-all;

            &:active {
                @apply bg-white/8
            }
        }
    }


    .calendar-wrap {
        @apply bg-surface w-full !h-fit rounded-md rounded-t-none border-2 border-t-0 border-ring flex flex-col;

        .weekday-header-row {
            @apply bg-black/20 border-b-2 border-b-ring/30 w-full !h-fit grid px-2 grid-cols-7 grid-rows-1;

            .weekday-header {
                @apply w-full p-1 text-center font-semibold italic text-white/60;
            }
        }

        .calendar-days-wrap {
            @apply grid grid-cols-7 gap-2 p-2 sm:p-3 sm:gap-3 w-full items-center justify-center;

            .calendar-day {
                @apply relative bg-black/25 text-white/40 w-full aspect-square rounded-sm ring-2 ring-ring p-1 flex items-center justify-center font-black transition-all sm:p-2 sm:text-lg;

                &:hover {
                    @apply ring-white/60 text-white/60 cursor-pointer;
                }

                &.today-day {
                    @apply !text-amber-400/60;
                }
            }
        }

        .calendar-footer-row {
            @apply gap-2 p-2 bg-black/20 border-t-2 border-ring/30 w-full !h-fit flex items-center justify-between content-center flex-wrap;

            .key-item {
                @apply p-0.75 px-1 gap-1 bg-black/10 rounded-lg border-2 border-ring/40 flex flex-row items-center justify-center;

                p {
                    @apply text-xs font-medium text-white/50 wrap-break-word;
                }
            }

            .today-button {
                @apply hover:bg-white/10 hover:text-white/80 text-white/50 px-1.25 p-0.75 text-xs font-medium rounded-md cursor-pointer transition-all active:scale-95;
            }
        }


    }


</style>