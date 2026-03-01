<script lang="ts" setup>
    import { AuditEvent } from '@sessionsbot/shared';


    // Props - Event Type:
    const props = defineProps<{
        event: AuditEvent
    }>()

</script>


<template>

    <!-- Bot Added -->
    <div v-if="event == AuditEvent.BotAdded" class="flex gap-1 flex-row items-center w-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            class="min-w-fit! aspect-square!">
            <path fill="currentColor"
                d="M11.314 15.5a6.5 6.5 0 0 1 .708-1.5H6.254a2.25 2.25 0 0 0-2.25 2.25v.907a3.75 3.75 0 0 0 1.305 2.844c1.563 1.343 3.802 2 6.691 2q.405 0 .794-.017a6.5 6.5 0 0 1-1.062-1.485c-2.424-.038-4.231-.592-5.445-1.636a2.25 2.25 0 0 1-.783-1.706v-.907a.75.75 0 0 1 .75-.75zM17.5 11q.434 0 .854.056c.094-.25.146-.52.146-.801V5.75a2.25 2.25 0 0 0-2.25-2.25h-3.5v-.75l-.006-.101A.75.75 0 0 0 12 2l-.102.007a.75.75 0 0 0-.648.743l-.001.75h-3.5A2.25 2.25 0 0 0 5.5 5.75v4.505a2.25 2.25 0 0 0 2.25 2.25h5.59A6.47 6.47 0 0 1 17.5 11m-1.25-6a.75.75 0 0 1 .75.75v4.505a.75.75 0 0 1-.75.75h-8.5a.75.75 0 0 1-.75-.75V5.75A.75.75 0 0 1 7.75 5zm-6.5 1.5a1.25 1.25 0 1 1 0 2.499a1.25 1.25 0 0 1 0-2.499m4.492 0a1.25 1.25 0 1 1 0 2.499a1.25 1.25 0 0 1 0-2.499M23 17.5a5.5 5.5 0 1 0-11 0a5.5 5.5 0 0 0 11 0m-5 .5l.001 2.503a.5.5 0 1 1-1 0V18h-2.505a.5.5 0 0 1 0-1H17v-2.5a.5.5 0 1 1 1 0V17h2.497a.5.5 0 0 1 0 1z" />
        </svg>
        <p class=""> Bot Added</p>
    </div>

    <!-- Preference Updated -->
    <div v-else-if="event == AuditEvent.PreferencesUpdated" class="flex gap-1 flex-row items-center w-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 640 640"
            class="min-w-fit! aspect-square!">
            <path fill="currentColor"
                d="M259.1 73.5c3-14.8 16.1-25.5 31.3-25.5h59.8c15.2 0 28.3 10.7 31.3 25.5l14.5 70c14.1 6 27.3 13.7 39.3 22.8l67.8-22.5c14.4-4.8 30.2 1.2 37.8 14.4l29.9 51.8c7.6 13.2 4.9 29.8-6.5 39.9L511 297.3c.9 7.4 1.3 15 1.3 22.7s-.5 15.3-1.3 22.7l53.4 47.5c11.4 10.1 14 26.8 6.5 39.9L541 481.9c-7.6 13.1-23.4 19.2-37.8 14.4l-67.8-22.5c-12.1 9.1-25.3 16.7-39.3 22.8l-14.4 69.9c-3.1 14.9-16.2 25.5-31.3 25.5h-59.8c-15.2 0-28.3-10.7-31.3-25.5l-14.4-69.9c-14.1-6-27.2-13.7-39.3-22.8l-68.1 22.5c-14.4 4.8-30.2-1.2-37.8-14.4l-29.9-51.8c-7.6-13.2-4.9-29.8 6.5-39.9l53.4-47.5c-.9-7.4-1.3-15-1.3-22.7s.5-15.3 1.3-22.7l-53.4-47.5c-11.4-10.1-14-26.8-6.5-39.9l29.9-51.8c7.6-13.2 23.4-19.2 37.8-14.4l67.8 22.5c12.1-9.1 25.3-16.7 39.3-22.8zM320.3 400c44.2-.2 79.9-36.1 79.7-80.3s-36.1-79.9-80.3-79.7s-79.9 36.1-79.7 80.3s36.1 79.9 80.3 79.7" />
        </svg>
        <p class=""> Preference Updated</p>
    </div>

    <!-- RSVP Created -->
    <div v-else-if="event == AuditEvent.RsvpCreated" class="flex gap-1 flex-row items-center w-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 640 640"
            class="min-w-fit! aspect-square!">
            <path fill="currentColor"
                d="M136 192c0-66.3 53.7-120 120-120s120 53.7 120 120s-53.7 120-120 120s-120-53.7-120-120M48 546.3C48 447.8 127.8 368 226.3 368h59.4c98.5 0 178.3 79.8 178.3 178.3c0 16.4-13.3 29.7-29.7 29.7H77.7C61.3 576 48 562.7 48 546.3M544 160c13.3 0 24 10.7 24 24v48h48c13.3 0 24 10.7 24 24s-10.7 24-24 24h-48v48c0 13.3-10.7 24-24 24s-24-10.7-24-24v-48h-48c-13.3 0-24-10.7-24-24s10.7-24 24-24h48v-48c0-13.3 10.7-24 24-24" />
        </svg>
        <p class=""> RSVP Created</p>
    </div>

    <!-- RSVP Deleted -->
    <div v-else-if="event == AuditEvent.RsvpDeleted" class="flex gap-1 flex-row items-center w-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 640 512"
            class="min-w-fit! aspect-square!">
            <path fill="currentColor"
                d="M96 128a128 128 0 1 1 256 0a128 128 0 1 1-256 0M0 482.3C0 383.8 79.8 304 178.3 304h91.4c98.5 0 178.3 79.8 178.3 178.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3M472 200h144c13.3 0 24 10.7 24 24s-10.7 24-24 24H472c-13.3 0-24-10.7-24-24s10.7-24 24-24" />
        </svg>
        <p class=""> RSVP Deleted</p>
    </div>

    <!-- Session Created -->
    <div v-else-if="event == AuditEvent.ScheduleCreated" class="flex gap-1 flex-row items-center w-full">
        <svg class="min-w-fit! aspect-square!" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 16 16">
            <path fill="currentColor"
                d="M11.5 2A2.5 2.5 0 0 1 14 4.5v2.1a5.5 5.5 0 0 0-1-.393V6H3v5.5A1.5 1.5 0 0 0 4.5 13h1.707q.149.524.393 1H4.5A2.5 2.5 0 0 1 2 11.5v-7A2.5 2.5 0 0 1 4.5 2zm0 1h-7A1.5 1.5 0 0 0 3 4.5V5h10v-.5A1.5 1.5 0 0 0 11.5 3m4.5 8.5a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0m-4-2a.5.5 0 0 0-1 0V11H9.5a.5.5 0 0 0 0 1H11v1.5a.5.5 0 0 0 1 0V12h1.5a.5.5 0 0 0 0-1H12z" />
        </svg>
        <p class=""> Schedule Created</p>
    </div>

    <!-- Session Edited -->
    <div v-else-if="event == AuditEvent.ScheduleEdited" class="flex gap-1 flex-row items-center w-full">
        <svg class="min-w-fit! aspect-square!" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 16 16">
            <path fill="currentColor"
                d="M13.998 4.5a2.5 2.5 0 0 0-2.5-2.5H4.5A2.5 2.5 0 0 0 2 4.5v6.998a2.5 2.5 0 0 0 2.5 2.5h1.546l.25-1H4.5a1.5 1.5 0 0 1-1.5-1.5V6h10.336q.104-.005.207 0h.455zM4.5 3h6.998a1.5 1.5 0 0 1 1.5 1.5V5H3v-.5A1.5 1.5 0 0 1 4.5 3m9.02 3.999a1.6 1.6 0 0 0-.522.061c-.242.072-.47.203-.662.394L8.05 11.742a2.8 2.8 0 0 0-.722 1.256l-.009.033l-.303 1.211a.61.61 0 0 0 .74.74l1.21-.303a2.8 2.8 0 0 0 1.29-.73l4.288-4.288a1.56 1.56 0 0 0-1.023-2.662m-7.523 1.25a.748.748 0 1 1-1.497 0a.748.748 0 0 1 1.497 0m-.749 3.248a.748.748 0 1 0 0-1.497a.748.748 0 0 0 0 1.497m3.5-3.249a.748.748 0 1 1-1.496 0a.748.748 0 0 1 1.497 0" />
        </svg>
        <p class=""> Schedule Edited</p>
    </div>

    <!-- Session Posted -->
    <div v-else-if="event == AuditEvent.SessionPosted" class="flex gap-1 flex-row items-center w-full">
        <svg class="min-w-fit! aspect-square!" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 20 20">
            <path fill="currentColor"
                d="M5.5 16h3.707q.114.4.283.773L9.421 17H5.5A2.5 2.5 0 0 1 3 14.5v-9A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v4.1a5.5 5.5 0 0 0-1-.393V7H4v7.5A1.5 1.5 0 0 0 5.5 16m0-12A1.5 1.5 0 0 0 4 5.5V6h12v-.5A1.5 1.5 0 0 0 14.5 4zm5.063 12.682l-.544 1.789a.41.41 0 0 0 .51.51l1.79-.544a4.5 4.5 0 1 0-1.755-1.755M12.5 16a.5.5 0 0 1 0-1h2a.5.5 0 1 1 0 1zm0-3h4a.5.5 0 1 1 0 1h-4a.5.5 0 0 1 0-1" />
        </svg>
        <p class=""> Session Posted</p>
    </div>

    <!-- Session Deleted -->
    <div v-else-if="event == AuditEvent.ScheduleDeleted" class="flex gap-1 flex-row items-center w-full">
        <svg class="min-w-fit! aspect-square!" width="24" height="24" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd"
                d="M19.9016 4.09835C19.1984 3.39509 18.2446 3 17.25 3H6.75C5.75544 3 4.80161 3.39509 4.09835 4.09835C3.39509 4.80161 3 5.75544 3 6.75V17.25C3 18.2446 3.39509 19.1984 4.09835 19.9016C4.80161 20.6049 5.75544 21 6.75 21H9.9C9.656 20.524 9.4595 20.024 9.3105 19.5H6.75C6.15326 19.5 5.58097 19.2629 5.15901 18.841C4.73705 18.419 4.5 17.8467 4.5 17.25V9H19.5V9.3105C20.018 9.45757 20.5204 9.65501 21 9.9V6.75C21 5.75544 20.6049 4.80161 19.9016 4.09835ZM6.75 4.5H17.25C17.8467 4.5 18.419 4.73705 18.841 5.15901C19.2629 5.58097 19.5 6.15326 19.5 6.75V7.5H4.5V6.75C4.5 6.15326 4.73705 5.58097 5.15901 5.15901C5.58097 4.73705 6.15326 4.5 6.75 4.5ZM22.023 22.023C23.2888 20.7571 24 19.0402 24 17.25C24 15.4598 23.2888 13.7429 22.023 12.477C20.7571 11.2112 19.0402 10.5 17.25 10.5C15.4598 10.5 13.7429 11.2112 12.477 12.477C11.2112 13.7429 10.5 15.4598 10.5 17.25C10.5 19.0402 11.2112 20.7571 12.477 22.023C13.7429 23.2888 15.4598 24 17.25 24C19.0402 24 20.7571 23.2888 22.023 22.023ZM14.25 16.5C14.0511 16.5 13.8603 16.579 13.7197 16.7197C13.579 16.8603 13.5 17.0511 13.5 17.25C13.5 17.4489 13.579 17.6397 13.7197 17.7803C13.8603 17.921 14.0511 18 14.25 18H20.25C20.4489 18 20.6397 17.921 20.7803 17.7803C20.921 17.6397 21 17.4489 21 17.25C21 17.0511 20.921 16.8603 20.7803 16.7197C20.6397 16.579 20.4489 16.5 20.25 16.5H14.25Z"
                fill="currentColor" />
        </svg>
        <p class=""> Schedule Deleted</p>
    </div>

</template>


<style scoped></style>