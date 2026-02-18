<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import type { CheckboxDesignTokens } from '@primeuix/themes/types/checkbox';
    import type { SelectDesignTokens } from '@primeuix/themes/types/select';
    import { FileWarningIcon, MessageCircleWarningIcon, Trash2Icon, XIcon, ArrowLeft, AlertTriangleIcon, CheckIcon, TriangleAlertIcon } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import defaultDiscordIcon from '/discord-grey.png'


    // Checkbox Styles/PT:
    const checkboxPT: CheckboxDesignTokens = {
        root: {
            background: 'var(--color-zinc-500)',
            checkedBackground: 'var(--color-red-400)',
            checkedBorderColor: 'var(--color-red-400)',
            checkedHoverBackground: 'var(--color-red-400)',
            checkedHoverBorderColor: 'var(--color-red-400)',
            borderColor: 'var(--color-transparent)',
            hoverBorderColor: 'var(--color-red-400)',
        }
    }
    // Select Styles/DT:
    const selectDT: SelectDesignTokens = {
        root: {
            borderColor: 'var(--color-zinc-400)',
            hoverBorderColor: 'var(--color-red-300) !important',
            focusBorderColor: 'var(--color-red-400) !important',
            placeholderColor: 'var(--color-zinc-400) !important',
            color: 'var(--color-zinc-400) !important',
        },
        option: {
            selectedBackground: 'var(--color-red-400)',
            selectedFocusBackground: 'var(--color-red-400)',
        },
    }


    // Incoming Props/Models:
    const isVisible = defineModel<boolean>('isVisible');

    // Auth store and data:
    const auth = useAuthStore()
    const { user, userData } = storeToRefs(auth);

    // Owned Guild(s) Options:
    const userOwnedGuilds = computed(() => {
        const manageableGuilds = auth.userData?.guilds.manageable;
        return manageableGuilds?.filter(g => g.isOwner && g.hasSessionsBot)?.map((g) => {
            return {
                name: g.name,
                value: g.id,
                iconUrl: g.icon
            }
        });
    })

    // Form/Checkbox Values:
    const deleteAccountData = ref<boolean>(false);
    const deleteServerData = ref<boolean>(false)

    const deleteServerSelected = ref<any>()

    // Form State/Errors:
    const formState = ref<'idle' | 'busy' | 'succeeded' | 'failed'>('idle');
    type FormFields = 'deletionGuildId' | 'deleteServerData' | 'deleteAccountData'
    const formErrors = ref<Map<FormFields, string[]>>(new Map())

    // Reset Form:
    function resetForm() {
        deleteAccountData.value = false
        deleteServerData.value = false
        deleteServerSelected.value = null
        formState.value = 'idle'
        formErrors.value.clear()
    }

    // Form Submit:
    function submitForm() {
        try {
            // Get Submitted Values:
            const deleteGuild = deleteServerData.value
            const deleteGuildId = deleteServerSelected.value?.value || null
            const deleteUser = deleteAccountData.value

            // Mark Form Busy:
            formState.value = 'busy'

            console.info({
                deleteGuild, deleteGuildId, deleteUser
            })

            // If missing guild selection:
            if (deleteGuild && !deleteGuildId) {
                formState.value = 'failed';
                return formErrors.value?.set('deletionGuildId', [
                    'Please select a server for deletion!'
                ])
            }


        } catch (err) {
            // Form Submit - Error:
            console.error('Form Submission ERROR', err)
        } finally {
            // Reset Form State:
            setTimeout(() => {
                formState.value = 'idle';
            }, 2_000);
        }
    }

    // On Un Mount:
    watch(isVisible, (visible) => {
        if (!visible) {
            resetForm()
        }
    })


</script>


