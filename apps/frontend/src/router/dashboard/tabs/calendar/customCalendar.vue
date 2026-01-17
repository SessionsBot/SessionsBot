<script lang="ts" setup>
    import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import { number } from 'motion-v';
    import { Popover } from 'primevue';



    // HEADER - Month / Year Select Popover:
    const useMonthYearPopover = () => {
        const popover = ref<InstanceType<typeof Popover>>()
        function toggle(e: Event) {
            popover.value?.toggle(e)
        }

        const selectOptions = {
            months: [
                { name: 'January', value: 1 },
                { name: 'February', value: 2 },
                { name: 'March', value: 3 },
                { name: 'April', value: 4 },
                { name: 'May', value: 5 },
                { name: 'June', value: 6 },
                { name: 'July', value: 7 },
                { name: 'August', value: 8 },
                { name: 'September', value: 9 },
                { name: 'October', value: 10 },
                { name: 'November', value: 11 },
                { name: 'December', value: 12 }
            ],

            years: () => {
                const now = DateTime.now().startOf('year');
                const returnYears = 15
                let options: string | number[] = [];
                for (let i = 0; i <= returnYears; i++) {
                    options.push(
                        now.plus({ years: i })?.year
                    )
                }
                return options
            }
        }
        const selectDateValue = (opts: { month?: number, year?: number }) => {
            if (opts.month) {
                const selected = selectedMonth.value.set({ month: opts.month });
                if (selected >= minMonth) {
                    if (selected <= maxMonth) {
                        selectedMonth.value = selected
                    } else {
                        selectedMonth.value = maxMonth
                    }
                } else {
                    selectedMonth.value = minMonth
                }
            }
            if (opts.year) {
                const selected = selectedMonth.value.set({ year: opts.year });
                if (selected >= minMonth) {
                    if (selected <= maxMonth) {
                        selectedMonth.value = selected
                    } else {
                        selectedMonth.value = maxMonth
                    }
                } else {
                    selectedMonth.value = minMonth
                }
            }
        }

        return {
            popover,
            selectOptions,
            selectDateValue,
            toggle
        }
    };
    const monthYearPopover = useMonthYearPopover()

    // HEADER - Calendar View Type:
    const useCalendarViewType = () => {
        type ViewType = 'Day' | 'Week' | 'Month';
        const currentView = ref<ViewType>('Month');
        const switchCalendarView = (view: ViewType) => { currentView.value = view };

        return {
            currentView,
            switchCalendarView
        }
    }
    const { currentView: currentCalendarViewType, switchCalendarView } = useCalendarViewType()


    // CALENDAR - Current Month:
    const selectedMonth = ref(DateTime.now().startOf('month'));
    const maxMonth = DateTime.now().plus({ year: 15 }).startOf('month');
    const minMonth = DateTime.now().startOf('month').plus({ month: 2 });
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

</script>


