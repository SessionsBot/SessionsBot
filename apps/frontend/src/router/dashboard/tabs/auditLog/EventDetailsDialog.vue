<script lang="ts" setup>
    import type { AuditEvent, Database } from '@sessionsbot/shared';
    import { ExternalLink, XIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import EventLabel from './EventLabel.vue';
    import UserLabel from './UserLabel.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';

    // Incoming Modals:
    const isVisible = defineModel<boolean>('isVisible');
    const selectedEvent = defineModel<Database['public']['Tables']['audit_logs']['Row'] | null>('selectedEvent')
    const eventType = computed(() => selectedEvent.value?.event_type as AuditEvent)
    const timestamp = computed(() => DateTime.fromISO(String(selectedEvent.value?.created_at), { zone: 'local' }))
    const eventMeta = computed(() => selectedEvent.value?.event_meta as Record<string, any> | null)

    // Services:
    const dashboard = useDashboardStore()
    const clipboard = useClipboard();
    const copyStates = ref<Map<string, 'idle' | 'success' | 'fail'>>(new Map())
    function copyText(n: string, v: string) {
        try {
            if (clipboard.isSupported) {
                clipboard.copy(v)
                copyStates.value?.set(n, 'success')
                // window.alert('Text has been copied to the clipboard!')
            } else {
                copyStates.value?.set(n, 'fail')
                // window.alert('Clipboard is NOT supported! Please manually copy the text value..')
            }
        } catch (err) {
            console.error('Failed to copy text value!', err);
            copyStates.value?.set(n, 'fail')
        } finally {
            setTimeout(() => {
                copyStates.value?.set(n, 'idle')
            }, 1_500);
        }
    }

    // Event Data - Occurred Date:
    const occurredDate = computed(() => {
        return DateTime.fromISO(String(selectedEvent.value?.created_at))
    })

    // Emit - Close:
    const emits = defineEmits<{
        close: []
    }>()

</script>


<template>
    <Dialog modal block-scroll :draggable="false" v-model:visible="isVisible" :pt="{ root: '' }"
        class="!bg-bg-2 !border-2 text-text-1/80! !border-ring-soft !w-[85%] !max-w-120 !overflow-clip">
        <template #container class="flex items-center justify-center">

            <!-- Header -->
            <section
                class="flex bg-black/20 relative flex-row justify-center items-center p-2 gap-0.75 border-b-2 border-ring-soft">
                <Iconify icon="clarity:details-solid" />
                <p class="font-extrabold p-0.75 text-xl opacity-90 uppercase text-text-1!">
                    Event Details
                </p>

            </section>

            <!-- Details -->
            <section hidden class="flex items-center justify-start flex-col gap-0 p-0 overflow-auto!">

                <div class="flex flex-col gap-2 p-3! items-center justify-center flex-wrap ">

                    <!-- Event Type - Copy Text -->
                    <span
                        class="bg-black/20 h-9 p-1 mt-3.25 border-2 border-ring-3 rounded relative! flex items-center justify-center">
                        <!-- Value Title -->
                        <p class="text-xs font-extrabold uppercase italic opacity-50 absolute -top-[1.5em] left-px">
                            Event Type
                        </p>
                        <!-- Value Display -->
                        <p class="w-full">
                            {{ selectedEvent?.event_type }}
                        </p>
                        <input :value="selectedEvent?.event_type" readonly
                            class="w-full h-full outline-none! text-text-1/50 font-semibold" />
                        <!-- Copy Text Button -->
                        <button @click="copyText('Event Type', String(selectedEvent?.event_type))" title="Copy Value"
                            class="transition-all cursor-pointer" :class="{
                                'copy-success': copyStates?.get('Event Type') == 'success',
                                'copy-fail': copyStates?.get('Event Type') == 'fail'
                            }">
                            <Iconify icon="akar-icons:clipboard" :size="19" class="size-full! aspect-square px-0.5" />
                        </button>

                    </span>

                    <!-- Event Date - Copy Text -->
                    <span
                        class="bg-black/20 h-9 p-1 mt-3.25 border-2 border-ring-3 rounded relative! flex items-center justify-center">
                        <!-- Value Title -->
                        <p class="text-xs font-extrabold uppercase italic opacity-50 absolute -top-[1.5em] left-px">
                            Date Occurred
                        </p>
                        <!-- Value Display -->
                        <input :value="occurredDate.toFormat('f')" readonly
                            class="w-full h-full outline-none! text-text-1/50 font-semibold" />
                        <!-- Copy Text Button -->
                        <button @click="copyText('Date Occurred', String(occurredDate.toFormat('f')))"
                            title="Copy Value" class="transition-all cursor-pointer" :class="{
                                'copy-success': copyStates?.get('Date Occurred') == 'success',
                                'copy-fail': copyStates?.get('Date Occurred') == 'fail'
                            }">
                            <Iconify icon="akar-icons:clipboard" :size="19" class="size-full! aspect-square px-0.5" />
                        </button>

                    </span>

                    <!-- Acting User - Copy Text -->
                    <span
                        class="bg-black/20 h-9 p-1 mt-3.25 border-2 border-ring-3 rounded relative! flex items-center justify-center">
                        <!-- Value Title -->
                        <p class="text-xs font-extrabold uppercase italic opacity-50 absolute -top-[1.5em] left-px">
                            {{ selectedEvent?.user_id == 'BOT' ? 'User' : 'User ID' }}
                        </p>
                        <!-- Value Display -->
                        <input :value="selectedEvent?.user_id" readonly
                            class="w-full h-full outline-none! text-text-1/50 font-semibold" />
                        <!-- Copy Text Button -->
                        <button @click="copyText('Acting User', String(selectedEvent?.user_id))" title="Copy Value"
                            class="transition-all cursor-pointer" :class="{
                                'copy-success': copyStates?.get('Acting User') == 'success',
                                'copy-fail': copyStates?.get('Acting User') == 'fail'
                            }">
                            <Iconify icon="akar-icons:clipboard" :size="19" class="size-full! aspect-square px-0.5" />
                        </button>

                    </span>

                    <!-- Meta Value(s) - Copy Text -->
                    <span v-for="[title, value] in Object.entries(selectedEvent?.event_meta as any)"
                        class="bg-black/20 h-9 p-1 mt-3.25 border-2 border-ring-3 rounded relative! flex items-center justify-center">
                        <!-- Value Title -->
                        <p class="text-xs font-extrabold uppercase italic opacity-50 absolute -top-[1.5em] left-px">
                            {{ title }}
                        </p>
                        <!-- Value Display -->
                        <input :value readonly class="w-full h-full outline-none! text-text-1/50 font-semibold" />
                        <!-- Copy Text Button -->
                        <button @click="copyText(title, String(value))" title="Copy Value"
                            class="transition-all cursor-pointer" :class="{
                                'copy-success': copyStates?.get(title) == 'success',
                                'copy-fail': copyStates?.get(title) == 'fail'
                            }">
                            <Iconify icon="akar-icons:clipboard" :size="19" class="size-full! aspect-square px-0.5" />
                        </button>

                    </span>

                </div>

            </section>

            <!-- Content -->
            <div class="flex flex-center self-center flex-col gap-1.25 p-4 overflow-auto w-fit">

                <!-- Event Type -->
                <div class="field-wrap">

                    <p class="field-heading">
                        Event Type:
                    </p>
                    <span class="field-value">
                        <EventLabel :event="eventType" class="font-semibold" />
                    </span>


                </div>

                <!-- Timestamp -->
                <div class="field-wrap">

                    <p class="field-heading">
                        Timestamp:
                    </p>
                    <span class="field-value">
                        <p class="font-semibold">
                            {{ timestamp.toFormat('f') ?? 'Unknown?' }}
                        </p>
                        <p class="text-xs opacity-60 italic">
                            ({{ timestamp.toRelative() ?? '' }})
                        </p>
                    </span>
                </div>

                <!-- Acting User -->
                <div class="field-wrap">

                    <p class="field-heading">
                        Acting User:
                    </p>
                    <span class="field-value">
                        <a :href="`https://discord.com/users/${selectedEvent?.user_id}`" target="_blank"
                            class="flex flex-row gap-1 items-center">
                            <UserLabel :user-id="String(selectedEvent?.user_id)" class="text-lg font-semibold" />
                            <ExternalLink :size="12" class="opacity-50" />
                        </a>
                    </span>
                </div>


                <!-- META FIELDS -->

                <!-- Meta - Reason -->
                <div v-if="eventMeta?.reason" class="field-wrap">

                    <p class="field-heading">
                        Reason:
                    </p>
                    <span class="field-value">
                        <p class="font-semibold">
                            {{ eventMeta?.reason }}
                        </p>
                    </span>
                </div>

                <!-- Meta - Session Id -->
                <div v-if="eventMeta?.session_id" class="field-wrap">

                    <p class="field-heading">
                        Session:
                    </p>
                    <span class="field-value">
                        <RouterLink :to="`/s/${eventMeta.session_id}`" class="flex flex-row gap-1 items-center">
                            <p class="font-semibold">
                                {{dashboard.guildData.sessions.state?.find(s => s?.id == eventMeta?.session_id)?.title
                                    ?? eventMeta?.session_id}}
                            </p>

                            <ExternalLink :size="12" class="opacity-50" />
                        </RouterLink>
                    </span>
                </div>

                <!-- Meta - Template Id -->
                <div v-if="eventMeta?.template_id" class="field-wrap">

                    <p class="field-heading">
                        Schedule:
                    </p>
                    <span class="field-value">

                        <p class="font-semibold">
                            {{dashboard.guildData.sessionTemplates.state?.find(s => s?.id ==
                                eventMeta?.template_id)?.title
                                ?? eventMeta?.template_id}}
                        </p>


                    </span>
                </div>

            </div>

            <!-- Footer -->
            <section
                class="w-full bg-black/20 border-t-2 border-ring-soft flex gap-2 items-center justify-center content-center flex-wrap">
                <Button unstyled @click="emits('close')"
                    class="gap-0 px-2 py-0.75 button-secondary font-bold m-2 self-center flex items-center justify-center w-fit cursor-pointer active:scale-95 transition-all rounded-md">
                    <XIcon class="p-px" />
                    <p> Close </p>
                </Button>
            </section>


        </template>
    </Dialog>
</template>


<style scoped>

    @reference '@/styles/main.css';

    .field-wrap {
        @apply flex flex-col gap-1 flex-wrap w-full;

        .field-heading {
            @apply text-xs opacity-60 font-semibold w-full;
        }

        .field-value {
            @apply w-fit ml-4 self-start p-1 px-1.5 rounded-md bg-bg-3/80;
        }
    }

    .copy-success {
        background: color-mix(in oklab, var(--color-emerald-500), var(--c-bg-1) 20%);
        border-radius: 4px;
    }

    .copy-fail {
        background: color-mix(in oklab, var(--color-invalid-1), var(--c-bg-1) 20%);
    }


</style>