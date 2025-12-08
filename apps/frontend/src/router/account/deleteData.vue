<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import type { CheckboxDesignTokens } from '@primeuix/themes/types/checkbox';
    import type { SelectDesignTokens } from '@primeuix/themes/types/select';
    import { FileWarningIcon, MessageCircleWarningIcon, Trash2Icon, XIcon, ArrowLeft } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';


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
        const manageableGuilds: { [guildId: string]: { [key: string]: any } } = auth.userData?.['guilds']?.['manageable'] || {};
        for (const [guildId, data] of Object.entries(manageableGuilds)) {

        }

        return Object.entries(manageableGuilds).filter(([guildId, data]) => {
            if (data?.isOwner && data?.hasSessionsBot) return true;
            else return false;
        }).map(([guildId, data]) => {
            return { name: data?.name, value: guildId, iconUrl: data?.icon }
        })
    })

    // Form/Checkbox Values:
    const deleteAccountData = ref<boolean>(false);
    const deleteServerData = ref<boolean>(false)



</script>


<template>
    <Dialog v-model:visible="isVisible" modal
        class="m-10 max-w-130 ring-ring ring-3! overflow-auto! text-zinc-300! flex!">
        <template #container="{ closeCallback }">

            <!-- Header -->
            <section
                class="flex p-2 flex-row gap-0.75 flex-wrap items-center justify-between bg-black/0 w-full border-b-2 border-ring">

                <span class="flex flex-row gap-0.75 items-center justify-center">
                    <Trash2Icon class="relative bottom-px" :size="21" />
                    <p class="font-medium text-xl"> Deletion Requests </p>
                </span>

                <Button unstyled @click="closeCallback"
                    class="hover:bg-zinc-500/50 active:scale-95 p-1 rounded-full transition-all cursor-pointer">
                    <XIcon class="opacity-75" />
                </Button>

            </section>

            <!-- Content -->
            <section
                class="flex flex-col p-2 gap-0.75 flex-wrap items-start justify-start bg-black/15 w-full border-b-2 border-ring">
                <!-- Subheading / Top Info -->
                <p>
                    As an individual you have certain rights over you personal information and if you wish to have it
                    deleted.
                </p>
                <div class="w-10 h-1 rounded-full self-start bg-ring/50 flex my-2" />
                <p class="text-sm opacity-75 inline w-full mb-2">
                    Please select below which data you wish to have deleted:
                </p>



                <!-- Data Deletion Selection(s) -->

                <!-- Check - Account Data -->
                <div class="flex flex-row flex-wrap justify-start items-center gap-1 w-full mb-1">
                    <Checkbox input-id="accountDataCheck" v-model="deleteAccountData" binary :dt="checkboxPT" />
                    <label for="accountDataCheck" class="font-medium relative bottom-px">
                        Account Data
                    </label>
                    <p class="text-xs w-full opacity-50">
                        This includes: Username, email, profile picture, user guilds, etc.
                    </p>
                </div>

                <!-- Check - Guild Data -->
                <div class="flex flex-row flex-wrap justify-start items-center gap-1 w-full">
                    <Checkbox input-id="serverDataCheck" v-model="deleteServerData" binary :dt="checkboxPT" />
                    <label for="serverDataCheck" class="font-medium relative bottom-px">
                        Server Data
                    </label>
                    <p class="text-xs w-full opacity-50">
                        This includes: Sessions, session schedules, rsvp history, server preferences, etc.
                    </p>
                </div>


                <!-- Select: Pick Guild -->
                <span v-if="deleteServerData"
                    class="w-full flex flex-col flex-wrap justify-center items-start gap-0.5 mb-1">
                    <div
                        class="bg-black/15 ring-1 ring-ring/50 mx-2 p-2 pt-0.25 rounded-md flex flex-col flex-wrap items-start justify-center">
                        <label for="selectServer" class="font-medium">
                            <p class=""> Server to Delete </p>
                        </label>
                        <p class="text-xs w-full opacity-50">
                            Please select a server you own to request data deletion.
                        </p>
                        <Select label-id="selectServer" :dt="selectDT"
                            class="max-w-75 mt-1 font-medium! placeholder:text-red-500!"
                            placeholder="Select a Server..." :options="userOwnedGuilds">
                            <!-- Selected -->
                            <template #value="{ value, placeholder }" v-slot="a">
                                <p v-if="!value" class="text-zinc-400!"> {{ placeholder }} </p>
                                <div v-else
                                    class="text-white w-full flex flex-row flex-nowrap gap-1.5 items-center justify-start">
                                    <img :src="value?.iconUrl" class="size-5 ring-ring ring-2 rounded-full" />
                                    <p class="text-wrap"> {{ value?.name }} </p>
                                </div>
                            </template>
                            <!-- Options -->
                            <template #option="{ option: { name, title, iconUrl }, selected }">
                                <div class="text-white flex flex-row flex-wrap gap-1.5 items-center justify-center">
                                    <img :src="iconUrl" class="size-5 ring-ring ring-2 rounded-full" />
                                    <p> {{ name }}</p>
                                </div>
                            </template>

                        </Select>
                    </div>
                </span>




            </section>

            <!-- Warning -->
            <section
                class="flex flex-col p-2 gap-0.75 flex-wrap items-center justify-center bg-black/15 w-full border-b-2 border-ring">
                <div class="text-sm opacity-75 bg-zinc-500/30 p-0.75 px-2.25 rounded-full inline w-fit font-medium">
                    <FileWarningIcon class="inline size-5 relative bottom-px" /> Please Note:
                </div>
                <p class="text-red-400 text-xs font-medium">
                    This action is permanent and cannot be undone!
                </p>
            </section>

            <!-- Footer / Actions -->
            <div class="w-full flex flex-wrap flex-row gap-3 p-2 items-center justify-center">

                <!-- Back Tab Button -->
                <Button @click="closeCallback"
                    class="gap-0.25! p-2 py-1.75 flex flex-row-reverse items-center content-center justify-center bg-zinc-500 hover:bg-zinc-500/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                    unstyled>
                    <p class="text-sm mx-0.75 font-normal"> Cancel </p>
                    <ArrowLeft :stroke-width="'2'" :size="17" />
                </Button>

                <!-- Next Tab Button -->
                <Button
                    class="gap-0.25! p-2 py-1.75 flex flex-row-reverse items-center content-center justify-center bg-red-400/55 hover:bg-red-500/50 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                    unstyled severity="danger">
                    <p class="text-sm font-medium relative! top-px!"> Delete Data </p>
                    <Trash2Icon :stroke-width="3" :size="17" class="relative" />
                </Button>

            </div>

        </template>
    </Dialog>

</template>


<style scoped></style>