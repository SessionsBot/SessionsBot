<script lang="ts" setup>

    import { Icon } from '@iconify/vue';
    import type { FullSessionData } from '@sessionsbot/shared';
    import { google, ics, outlook, outlookMobile, yahoo, type CalendarEvent } from 'calendar-link';
    import { DateTime } from 'luxon';


    // Incoming Props:
    const props = defineProps<{
        eventData: FullSessionData | undefined
    }>()

    // Session - Data:
    const session = computed(() => props.eventData)

    const startUtc = computed(() => DateTime.fromISO(String(session.value?.starts_at_utc), { zone: 'utc' }))
    const endUtc = computed(() => {
        const duration_ms = session?.value?.duration_ms
        if (duration_ms) {
            return startUtc.value.plus({ millisecond: duration_ms })
        } else return undefined
    })

    // Calendar Event Data:
    const eventData = computed<CalendarEvent>(() => {
        return <CalendarEvent>{
            uid: session?.value?.id,
            title: session?.value?.title,
            description: session?.value?.description,
            start: startUtc?.value?.isValid
                ? startUtc?.value?.toISO()
                : DateTime.utc()?.toISO(),
            end: endUtc?.value?.isValid
                ? endUtc?.value?.toISO()
                : undefined,
            busy: true,
            url: session?.value?.url ?? undefined
        }
    })

    // Util - ICS Event Format - Download:
    function downloadIcsFile() {
        const url = ics(eventData.value)
        const a = document.createElement('a')
        a.href = url
        a.download = `${session.value?.title ?? 'session'}.ics`
        a.click()
    }


    // Services:
    const colorMode = useColorMode()

    // Calendars:
    const calendarOptions: {
        title: string,
        icon: string,
        href?: string,
        action?: (...args: any) => void
    }[] = [
            {
                title: 'Apple',
                icon: 'logos:apple',
                action() { downloadIcsFile() }
            },
            {
                title: 'Google',
                icon: 'mdi:google',
                href: google(eventData.value) ?? 'https://calendar.google.com/'
            },
            {
                title: 'Yahoo',
                icon: 'streamline-logos:yahoo-logo-block',
                href: yahoo(eventData.value) ?? 'https://calendar.yahoo.com/'
            },
            {
                title: 'Outlook',
                icon: 'file-icons:microsoft-outlook',
                href: outlookMobile(eventData.value) || outlook(eventData.value)
            },
            {
                title: 'Universal - (.ics File)',
                icon: 'mdi:calendar-outline',
                action() { downloadIcsFile() }
            },
        ]

</script>


<template>
    <div class="flex-center p-2 w-fit gap-2 flex-col bg-bg-soft border-2 border-ring-soft rounded-md">

        <p class="w-full font-bold opacity-70 text-sm pr-5">
            Choose a Calendar Service:
        </p>

        <!-- Calendar Option -->
        <Button v-for="cal in calendarOptions" unstyled @click="cal?.action"
            class="button-base gap-1 justify-start! w-full! borer border-2 border-ring-soft/70 hover:border-ring-soft p-2">
            <Iconify :icon="cal?.icon" size="20" class="opacity-70"
                :class="{ 'invert!': cal.icon?.includes('apple') && colorMode == 'dark' }" />
            <p class="text-sm">
                {{ cal?.title }}
            </p>

            <!-- Top Z - Link -->
            <a v-if="cal?.href" :href="cal?.href" target="_blank" class="z-2 w-full h-full absolute inset-0" />

        </Button>

    </div>
</template>


<style scoped></style>