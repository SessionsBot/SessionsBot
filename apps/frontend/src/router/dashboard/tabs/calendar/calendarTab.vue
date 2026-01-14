<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard'
    import { DateTime } from 'luxon'
    import { computed, ref } from 'vue'

    const dashboard = useDashboardStore();

    /**
     * State
     */
    const currentMonth = ref(DateTime.now().startOf('month'))

    /**
     * Constants
     */
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    /**
     * Derived dates
     */
    const monthStart = computed(() => currentMonth.value.startOf('month'))
    const monthEnd = computed(() => currentMonth.value.endOf('month'))

    /**
     * How many empty cells before day 1
     * Luxon: Monday = 1, Sunday = 7
     * We want Sunday = 0
     */
    const leadingEmptyDays = computed(() => monthStart.value.weekday % 7)

    /**
     * All days in the current month
     */
    const daysInMonth = computed(() => {
        const days: DateTime[] = []
        let cursor = monthStart.value

        while (cursor <= monthEnd.value) {
            days.push(cursor)
            cursor = cursor.plus({ days: 1 })
        }

        return days
    })

    /**
     * Navigation
     */
    function prevMonth() {
        currentMonth.value = currentMonth.value.minus({ months: 1 })
    }

    function nextMonth() {
        currentMonth.value = currentMonth.value.plus({ months: 1 })
    }
</script>

<template>
    <div class="flex flex-col w-full h-full flex-1 items-center">
        <div class="w-full max-w-200 p-6">
            <!-- Calendar Component -->
            <div class="bg-black/15 overflow-auto! max-w-full! rounded-md ring-2 ring-ring/30">
                <!-- Header -->
                <div class="flex w-full! items-center justify-between border-b-2 border-ring/50 bg-black/10">
                    <button @click="prevMonth" class="px-3 py-1 rounded hover:bg-white/7 transition-all cursor-pointer">
                        ←
                    </button>

                    <h2 class="text-xl font-semibold">
                        {{ currentMonth.toFormat('MMMM yyyy') }}
                    </h2>

                    <button @click="nextMonth" class="px-3 py-1 rounded hover:bg-white/7 transition-all cursor-pointer">
                        →
                    </button>
                </div>

                <!-- Calendar -->
                <div class="grid w-full min-w-fit! grid-cols-7 p-2 gap-2 bg-white/10">

                    <!-- Weekdays -->
                    <div v-for="day in weekdays" :key="day" class="text-center text-sm font-medium text-gray-500">
                        {{ day }}
                    </div>

                    <!-- Leading empty cells -->
                    <div v-for="n in leadingEmptyDays" :key="'empty-' + n" class="h-24" />

                    <!-- Days -->
                    <div v-for="day in daysInMonth" :key="String(day.toISO())"
                        class="h-24 w-full min-w-fit! border rounded-md p-2 hover:bg-white/7 transition-all cursor-pointer">
                        <div class="text-sm font-semibold">
                            {{ day.day }}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

</template>
