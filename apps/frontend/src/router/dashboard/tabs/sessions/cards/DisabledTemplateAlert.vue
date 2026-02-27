<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { externalUrls } from '@/stores/nav';
    import { FileWarningIcon, XIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';

    // Services:
    const dashboard = useDashboardStore();
    const disabledTemplates = computed(() => dashboard.guildData.sessionTemplates?.state?.filter(t => !t.enabled))

    // Dialog:
    const showDisabledTemplatesDialog = ref(false)

    // Util Fn: Open Ses Form - Re-Enable Schedule:
    async function startReEnableSch(sch: typeof dashboard.sessionForm.editPayload) {
        console.info('Starting re-enable sch form...')
        dashboard.sessionForm.editPayload = sch
        await nextTick()
        dashboard.sessionForm.actionMode = 're-enable';
        dashboard.sessionForm.visible = true;
    }

    // Define Emits:
    const emits = defineEmits<{
        dismiss: []
    }>()

</script>


<template>
    <!-- Wrap Area -->
    <div class="flex w-full flex-center flex-wrap flex-col p-2">

        <!-- Alert Area -->
        <div class="flex max-w-125 flex-col flex-center bg-bg-soft border-2 border-invalid-soft rounded-md">
            <!-- Header -->
            <div class="w-full flex flex-row gap-1 flex-center border-b-2 p-2 border-b-invalid-soft">
                <!-- Title -->
                <span class="flex flex-row items-center gap-1 font-bold grow ">
                    <Iconify icon="mingcute:file-warning-line" />
                    <p class="text-lg">
                        You have disabled schedules!
                    </p>
                </span>
                <!-- Close -->
                <Button unstyled @click="emits('dismiss')"
                    class="button-base aspect-square min-w-fit! p-0.75 bg-zinc-500/50 hover:bg-zinc-600/60 active:bg-zinc-500/50 active:scale-95">
                    <XIcon :size="20" />
                </Button>
            </div>

            <!-- Desc -->
            <p class="bg-blue-500/0 p-2.5 text-sm opacity-70">
                This is likely due to the bot trying to post a session to a channel/guild it doesn't have the right
                access
                or permissions to.
                See the <a class="text-link hover:underline" :href="externalUrls.documentation"
                    target="_blank">documentation</a> for more.
            </p>

            <!-- Open Details - Button -->
            <span class="p-3 pt-0.5">
                <Button unstyled @click="showDisabledTemplatesDialog = !showDisabledTemplatesDialog"
                    class="button-base px-1 py-0.75 text-sm font-bold bg-zinc-500/50 hover:bg-zinc-600/60 active:bg-zinc-500/50 active:scale-96">
                    <Iconify icon="clarity:details-line" :size="20" />
                    View Details
                </Button>
            </span>


        </div>

    </div>


    <!-- Disabled Templates - Details Dialog -->
    <Dialog :visible="showDisabledTemplatesDialog" class="border-2! border-invalid-soft! max-w-[85%]!" modal
        block-scroll>
        <template #container>
            <!-- Header -->
            <div class="w-full flex flex-row gap-5 flex-center border-b-2 p-2 border-b-invalid-soft">
                <!-- Title -->
                <span class="flex flex-row items-center gap-1 font-bold grow ">
                    <Iconify icon="clarity:details-line" />
                    <p class="text-lg">
                        Disabled Schedules - Details
                    </p>
                </span>
                <!-- Close -->
                <Button unstyled @click="showDisabledTemplatesDialog = false"
                    class="button-base aspect-square min-w-fit! p-0.75 bg-zinc-500/50 hover:bg-zinc-600/60 active:bg-zinc-500/50 active:scale-95">
                    <XIcon :size="20" />
                </Button>
            </div>
            <!-- Desc -->
            <div class="p-2 opacity-70 text-sm">
                <span>
                    - Our system automatically disables any schedules that fail their post attempt <b>3 times</b>.
                    <br> - A very likely reason that causes failed posts is
                    <u>missing bot permissions</u>.
                    <br>
                    <div class="pl-3.5 flex flex-row gap-px opacity-70 italic">
                        - See <a class="text-link hover:underline" :href="externalUrls.documentation"
                            target="_blank">documentation</a> for more information.
                    </div>
                    - To re-enable a schedule click the edit button next to the schedule in the list.
                </span>
            </div>
            <!-- List -->
            <div class="flex flex-col gap-2.5 pt-1 p-3">
                <span
                    class="bg-text-soft/40 text-text-2 border border-ring-soft w-fit p-1 py-px rounded-md flex items-center flex-row gap-px">
                    <XIcon class="aspect-square min-w-fit text-invalid-1 relative bottom-px" :size="18" />
                    <p class="font-semibold text-sm/snug">
                        Disabled Schedules:
                    </p>
                </span>

                <div v-for="t in disabledTemplates"
                    class="p-2.5 bg-bg-4/30 rounded-md border border-ring-soft hover:border-ring-3! transition-all flex items-center justify-between flex-wrap gap-2">
                    <!-- Title & Last Fail -->
                    <span>
                        <p>
                            {{ t?.title }}
                        </p>
                        <p class="italic text-xs opacity-60">
                            Last Fail: {{ DateTime?.fromISO(String(t?.last_fail_at), { zone: 'utc' })?.toFormat('M/d t')
                                ??
                                'Unknown' }}
                        </p>
                    </span>

                    <!-- Edit Button -->
                    <Button unstyled @click="startReEnableSch(t as any)"
                        class="button-base w-fit! p-0.75 px-2 pl-1.5 pr-2.25 bg-zinc-500/50 hover:bg-zinc-600/60 active:bg-zinc-500/50 active:scale-95">
                        <Iconify icon="mdi:pencil-outline" :size="18" />
                        <p class="text-sm font-bold"> Edit </p>
                    </Button>
                </div>

            </div>
        </template>
    </Dialog>

</template>


<style scoped></style>