<template>
    <div class="flex flex-col justify-center items-center w-full p-5">

        <!-- Calendar Header -->
        <div class="calendar-header">
            <!-- Previous Month - Button -->
            <Button @click="previousMonth" title="Previous Month" unstyled class="adjust-month-button"
                :disabled="selectedMonth.minus({ month: 1 }) < minMonth">
                <ArrowLeftCircleIcon />
            </Button>

            <!-- This Month - Button / Popover -->
            <div @click="monthYearPopover.toggle" class="select-month-button">
                <p> {{ selectedMonth?.monthLong }} </p>
                <p> {{ selectedMonth?.year }} </p>

                <!-- Exact Select - Popover -->
                <Popover :ref="monthYearPopover.popover">
                    <div class="flex flex-row flex-wrap gap-2 p-2 items-center justify-center">
                        <!-- Month Select -->
                        <IftaLabel>
                            <label for="month">
                                Month
                            </label>
                            <Select inputId="month" size="small"
                                @value-change="(v) => monthYearPopover.selectDateValue({ month: v })"
                                option-label="name" option-value="value"
                                :options="monthYearPopover.selectOptions.months" placeholder="Month"
                                v-bind:default-value="selectedMonth.month" />
                        </IftaLabel>
                        <!-- Year Select -->
                        <IftaLabel>
                            <label for="year">
                                Year
                            </label>
                            <Select inputId="year" size="small"
                                @value-change="(v) => monthYearPopover.selectDateValue({ year: v })"
                                :options="monthYearPopover.selectOptions.years()"
                                v-bind:default-value="selectedMonth.year" placeholder="Year" />
                        </IftaLabel>
                    </div>
                </Popover>
            </div>

            <!-- Next Month - Button -->
            <Button @click="nextMonth" title="Next Month" unstyled class="adjust-month-button"
                :disabled="selectedMonth.plus({ month: 1 }) > maxMonth">
                <ArrowRightCircleIcon />
            </Button>
        </div>

        <!-- Calendar Sub-Header -->
        <div hidden class="calendar-subheader">
            <!-- Previous Month - Button -->
            <div class="view-buttons-wrap">
                <Button @click="switchCalendarView('Day')" unstyled class="view-type-button"
                    :class="{ 'selected': currentCalendarViewType == 'Day' }">
                    Day
                </Button>
                <Button @click="switchCalendarView('Week')" unstyled class="view-type-button"
                    :class="{ 'selected': currentCalendarViewType == 'Week' }">
                    Week
                </Button>
                <Button @click="switchCalendarView('Month')" unstyled class="view-type-button"
                    :class="{ 'selected': currentCalendarViewType == 'Month' }">
                    Month
                </Button>
            </div>



            <!-- Next Month - Button -->
            <Button title="Today" unstyled class="today-button">
                <p> Today </p>
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

            <!-- Month Days -->
            <div class="calendar-days-wrap">
                <!-- Leading Empty Days -->
                <div v-for="_ in leadingEmptyDays" class="size-px" />

                <!-- calendar Month Days -->
                <div v-for="day in daysInMonth" class="calendar-day"
                    @click="console.log('Viewing Details for Day', day.toFormat('F'))">
                    {{ day.day }}
                    <!-- Chip Bar -->
                    <div class="absolute bottom-1 w-full h-1.75 sm:h-3 gap-1 flex items-center justify-center">
                        <!-- Single Session - Chip -->
                        <div hidden class="h-full w-fit rounded-full aspect-square bg-gray-600" />
                        <!-- Repeating Session - Chip -->
                        <div hidden class="h-full w-fit rounded-full aspect-square bg-indigo-500/80" />
                    </div>
                </div>
            </div>

        </div>



    </div>
</template>


<style scoped>

    @reference '@/styles/main.css';

    .calendar-header {
        @apply bg-zinc-700 w-full max-w-125 p-2 rounded-md rounded-b-none border-2 border-ring flex justify-between items-center;

        *.adjust-month-button {
            @apply p-0.5 rounded-md cursor-pointer transition-all hover:bg-white/20;

            &:active {
                @apply bg-white/15
            }

            &:disabled {
                @apply cursor-not-allowed opacity-50 bg-zinc-700
            }
        }

        *.select-month-button {
            @apply p-0.5 px-1.5 gap-1 bg-white/15 hover:bg-white/10 flex flex-row items-center justify-center text-center font-extrabold text-nowrap rounded-md select-none cursor-pointer transition-all;

            &:active {
                @apply bg-white/8
            }
        }
    }

    .calendar-subheader {
        @apply bg-zinc-700 w-full max-w-125 p-1.5 px-2 rounded-md rounded-b-none border-2 rounded-t-none border-t-0 border-ring flex justify-between items-center;

        *.view-buttons-wrap {
            @apply flex flex-row flex-nowrap gap-1 p-0.75 bg-zinc-800/80 rounded-md;

            *.view-type-button {
                @apply bg-white/10 hover:bg-white/15 px-1.5 py-0.5 text-sm font-semibold rounded-md cursor-pointer transition-all;

                &.selected {
                    @apply !bg-indigo-400/40;
                }
            }
        }

        *.today-button {
            @apply bg-white/10 hover:bg-white/15 px-1.5 py-0.5 text-sm font-semibold rounded-md cursor-pointer transition-all;
        }
    }


    .calendar-wrap {
        @apply bg-zinc-800 w-full max-w-125 rounded-md rounded-t-none border-2 border-t-0 border-ring flex flex-col grow;

        *.weekday-header-row {
            @apply w-full !h-fit grid px-2 grid-cols-7 grid-rows-1;

            *.weekday-header {
                @apply w-full p-1 text-center font-semibold italic text-white/60;
            }
        }

        *.calendar-days-wrap {
            @apply grid grid-cols-7 gap-2 p-2 w-full h-full items-center justify-center;

            *.calendar-day {
                @apply relative bg-black/15 w-full aspect-square rounded-sm ring-2 ring-ring p-1 flex items-center justify-center text-white/40 sm:text-lg font-black transition-all;

                &:hover {
                    @apply ring-white/60 cursor-pointer;
                }
            }
        }
    }

</style>