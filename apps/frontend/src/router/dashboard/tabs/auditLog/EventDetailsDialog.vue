<script lang="ts" setup>
    import type { Database } from '@sessionsbot/shared';
    import { XIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';

    // Incoming Modals:
    const isVisible = defineModel<boolean>('isVisible');
    const selectedEvent = defineModel<Database['public']['Tables']['audit_logs']['Row'] | null>('selectedEvent')

    // Services:
    const clipboard = useClipboard();
    const copyStates = ref<Map<string, 'idle' | 'success' | 'fail'>>(new Map())
    function copyText(n: string, v: string) {
        console.info('copyingggg...')
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

    // Event Data - META:
    const eventMetaData = computed<Record<string, any>>(() => {
        const rawMeta = selectedEvent.value?.event_meta;
        if (!rawMeta) return {}
        const parsed = JSON.parse(String(rawMeta))
        console.info(parsed)
        return parsed
    })

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
        class="!bg-surface !border-2 text-white/80! !border-ring !w-[85%] !max-w-120 !overflow-clip">
        <template #container class="dialog-container flex items-center justify-center">

            <!-- Header -->
            <section
                class="flex bg-black/20 relative flex-row justify-center items-center p-2 gap-0.75 border-b-2 border-ring">
                <Iconify icon="clarity:details-solid" />
                <p class="font-extrabold p-0.75 text-xl uppercase text-white!">
                    Event Details
                </p>

                <Button title="Close Details" unstyled @click="$emit('close')"
                    class="absolute! right-2! hover:bg-zinc-600/40 flex items-center justify-center p-1 rounded-md cursor-pointer transition-all">
                    <XIcon class="min-w-fit opacity-70 aspect-square" />
                </Button>
            </section>

            <!-- Details -->
            <section class="flex items-center justify-start flex-col gap-0 p-0 border-b-2 border-ring overflow-auto!">

                <div class="field-value flex flex-col gap-2 p-3! items-center justify-center flex-wrap ">

                    <!-- Event Type - Copy Text -->
                    <span
                        class="bg-black/20 h-9 p-1 mt-3.25 border-2 border-ring rounded relative! flex items-center justify-center">
                        <!-- Value Title -->
                        <p class="text-xs font-extrabold uppercase italic opacity-50 absolute -top-[1.5em] left-px">
                            Event Type
                        </p>
                        <!-- Value Display -->
                        <input :value="selectedEvent?.event_type" readonly
                            class="w-full h-full outline-none! text-white/50 font-semibold" />
                        <!-- Copy Text Button -->
                        <button @click="copyText('Event Type', String(selectedEvent?.event_type))" title="Copy Value"
                            class="transition-all cursor-pointer" :class="{
                                'text-emerald-500': copyStates?.get('Event Type') == 'success',
                                'text-red-400!': copyStates?.get('Event Type') == 'fail'
                            }">
                            <Iconify icon="akar-icons:clipboard" :size="19" class="size-full! pl-1!" />
                        </button>

                    </span>

                    <!-- Event Date - Copy Text -->
                    <span
                        class="bg-black/20 h-9 p-1 mt-3.25 border-2 border-ring rounded relative! flex items-center justify-center">
                        <!-- Value Title -->
                        <p class="text-xs font-extrabold uppercase italic opacity-50 absolute -top-[1.5em] left-px">
                            Date Occurred
                        </p>
                        <!-- Value Display -->
                        <input :value="occurredDate.toFormat('f')" readonly
                            class="w-full h-full outline-none! text-white/50 font-semibold" />
                        <!-- Copy Text Button -->
                        <button @click="copyText('Date Occurred', String(occurredDate.toFormat('f')))"
                            title="Copy Value" class="transition-all cursor-pointer" :class="{
                                'text-emerald-500': copyStates?.get('Date Occurred') == 'success',
                                'text-red-400!': copyStates?.get('Date Occurred') == 'fail'
                            }">
                            <Iconify icon="akar-icons:clipboard" :size="19" class="size-full! pl-1!" />
                        </button>

                    </span>

                    <!-- Acting User - Copy Text -->
                    <span
                        class="bg-black/20 h-9 p-1 mt-3.25 border-2 border-ring rounded relative! flex items-center justify-center">
                        <!-- Value Title -->
                        <p class="text-xs font-extrabold uppercase italic opacity-50 absolute -top-[1.5em] left-px">
                            {{ selectedEvent?.user_id == 'BOT' ? 'User' : 'User ID' }}
                        </p>
                        <!-- Value Display -->
                        <input :value="selectedEvent?.user_id" readonly
                            class="w-full h-full outline-none! text-white/50 font-semibold" />
                        <!-- Copy Text Button -->
                        <button @click="copyText('Acting User', String(selectedEvent?.user_id))" title="Copy Value"
                            class="transition-all cursor-pointer" :class="{
                                'text-emerald-500': copyStates?.get('Acting User') == 'success',
                                'text-red-400!': copyStates?.get('Acting User') == 'fail'
                            }">
                            <Iconify icon="akar-icons:clipboard" :size="19" class="size-full! pl-1!" />
                        </button>

                    </span>

                    <!-- Meta Value(s) - Copy Text -->
                    <span v-for="[title, value] in Object.entries(eventMetaData)"
                        class="bg-black/20 h-9 p-1 mt-3.25 border-2 border-ring rounded relative! flex items-center justify-center">
                        <!-- Value Title -->
                        <p class="text-xs font-extrabold uppercase italic opacity-50 absolute -top-[1.5em] left-px">
                            {{ title }}
                        </p>
                        <!-- Value Display -->
                        <input :value readonly class="w-full h-full outline-none! text-white/50 font-semibold" />
                        <!-- Copy Text Button -->
                        <button @click="copyText(title, value)" title="Copy Value" class="transition-all cursor-pointer"
                            :class="{
                                'text-emerald-500': copyStates?.get(title) == 'success',
                                'text-red-400!': copyStates?.get(title) == 'fail'
                            }">
                            <Iconify icon="akar-icons:clipboard" :size="19" class="size-full! pl-1!" />
                        </button>

                    </span>

                </div>

            </section>

            <!-- Footer -->
            <section class="w-full bg-black/20 flex gap-2 items-center justify-center content-center flex-wrap">
                <Button unstyled @click="emits('close')"
                    class="gap-0 px-2 py-0.75 bg-white/15 hover:bg-white/9 text-white font-bold m-2 self-center flex items-center justify-center w-fit cursor-pointer active:scale-95 transition-all rounded-md">
                    <XIcon class="p-px" />
                    <p> Close Details </p>
                </Button>
            </section>


        </template>
    </Dialog>
</template>


<style scoped></style>