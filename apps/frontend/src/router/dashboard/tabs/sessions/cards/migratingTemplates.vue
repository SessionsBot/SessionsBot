<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import useNotifier from '@/stores/notifier';
    import { API } from '@/utils/api';
    import { supabase } from '@/utils/supabase';
    import { API_SessionTemplateBodySchema, MigratingTemplates_DeletionDate, type Database } from '@sessionsbot/shared';
    import { XIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import { useConfirm } from 'primevue';
    import { success, treeifyError } from 'zod';


    // Services:
    const dashboard = useDashboardStore()
    const confirm = useConfirm()
    const notifier = useNotifier()

    const migratingTemplates = computed(() => dashboard.guildData.migratingTemplates?.state)

    const migrationDialogVisible = ref(false)

    // Util Fn: Open Ses Form - Re-Enable Schedule:
    async function startReEnableSchEdit(sch: typeof dashboard.sessionForm.editPayload) {
        dashboard.sessionForm.editPayload = sch
        await nextTick()
        dashboard.sessionForm.actionMode = 're-enable-migrating';
        dashboard.sessionForm.visible = true;
    }


    // Util Fn: Start Deletion Prompt for Miggrating Schedule (id):
    function startDeletionPrompt(id: string) {
        confirm.require({
            header: `Are you sure?`,
            message: `<span class="w-full block! text-center">You're about to <b>permanently delete</b> this "migrating schedule"! <br> <span class="text-sm font-bold underline text-invalid-1">This action cannot be undone!</span></span>`,
            async accept() {
                const r = await API.delete(`/guilds/${dashboard.guildId}/migrating/schedules`, {
                    data: [id] // body?
                })
                if (r.status > 299 || r?.data?.data?.had_failures) {
                    return notifier.send({
                        duration: 15_000,
                        header: 'Failed to Delete!',
                        content: 'It seems like we ran into an issue when deleting that schedule! If this issue persists please contact bot support..',
                        level: 'error'
                    })
                } else {
                    // refresh
                    dashboard.refetchData('migratingTemplates')
                    return notifier.send({
                        duration: 3_000,
                        icon: 'iconamoon:trash',
                        header: 'Schedule Deleted',
                        level: 'success'
                    })
                }
                console.info('API Delete Result', r.status, r.data)
                console.info('accepted', id)
            },
            reject() {
                console.info('rejected', id)
            },
        })
    }

    // Watch Dialog - Opened:
    // watch(migrationDialogVisible, (v) => {
    //     if (!v) {
    //         // Reset Selected Ids:

    //     }
    // })

</script>


<template>
    <!-- Alert UI Card -->
    <div
        class="flex w-full max-w-150 relative flex-center gap-2 flex-col p-3.5 rounded-md border-2 border-ring-soft bg-bg-soft">

        <!-- Bell -->
        <div class="bg-amber-700/75 aspect-square rounded-full p-1.5 sm:absolute sm:left-3 sm:top-3">
            <Iconify icon="mingcute:notification-line" size="18" />
        </div>

        <!-- Header -->
        <div class="flex flex-wrap gap-1 justify-start items-center">
            <Iconify icon="mdi:bird" class="opacity-80" size="22" />
            <p class="font-bold text-lg">
                Migrating Templates
            </p>
        </div>
        <div class="h-1 w-15 bg-bg-4 rounded-full" />
        <p class="text-sm">
            Re-enable your <b>previously configured Schedules</b> from Sessions Bot V1!
        </p>
        <p class="text-sm opacity-65">
            Instantly take advantage of Sessions Bot's new features with your old schedules!
        </p>
        <p class="opacity-65 text-xs">
            <b class="underline">Auto Deletes: <i> {{ MigratingTemplates_DeletionDate.toFormat('M/d/y') }} </i></b>
        </p>

        <!-- View Dialog Button -->
        <Button @click="migrationDialogVisible = true" unstyled
            class="button-base button-primary mt-1 pl-1 pr-1 py-0.5">
            <Iconify icon="mdi:check" size="18" />
            <p class="text-sm font-bold">
                Confirm V1 Schedules
            </p>
        </Button>

        <!-- Details - ReEnable Dialog -->
        <Dialog :visible="migrationDialogVisible" class="border-ring-soft! border-2! w-full! max-w-155! mx-7!" modal
            block-scroll>
            <template #container>
                <!--Dialog  Header -->
                <div
                    class="flex w-full items-center justify-between flex-wrap flex-col p-2.5 border-b-2 border-ring-soft">
                    <!-- Top Row -->
                    <span class="w-full flex items-start">
                        <span class="flex items-center justify-start flex-row grow gap-1 pt-0.5 pr-4">
                            <Iconify icon="mdi:bird" size="22" />
                            <p class="font-bold text-lg">
                                Migrating Schedules
                            </p>
                        </span>
                        <Button @click="migrationDialogVisible = false" unstyled
                            class="button-base button-secondary aspect-square">
                            <XIcon />
                        </Button>
                    </span>
                    <!-- Bottom Row -->
                    <span class="text-xs opacity-65 p-1 mt-0.5">
                        - Confirm each one of your previously configured schedules to use with the new release of
                        Sessions Bot!
                    </span>
                </div>
                <!-- Content -->
                <div class="flex w-full p-2 gap-2 flex-center flex-wrap flex-col">


                    <!-- List Migrating Templates -->
                    <div v-for="sch in migratingTemplates"
                        class="flex items-center flex-row flex-wrap gap-2 px-2.5 rounded-lg border-2 border-ring-soft hover:border-ring-2 w-full bg-text-1/5">

                        <span class="flex flex-center gap-2 p-2 grow">
                            <p>
                                {{ sch.title }}
                            </p>
                            <p>
                                {{
                                    DateTime?.fromISO(sch.starts_at_utc, { zone: 'utc' })
                                        ?.setZone(sch.time_zone)
                                        ?.toFormat('t')
                                }}
                                -
                                {{ DateTime?.fromISO(sch.starts_at_utc, { zone: sch?.time_zone })?.offsetNameShort
                                }}
                            </p>
                        </span>

                        <Button @click="startDeletionPrompt(sch?.id)" title="Delete Schedule" unstyled
                            class="hover:text-invalid-1 button-base button-secondary aspect-square p-1">
                            <Iconify icon="iconamoon:trash" size="20" class="opacity-80 transition-all" />
                        </Button>

                        <Button @click="startReEnableSchEdit(sch as any)" title="Edit Schedule" unstyled
                            class="hover:text-amber-600 button-base button-secondary aspect-square p-1">
                            <Iconify icon="line-md:circle-to-confirm-circle-transition" size="20"
                                class="opacity-80 transition-colors" />
                        </Button>

                    </div>

                </div>
                <!-- Footer -->
                <div class="flex w-full p-2.5 border-t-2 border-ring-soft gap-2 flex-center flex-wrap flex-row">

                    <!-- Close Button -->
                    <Button @click="migrationDialogVisible = false" unstyled key="close-dialog"
                        class="button-base button-secondary flex flex-center flex-row pr-1.5">
                        <XIcon class="opacity-80" />
                        <p class="font-semibold">
                            Close
                        </p>
                    </Button>

                </div>
            </template>
        </Dialog>

    </div>
</template>


<style scoped></style>