<template>
    <Dialog v-model:visible="isVisible" modal block-scroll :draggable="false"
        class="m-10 max-w-130 ring-ring-3 ring-2! bg-bg-2! overflow-auto! border-0! text-text-1! flex!">
        <template #container="{ closeCallback }">

            <!-- Header -->
            <section
                class="flex p-2 bg-black/30 flex-row gap-0.75 flex-wrap items-center justify-between w-full border-b-2 border-ring-soft">

                <ColorModeToggle />

                <span class="flex flex-row gap-0.75 items-center justify-center">
                    <Trash2Icon class="relative bottom-px" :size="21" />
                    <p class="font-semibold text-xl"> Deletion Requests </p>
                </span>

                <Button unstyled @click="closeCallback"
                    class="hover:bg-zinc-500/50 active:scale-95 p-1 rounded-md transition-all cursor-pointer">
                    <XIcon class="opacity-75" />
                </Button>

            </section>

            <!-- Content -->
            <section
                class="flex flex-col p-2 gap-0.75 flex-wrap items-start justify-start bg-black/15 w-full border-b-2 border-ring-3">
                <!-- Subheading / Top Info -->
                <p>
                    As an individual you have certain rights over your personal information and if you wish to have it
                    <b>deleted</b>.
                </p>
                <div class="w-10 h-1 rounded-full self-start bg-ring-3/50 flex my-2" />
                <p class="text-sm opacity-75 inline w-full mb-2">
                    Please select below which data you wish to have deleted:
                </p>




                <!-- Data Deletion Selection(s) -->

                <!-- Check - Account Data -->
                <div class="flex flex-row flex-wrap justify-start items-center gap-1 w-full mb-1">
                    <Checkbox input-id="accountDataCheck" v-model="deleteAccountData" binary :dt="checkboxPT" />
                    <label for="accountDataCheck" class="font-bold relative bottom-px">
                        Account Data
                    </label>
                    <p class="text-xs w-full opacity-50">
                        This includes: Username, email, profile picture, user guilds, etc.
                    </p>
                </div>

                <!-- Check - Guild Data -->
                <div class="flex flex-row flex-wrap justify-start items-center gap-1 w-full">
                    <Checkbox @value-change="(v: boolean) => v ? () => { } : deleteServerSelected = null"
                        input-id="serverDataCheck" v-model="deleteServerData" binary :dt="checkboxPT" />
                    <label for="serverDataCheck" class="font-bold relative bottom-px">
                        Server Data
                    </label>
                    <p class="text-xs w-full opacity-50">
                        This includes: Sessions, session schedules, rsvp history, server preferences, etc.
                    </p>
                </div>


                <!-- Select: Pick Guild -->
                <span v-if="deleteServerData"
                    class="w-full flex flex-col flex-wrap justify-center items-center gap-0.5 px-3 mb-1">
                    <div
                        class="bg-black/15 ring-1 ring-ring-3/50 w-full p-2 pt-px rounded-md flex flex-col flex-wrap items-start justify-center">
                        <label for="selectServer" class="font-semibold pt-1">
                            <p class=""> Server to Delete </p>
                        </label>
                        <p class="text-xs w-full opacity-50">
                            Please select a server you <b class="underline">own</b> to request data deletion.
                        </p>

                        <Select v-model="deleteServerSelected" :invalid="formErrors.has('deletionGuildId')"
                            label-id="selectServer" :dt="selectDT" fluid
                            @value-change="formErrors.delete('deletionGuildId')" class=" mt-1 font-medium!"
                            placeholder="Select a Server..." :options="userOwnedGuilds">
                            <!-- Selected -->
                            <template #value="{ value, placeholder }" v-slot="a">
                                <p v-if="!value" class="text-text-1! truncate"> {{ placeholder }} </p>
                                <div v-else
                                    class="text-text-1 w-full flex flex-row flex-nowrap gap-1.5 items-center justify-start">
                                    <img :src="value?.iconUrl || defaultDiscordIcon"
                                        class="size-5 ring-ring-soft ring-2 rounded-full" />
                                    <p class="text-wrap truncate"> {{ value?.name || '%GUILD_NAME%' }} </p>
                                </div>
                            </template>
                            <!-- Options -->
                            <template #option="{ option: { name, title, iconUrl }, selected }">
                                <div class="text-text-1 flex flex-row flex-wrap gap-1.5 items-center justify-center">
                                    <img :src="iconUrl || defaultDiscordIcon"
                                        class="size-5 ring-ring-soft ring-2 rounded-full" />
                                    <p class="truncate"> {{ name }}</p>
                                </div>
                            </template>

                        </Select>

                        <!-- Invalid - Msg(s) -->
                        <div v-if="formErrors.has('deletionGuildId')"
                            class="p-1 pl-0.5 pt-1.25 pb-0 gap-1 w-full flex flex-col items-center justify-center content-center flex-wrap">
                            <p v-for="err in formErrors?.get('deletionGuildId')"
                                class="text-xs w-full font-bold text-start text-invalid-1">
                                {{ err }}
                            </p>
                        </div>
                        <!-- Removal Alert -->
                        <p v-else-if="deleteServerSelected?.value != null"
                            class="text-xs w-full opacity-50 italic pt-1.5">
                            * If Sessions Bot is still a member within this server this will cause the bot to remove
                            itself.
                        </p>
                    </div>
                </span>


            </section>

            <!-- Warning -->
            <section
                class="flex flex-col p-2 gap-1.5 flex-wrap items-center justify-center bg-black/15 w-full border-b-2 border-ring-1">
                <div
                    class="text-sm opacity-75 bg-bg-4/30 gap-0.5 p-1 rounded w-full flex items-center justify-center flex-wrap self-start">
                    <AlertTriangleIcon class="size-5 aspect-square min-w-fit!" />
                    <p class="font-extrabold">
                        Please Note:
                    </p>
                </div>
                <p class="text-invalid-1 text-xs font-medium">
                    This action is <span class="font-bold underline">permanent</span> and <span
                        class="font-bold underline">cannot
                        be undone</span>!
                </p>
            </section>


            <!-- Footer / Actions -->
            <section class="w-full bg-black/30 flex flex-wrap flex-row gap-3 p-2 items-center justify-center">

                <!-- Back Tab Button -->
                <Button @click="closeCallback"
                    class="gap-0.25! p-2 py-1.75 flex flex-row-reverse items-center content-center justify-center bg-zinc-500 hover:bg-zinc-500/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                    unstyled>
                    <p class="text-sm mx-0.75 font-bold"> Cancel </p>
                    <ArrowLeft :stroke-width="3" :size="17" />
                </Button>

                <!-- Next Tab Button -->
                <Button @click="submitForm()" :disabled="formState != 'idle'"
                    class="gap-0.25! p-2 py-1.75 flex flex-row-reverse items-center content-center justify-center bg-red-400/55 hover:bg-red-400/45 active:scale-95 disabled:scale-95 disabled:opacity-70 disabled:bg-zinc-600 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                    unstyled severity="danger" :class="{
                        'bg-emerald-500/80!': formState == 'succeeded',
                        'bg-amber-600/80!': formState == 'failed'
                    }">
                    <p class="text-sm font-bold"> Delete Data </p>
                    <Transition name="fade" mode="out-in">
                        <LoadingIcon class="size-5.5! mr-0.5" v-if="formState == 'busy'" />
                        <CheckIcon v-else-if="formState == 'succeeded'" :size="17" :stroke-width="3"
                            class="relative top-px" />
                        <TriangleAlertIcon class="mr-0.5" :size="17" v-else-if="formState == 'failed'" />
                        <Trash2Icon v-else :stroke-width="3" :size="17" class="relative" />
                    </Transition>
                </Button>

            </section>

        </template>
    </Dialog>

</template>


<style scoped>

    .p-checkbox:hover {
        --p-checkbox-background: var(--color-zinc-600) !important;
    }

</style>