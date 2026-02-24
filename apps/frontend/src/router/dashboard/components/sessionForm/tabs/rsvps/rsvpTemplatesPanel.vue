<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import useNotifier from '@/stores/notifier';
    import { CheckIcon, UserCircle, XIcon } from 'lucide-vue-next';

    // Services:
    const dashboard = useDashboardStore()
    const notifier = useNotifier();


    // Main Panel Visibility & Mode
    const isVisible = defineModel<boolean>('isVisible');
    function closePanel() {
        isVisible.value = false;
    }

    type RsvpTemplate = {
        name: string,
        emoji: string | null,
        capacity: number,
        required_roles: string[] | null
    }

    // RSVP Templates:
    const selectedTemplates = ref(new Set<RsvpTemplate>())
    const templateOptions: RsvpTemplate[] = [
        { name: 'Attendee', emoji: '🪑', capacity: 10, required_roles: null },
        { name: 'Interested', emoji: '🤔', capacity: 10, required_roles: null },
        { name: 'Host', emoji: '🎤', capacity: 1, required_roles: null },
        { name: 'Party Leader', emoji: '👑', capacity: 1, required_roles: null },

    ]
    function selectTemplate(t: RsvpTemplate) {
        selectedTemplates.value?.add(t)
    }
    function deselectTemplate(t: RsvpTemplate) {
        selectedTemplates.value?.delete(t)
    }
    function confirmSelection() {
        emits('addRsvps', [...selectedTemplates.value.values()])
        isVisible.value = false;
    }

    // Outgoing Emits:
    const emits = defineEmits<{
        addRsvps: [rsvps: RsvpTemplate[]]
    }>()

    // Reset on Close:
    watch(isVisible, (visible) => {
        if (!visible) {
            selectedTemplates.value = new Set()
        }
    })

</script>


<template>
    <Dialog :visible="isVisible" modal
        class="bg-bg-2! ring-0! border-2! border-ring-soft! m-7! p-2 overflow-y-auto! overflow-x-clip! items-center! justify-center!">
        <template #container="{ }">

            <!-- Header -->
            <div class="flex w-full items-center justify-between p-2 gap-8 flex-wrap">

                <!-- Header Wrap -->
                <span class="flex flex-row gap-1 items-center">
                    <Iconify icon="akar-icons:paper" />
                    <p class="font-bold text-lg">
                        RSVP Templates
                    </p>
                </span>


                <!-- Close Button -->
                <Button @click="closePanel()" unstyled class="button-base aspect-square p-1 hover:bg-zinc-500/50">
                    <XIcon :size="18" />
                </Button>
            </div>
            <!-- Subheading -->
            <p class="px-3.5 text-sm opacity-60">
                Choose from a list of pre-defined RSVP slots to add to your session.
            </p>



            <!-- Templates List -->
            <div
                class="w-[95%] m-3 mt-4 px-3 py-4 gap-2.5 bg-bg-1/80 rounded-md overflow-y-auto max-h-70 flex flex-col">

                <!-- Template Item -->
                <div v-for="t of templateOptions" class="flex items-center w-full h-fit flex-row flex-nowrap gap-2.5">
                    <!-- Checkbox -->
                    <Checkbox binary
                        @value-change="(s: boolean) => { if (s) { selectTemplate(t) } else { deselectTemplate(t) } }" />
                    <!-- Template Data -->
                    <div
                        class="flex bg-text-1/7 pl-2 flex-row w-full h-fit grow flex-wrap flex-center p-1 gap-2 bg-bg-soft rounded-lg border border-ring-soft">
                        <p> {{ t?.emoji }} </p>
                        <p> {{ t?.name }} </p>
                        <div class="w-fit opacity-50 text-sm grow p-px flex items-center justify-end flex-row gap-1">
                            <p> {{ t?.capacity }}</p>
                            <UserCircle :size="16" />
                        </div>
                    </div>
                </div>


            </div>
            <!-- Selected Count -->
            <p class="text-sm font-bold opacity-60 w-full px-2">
                {{ selectedTemplates?.size ?? 0 }} Selected
            </p>




            <!-- Footer - Actions -->
            <div class="flex w-full items-center justify-end p-2 gap-3 flex-wrap">

                <!-- Cancel Button -->
                <Button @click="closePanel()" unstyled
                    class="button-base px-1.75 py-0.5 bg-zinc-500/50 hover:bg-zinc-500/65 active:bg-zinc-500/50 active:scale-95">
                    <p class="font-medium"> Cancel </p>
                </Button>

                <!-- Confirm Button -->
                <Button @click="confirmSelection()" unstyled
                    class="button-base px-1 py-0.5 bg-zinc-500/50 hover:bg-zinc-500/65 active:bg-zinc-500/50 active:scale-95">
                    <CheckIcon :size="18" />
                    <p class="font-medium"> Confirm </p>
                </Button>
            </div>

        </template>
    </Dialog>
</template>


<style scoped></style>