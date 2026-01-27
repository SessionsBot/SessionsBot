<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import DefaultAvatar from '/discord.png'
    import { DateTime } from 'luxon';
    import { TYPE, useToast } from 'vue-toastification';
    import type { ToastID } from 'vue-toastification/dist/types/types';
    import { supabase } from '@/utils/supabase';
    import { CheckCircle2, CheckCircle2Icon, XCircleIcon } from 'lucide-vue-next';

    // Incoming Modal - Delete Data Dialog Visible:
    const deleteDataDialogVisible = defineModel<boolean>('deleteDataDialogVisible')

    // Services:
    const auth = useAuthStore();
    const clipboard = useClipboard();
    const toaster = useToast()

    // Auth Data:
    const user = computed(() => auth.user)
    const username = computed(() => auth.userData?.username || '%Username%')
    const userIconUrl = computed(() => auth.userData?.avatar)
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
        // Send Toast - loading data:
        let thisToast: ToastID | undefined = undefined;
        thisToast = toaster('Resyncing Discord User Data...', { icon: 'pi pi-sync animate-spin', type: TYPE.WARNING, timeout: false, closeOnClick: false, draggable: false, showCloseButtonOnHover: true });

        // Make Refresh Call:
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return toaster.update(thisToast, { content: `Failed! Couldn't find your current session.. If this error persists please contact support!` })
        const result = await auth.resyncDiscordData(session?.access_token, 'MANUAL');

        // Handle Refresh Result:
        if (!result.success) {
            // Failed:
            if (result.data.reason == 'COOLDOWN') {
                // Reason - Cooldown:
                return toaster.update(thisToast, { content: result.data.message, options: { type: TYPE.ERROR, timeout: 7_000, closeOnClick: true, icon: true } })
            } else {
                // Reason - Other/Unknown:
                return toaster.update(thisToast, { content: result.data.message, options: { type: TYPE.ERROR, timeout: 10_000, closeOnClick: true, icon: true } })
            }
        } else {
            // Succeeded:
            return toaster.update(thisToast, { content: 'Success! Your account data has been refreshed with Discord.', options: { type: TYPE.SUCCESS, timeout: 5_000, closeOnClick: true, icon: CheckCircle2Icon } })
        }
    }

</script>


<template>
    <div class="bg-surface ring-ring ring-2 rounded-md overflow-clip w-[80%] max-w-120">

        <!-- Panel Header -->
        <header
            class="bg-black/30 gap-1.5 p-2 w-full flex flex-row flex-wrap justify-between items-center content-center border-b-2 border-ring">
            <!-- Title & Icon -->
            <div class="flex flex-row gap-1.5 items-center">
                <Iconify icon="solar:user-id-bold" />
                <p class="font-extrabold">My Account</p>
            </div>
            <!-- Delete Button -->
            <Button unstyled title="Delete my Data" @click="deleteDataDialogVisible = !deleteDataDialogVisible"
                class="p-1 rounded-md active:scale-95 hover:bg-white/10 hover:text-red-400/60 text-white/50 transition-all aspect-square cursor-pointer">
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
                    {{ user?.user_metadata?.display_name }}
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
                <img class="w-full aspect-square rounded-full border-2 border-zinc-500"
                    :src="userIconUrl || DefaultAvatar" />
            </div>

        </div>


        <!-- Action Buttons Wrap -->
        <div class="gap-4 p-2 py-4 mb-2 flex items-center justify-center flex-col sm:flex-row flex-wrap w-full">

            <!-- <LastSyncedBadge /> -->

            <!-- Refresh Data -->
            <Button unstyled @click="resyncDiscordData()" title="Resync Discord Data"
                class="bg-ring hover:bg-[#46464F] active:bg-[#3A3A42] gap-0.75! action-button"
                :disabled="resyncStatus != 'idle'" :class="{
                    'opacity-50! scale-96! cursor-progress!': resyncStatus == 'busy',
                    'bg-emerald-500/80! scale-96! cursor-wait!': resyncStatus == 'succeeded',
                    'bg-[#B34248]/90! scale-96! cursor-wait!': resyncStatus == 'failed'
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
                class="bg-[#B34248]/90 hover:bg-[#99393D] active:bg-[#802F33] action-button">
                <Iconify icon="line-md:logout" size="20" />
                <p class="font-semibold text-sm sm:text-[16px]"> Sign Out </p>
            </Button>

        </div>


        <!-- Footer -->
        <footer v-if="userAppRoles?.includes('admin')"
            class="bg-black/30 text-white/45 text-[11px] text-center gap-2 sm:gap-4 p-1.5 px-2 w-full flex flex-col sm:flex-row flex-wrap justify-between items-center content-center border-t-2 border-ring">
            <p class="w-full sm:w-fit">
                <b>UID:</b> {{ user?.id }}
            </p>
            <a @click="copyAccessToken" class="hover:underline cursor-pointer sm:w-fit w-full font-medium">
                Copy Access Token
            </a>
            <a @click="console.log({ session: auth.session, user: auth.user })"
                class="hover:underline cursor-pointer sm:w-fit w-full font-medium">
                Log User/Session Data
            </a>
        </footer>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .detail-field-title {
        @apply text-xs px-1 py-px font-extrabold uppercase bg-black/10 text-white/70 rounded-md ring ring-ring;
    }

    .detail-field-value {
        @apply px-2 opacity-70 italic;
    }

    .action-button {
        @apply gap-0.5 p-1 px-1.75 active:scale-96 rounded-md transition-all cursor-pointer flex flex-row items-center justify-center flex-wrap;
    }

</style>