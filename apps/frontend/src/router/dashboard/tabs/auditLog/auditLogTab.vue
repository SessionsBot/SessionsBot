<script lang="ts" setup>

    const auditEvents = ref<{ date: Date, user: string, action: string }[]>(
        [
            { date: new Date(), user: 'BOT', action: 'Created Session' },
            { date: new Date(), user: 'br4dyb', action: 'RSVPed to Session' },
            { date: new Date(), user: 'BOT', action: 'Created Session' },
            { date: new Date(), user: 'br4dyb', action: 'Un-RSVPed from Session' },
        ]
    )

</script>


<template>
    <div class="dashboard-tab-view">
        <!-- Title & Desc -->
        <div class="w-full flex items-center justify-start flex-row gap-0">
            <div class="w-fit h-fit flex aspect-square">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48">
                    <g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4">
                        <path d="M13 10h28v34H13z" />
                        <path stroke-linecap="round" d="M35 10V4H8a1 1 0 0 0-1 1v33h6m8-16h12m-12 8h12" />
                    </g>
                </svg>

            </div>
            <p class="text-xl px-1.5 uppercase font-black">
                Audit Log
            </p>
        </div>

        <p class="mx-4 pt-1 text-sm text-start w-full text-white/70">
            Take a look below at any of the recent actions Sessions Bot or server members have made in relation to
            sessions, RSVPs, etc.
        </p>

        <!-- Audit Log - Table -->
        <div class="auditLog">

            <!-- Header Row -->
            <div class="font-bold uppercase grid grid-cols-3">
                <p class="heading-cell rounded-tl-md">
                    Date
                </p>

                <p class="heading-cell">
                    User
                </p>

                <p class="heading-cell rounded-tr-md">
                    Action
                </p>
            </div>

            <!-- Content Row -->
            <div v-for="e of auditEvents" class="content-row">
                <p class="content-cell">
                    {{ e.date.toLocaleDateString() }}
                </p>

                <p class="content-cell">
                    {{ e.user }}
                </p>

                <p class="content-cell ">
                    {{ e.action }}
                </p>
            </div>


            <p class="italic font-black w-full mt-2 text-center uppercase text-xs text-white/40">
                . . .<br>
                END OF EVENTS
            </p>

        </div>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .auditLog {
        @apply mt-5 pb-2 bg-white/5 ring-ring ring-2 rounded-md w-[95%];

        *.heading-cell {
            @apply w-full text-center p-2 bg-black/10 ring-1 ring-ring;
        }

        *.content-row {
            @apply w-full grid grid-cols-3 grid-rows-1
        }

        *.content-cell {
            @apply bg-white/7 flex items-center w-full p-1 px-1.5 ring-1 ring-ring font-medium text-white/85;
        }

    }

</style>