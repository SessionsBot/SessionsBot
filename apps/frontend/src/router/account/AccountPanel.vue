<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import { DateTime } from 'luxon';
    import { supabase } from '@/utils/supabase';
    import { CheckCircle2, CheckCircle2Icon, XCircleIcon } from 'lucide-vue-next';
    import useAnalyticsStore from '@/stores/analytics';
    import DeleteData from './deleteData.vue';
    import useNotifier from '@/stores/notifier';

    // Incoming Modal - Delete Data Dialog Visible:
    const deleteDataDialogVisible = defineModel<boolean>('deleteDataDialogVisible')

    // Services:
    const auth = useAuthStore();
    const clipboard = useClipboard();
    const notifier = useNotifier();
    const analytics = useAnalyticsStore();

    // Auth Data:
    const user = computed(() => auth.user)
    const username = computed(() => auth.identity?.username || '%Username%')
    const userIconUrl = computed(() => auth.identity?.avatar)
    const userAppRoles = computed(() => auth.user?.app_metadata.roles)

    // Fn - Copy Access Token:
    function copyAccessToken() {
        if (clipboard.isSupported) {
            clipboard.copy(String(auth.session?.access_token))
            alert('Copied access token to Clipboard!')
        } else {
            alert('Clipboard is NOT supported!' + `\nTOKEN: \n${auth.session?.access_token}`)
        }
    }

    // Fn - Refresh Discord Auth/Sync Data:
    const resyncStatus = computed(() => auth.refreshStatus)
    async function resyncDiscordData() {
        // Make Refresh Call:
        const result = await auth.resyncDiscordData('MANUAL');

        // Handle Refresh Result:
        if (!result.success) {
            // Failed:
            if (result.data.reason == 'COOLDOWN') {
                // Reason - Cooldown - Send Alert:
                return notifier.send({
                    level: 'warn',
                    icon: 'mdi:timer-outline',
                    header: 'Refreshed too recently!',
                    content: result.data.message,
                })
            } else {
                // Reason - Other/Unknown- Send Alert:
                return notifier.send({
                    level: 'warn',
                    header: 'Failed to refresh account!',
                    content: `Unfortunately we ran into an error refreshing you account. Try signing out and back in!`,
                })
            }
        } else {
            // Succeeded:
            return notifier.send({
                level: 'success',
                header: 'Account Refreshed',
                duration: 3,
            })
        }
    }


    // Fn - Start Data Delete Request
    const showDataDelete = ref<boolean>(false)

</script>


