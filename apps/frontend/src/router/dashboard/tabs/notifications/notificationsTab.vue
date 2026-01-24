<script lang="ts" setup>


</script>


<template>
    <div class="dashboard-tab-view">
        <!-- Title & Desc -->
        <div class="w-full flex items-center justify-start flex-row gap-0">
            <div class="w-fit h-fit aspect-square">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="M12 18.5q.625 0 1.063-.437T13.5 17h-3q0 .625.438 1.063T12 18.5M10 14v-3q0-.825.588-1.412T12 9t1.413.588T14 11v3zm2 8q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m-4-4h8q.425 0 .713-.288T17 15t-.288-.712T16 14v-2.6q0-1.525-.788-2.787T13 7v-.5q0-.425-.288-.712T12 5.5t-.712.288T11 6.5V7q-1.425.35-2.212 1.613T8 11.4V14q-.425 0-.712.288T7 15t.288.713T8 16" />
                </svg>
            </div>
            <p class="text-xl px-1.5 uppercase font-black">
                Notifications
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
                    ~~~~~
                </p>

                <p class="heading-cell">
                    ~~~~~~
                </p>

                <p class="heading-cell rounded-tr-md">
                    ~~~~~~~~
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