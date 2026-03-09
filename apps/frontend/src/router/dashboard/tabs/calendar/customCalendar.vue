<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import { Popover, type PopoverMethods } from 'primevue';
    import DayViewDialog from './dayView/DayViewDialog.vue';
    import { dayKey, getTemplateDayMapForMonth, isoToLocalDayKey } from './calendarUtils';

    // Services:
    const dashboard = useDashboardStore();
    const guildSessions = computed(() => dashboard.guildData.sessions.state);
    const guildTemplates = computed(() => dashboard.guildData.sessionTemplates.state);

    const todayStart = computed(() => DateTime.local().startOf('day'));
    const retentionDays = computed(
        () => dashboard.guildData.subscription.state?.limits?.MAX_DATA_RETENTION_AGE.SESSIONS ?? 0
    );
    const retentionCutoffDate = computed(() =>
        DateTime.local().minus({ days: retentionDays.value }).startOf('day')
    );

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

                    const isAfterMin = date >= minMonth.value;
                    const isBeforeMax = date <= maxMonth.value;

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
            const years: number[] = [];
            let cursor = minMonth.value.startOf('year');
            while (true) {
                const isAfterMin = cursor >= minMonth.value.startOf('year');
                const isBeforeMax = cursor <= maxMonth.value.startOf('year');
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
    const maxMonth = computed(() => DateTime.local().plus({ year: 5 }).startOf('month'));
    const minMonth = computed(() => retentionCutoffDate.value.startOf('month'));
    const previousMonth = () => selectedMonth.value = selectedMonth.value.minus({ month: 1 });
    const nextMonth = () => selectedMonth.value = selectedMonth.value.plus({ month: 1 });
    watch([minMonth, maxMonth], () => {
        if (selectedMonth.value < minMonth.value) selectedMonth.value = minMonth.value;
        if (selectedMonth.value > maxMonth.value) selectedMonth.value = maxMonth.value;
    }, { immediate: true });

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
    const sessionDaysInMonth = computed(() => {
        const keys = new Set<string>();
        const startKey = dayKey(monthStart.value);
        const endKey = dayKey(monthEnd.value);
        if (!startKey || !endKey) return keys;

        for (const session of guildSessions.value ?? []) {
            const key = isoToLocalDayKey(session.starts_at_utc);
            if (!key) continue;
            if (key < startKey || key > endKey) continue;
            keys.add(key);
        }
        return keys;
    });

    const templateDaysInMonth = computed(() => {
        return getTemplateDayMapForMonth(
            guildTemplates.value ?? [],
            monthStart.value,
            monthEnd.value,
            todayStart.value
        );
    });

    function dayHasSessions(d: DateTime) {
        const key = dayKey(d);
        if (!key) return false;
        return sessionDaysInMonth.value.has(key);
    }

    function dayHasTemplates(d: DateTime) {
        const key = dayKey(d);
        if (!key) return false;
        return templateDaysInMonth.value.daysWithTemplates.has(key);
    }

</script>


<template>
    <!-- Calendar Container -->
    <div
        class="flex bg-bg-2 rounded-md flex-col justify-center items-center w-fit h-fit lg:scale-108 mb-10 xl:scale-115 lg:m-5">

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
                <p v-for="weekday in calendarWeekdays" :key="weekday" class="weekday-header">
                    {{ weekday }}
                </p>
            </div>

            <!-- Month / Calendar Days -->
            <div class="calendar-days-wrap">

                <!-- Leading EMPTY DAYS -->
                <div v-for="n in leadingEmptyDays" :key="`lead-${n}`" class="size-px" />

                <!-- Calendar DAYS -->
                <Button unstyled v-for="day in daysInMonth" :key="String(day.toISODate())" class="calendar-day"
                    @click="openDayViewFor(day)" :class="{
                        'today-day': (DateTime.now().startOf('day').toSeconds() == day?.toSeconds())
                    }" :title="day.toFormat('M/d/yy')" :disabled="day <= retentionCutoffDate">
                    {{ day.day }}
                    <!-- Chip Bar -->
                    <div class="absolute bottom-0.75 w-full h-1.75 gap-1 py-px flex items-center justify-center">
                        <!-- Single Session - Chip -->
                        <div :class="{ 'flex!': dayHasSessions(day) && (day > retentionCutoffDate) }"
                            class="hidden h-full w-fit rounded-full aspect-square bg-slate-600/55" />
                        <!-- Repeating Session - Chip -->
                        <div :class="{ 'flex!': dayHasTemplates(day) && (day > retentionCutoffDate) }"
                            class="hidden h-full w-fit rounded-full aspect-square bg-indigo-500/55" />
                    </div>
                </Button>

            </div>

            <!-- Guide/Key Footer -->
            <div class="calendar-footer-row">

                <!-- Calender Key/Guide -->
                <span class="flex flex-row items-center justify-center gap-2 w-fit h-full">
                    <!-- Session Item - Key -->
                    <div class="key-item">
                        <div class="size-2! rounded-full bg-slate-600/55" />
                        <p> Occurred </p>
                    </div>

                    <!-- Template Item - Key -->
                    <div class="key-item">
                        <div class="size-2! rounded-full bg-indigo-500/55" />
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
        @apply w-full p-2 sm:text-lg rounded-md rounded-b-none border-2 border-ring-soft flex justify-between items-center;

        .adjust-month-button {
            @apply p-0.5 rounded-md cursor-pointer transition-all hover:bg-text-1/20;

            &:active {
                @apply bg-text-1/15
            }

            &:disabled {
                @apply cursor-not-allowed opacity-40 bg-transparent
            }
        }

        .select-month-button {
            @apply p-0.5 px-2 gap-1 bg-text-1/10 hover:bg-text-1/15 flex flex-row items-center justify-center text-center font-extrabold text-nowrap rounded-md select-none cursor-pointer transition-all;

            &:active {
                @apply bg-text-1/10;
            }
        }
    }


    .calendar-wrap {
        @apply w-full !h-fit rounded-md rounded-t-none border-2 border-t-0 border-ring-soft flex flex-col;

        .weekday-header-row {
            @apply bg-text-1/0 border-b-2 border-b-ring-soft w-full !h-fit grid px-2 grid-cols-7 grid-rows-1;

            .weekday-header {
                @apply w-full p-1 text-center font-semibold italic text-text-1/60;
            }
        }

        .calendar-days-wrap {
            @apply bg-text-1/0 grid grid-cols-7 gap-2.5 p-2 sm:p-3 sm:gap-3 w-full items-center justify-center;

            .calendar-day {
                @apply relative bg-bg-soft text-text-1/50 w-full aspect-square rounded-sm ring-2 ring-ring-soft p-1 flex items-center justify-center font-black transition-all sm:p-2 sm:text-lg;

                &:hover {
                    @apply ring-ring-1/80 text-text-1/80 cursor-pointer;
                }

                &:disabled {
                    @apply opacity-60 !ring-ring-soft !text-text-1/50 cursor-default;
                }

                &.today-day {
                    @apply text-amber-700/70 dark:text-amber-500/60;
                }
            }
        }

        .calendar-footer-row {
            @apply gap-2 p-2 border-t-2 border-ring-soft w-full !h-fit flex items-center justify-between content-center flex-wrap;

            .key-item {
                @apply p-0.75 px-1 gap-1 bg-bg-1/50 rounded-lg border-2 border-ring-soft flex flex-row items-center justify-center;

                p {
                    @apply text-xs font-medium text-text-1/50 wrap-break-word;
                }
            }

            .today-button {
                @apply hover:bg-bg-soft hover:text-text-1/80 text-text-1/50 px-1.25 p-0.75 text-xs font-medium rounded-md cursor-pointer transition-all active:scale-95;
            }
        }


    }


</style>