<template>
    <div class="bg-bg-soft ring-ring-soft ring-2 rounded-md overflow-clip w-[80%] max-w-120 my-7">

        <!-- Panel Header -->
        <header
            class="bg-text-1/10 gap-1.5 p-2 w-full flex flex-row flex-wrap justify-between items-center content-center border-b-2 border-ring">
            <!-- Title & Icon -->
            <div class="flex flex-row gap-1.5 items-center">
                <Iconify icon="solar:user-id-bold" />
                <p class="font-extrabold">My Account</p>
            </div>
            <!-- Delete Button -->
            <Button hidden unstyled title="Delete my Data" @click="deleteDataDialogVisible = !deleteDataDialogVisible"
                class="p-1 rounded-md active:scale-95 hover:bg-(--c-text-2)/30 hover:text-red-400/75 text-text-1/50 transition-all aspect-square cursor-pointer dark:hover:bg-(--c-text-2)/15">
                <Iconify icon="solar:trash-bin-trash-bold" size="20" />
            </Button>
        </header>


        <!-- User Account Details -->
        <div class=" p-2 pb-0 flex items-center justify-center flex-wrap w-full">

            <!-- Leading - Welcome -->
            <div class="flex flex-col w-full p-1 pb-3">
                <p class="font-bold text-2xl font-play-pen w-full text-start">
                    Hello, {{ username }}!
                </p>
                <p class="text-sm font-medium italic opacity-60 w-full text-start">
                    Thank you for using Sessions Bot!
                </p>
            </div>


            <!-- Display Name -->
            <div class="w-full flex flex-col gap-1 pt-1.5 items-center justify-center">
                <p class="detail-field-title">
                    Display Name
                </p>
                <p class="detail-field-value">
                    {{ auth.identity?.display_name ?? '%display_name%' }}
                </p>
            </div>
            <!-- User Email -->
            <div class="w-full flex flex-col gap-1 pt-1.5 items-center justify-center">
                <p class="detail-field-title">
                    Email
                </p>
                <p class="detail-field-value">
                    {{ user?.email }}
                </p>
            </div>
            <!-- Last Sync -->
            <div class="w-full flex flex-col gap-1 pt-1.5 items-center justify-center">
                <p class="detail-field-title">
                    Last Sync
                </p>
                <p class="detail-field-value">
                    {{ DateTime.fromISO(user?.app_metadata.last_synced as string).toLocal().toFormat('M/d/yy t') ||
                        'UNKNOWN'
                    }}
                </p>
            </div>

            <!-- User - Icon/Avatar -->
            <div class="aspect-square w-25 sm:w-30 p-1 py-2.5">
                <img class="w-full aspect-square rounded-full border-2 border-ring-3"
                    :src="userIconUrl || '/discord.png'" />
            </div>

        </div>


        <!-- Action Buttons Wrap -->
        <div class="gap-4 p-2 py-4 mb-2 flex items-center justify-center flex-col sm:flex-row flex-wrap w-full">

            <!-- Refresh Data -->
            <Button unstyled @click="resyncDiscordData()" title="Resync Discord Data"
                class="bg-zinc-500/80 hover:bg-zinc-500/72 active:bg-zinc-500/64 gap-0.75! action-button"
                :disabled="resyncStatus != 'idle'" :class="{
                    'opacity-50! scale-96! cursor-progress!': resyncStatus == 'busy',
                    'bg-emerald-500/80! scale-96! cursor-wait!': resyncStatus == 'succeeded',
                    'bg-[#B34248]/80! scale-96! cursor-wait!': resyncStatus == 'failed'
                }">
                <Transition name="fade" mode="out-in" :duration="0.2">
                    <LoadingIcon v-if="resyncStatus == 'busy'" class="p-0.5" />
                    <CheckCircle2 v-else-if="resyncStatus == 'succeeded'" class="size-5 aspect-square min-w-fit!" />
                    <XCircleIcon v-else-if="resyncStatus == 'failed'" class="size-5 aspect-square min-w-fit!" />
                    <DiscordIcon v-else class="size-5" />
                </Transition>

                <p class="font-semibold text-sm sm:text-[16px]"> Refresh Data </p>
            </Button>

            <!-- Sign Out -->
            <Button @click="auth.signOut()" unstyled
                class="bg-[#B34248]/80 hover:bg-[#99393D]/80 active:bg-[#802F33]/80 action-button">
                <Iconify icon="line-md:logout" size="20" />
                <p class="font-semibold text-sm sm:text-[16px]"> Sign Out </p>
            </Button>


            <!-- UID -->
            <p class="w-full text-xs text-center opacity-50 italic px-2 pb-1 mt-2.5">
                <b>UID:</b> {{ user?.id }}
            </p>

        </div>


        <!-- Footer -->
        <footer class="bg-text-1/10 text-text-1/50 text-[11px] text-center w-full border-t-2 border-ring">

            <!-- Regular Resources -->
            <span class="flex w-full justify-evenly items-center gap-4 p-2">
                <p @click="showDataDelete = true" class="hover:underline cursor-pointer sm:w-fit w-full font-medium">
                    Data Deletion Requests
                </p>


                <a @click="analytics.cookieConsent.openPreferences(false)"
                    class="hover:underline cursor-pointer sm:w-fit w-full font-medium">
                    Manage Cookie Preferences
                </a>
            </span>


            <!-- Extra Admin/Dev Resources -->
            <span v-if="userAppRoles?.includes('admin')"
                class="flex justify-evenly flex-wrap gap-4 p-2 border-t-2 border-ring-soft">

                <a @click="copyAccessToken" class="hover:underline cursor-pointer font-medium ">
                    Copy Access Token
                </a>
                <a @click="console.log({ session: auth.session, user: auth.user })"
                    class="hover:underline cursor-pointer font-medium">
                    Log User/Session Data
                </a>

            </span>
        </footer>


        <!-- Data Delete - Modal -->
        <DeleteData v-model:is-visible="showDataDelete" />

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .detail-field-title {
        @apply text-xs px-1 py-px font-extrabold uppercase bg-text-1/10 text-text-1/70 rounded-md ring ring-ring;
    }

    .detail-field-value {
        @apply px-2 opacity-70 italic;
    }

    .action-button {
        @apply gap-0.5 p-1 px-1.75 active:scale-96 rounded-md transition-all cursor-pointer flex flex-row items-center justify-center flex-wrap;
    }

</style>