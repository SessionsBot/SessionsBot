<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import { storeToRefs } from 'pinia';
    import { supabase } from '@/utils/supabase';
    import { DateTime } from 'luxon';
    import { CheckCircle2Icon, RefreshCcwIcon } from 'lucide-vue-next';
    import type { ToastID } from 'vue-toastification/dist/types/types';
    import { TYPE, useToast } from 'vue-toastification';

    // Auth Store:
    const auth = useAuthStore();
    const { userData, signedIn, user, refreshStatus } = storeToRefs(auth);

    // Toaster:
    const toaster = useToast()

    // Resync Discord Acc Data Fn:
    async function attemptDataResync() {
        // Send loading toast/notification:
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
    <div class="text-xs mt-2 flex flex-row flex-wrap items-center content-center justify-center">
        <!-- Title -->
        <span
            class="flex bg-indigo-500/65 border-2 border-r borderColor rounded-l-md flex-row gap-1 items-center p-1 h-full">
            <i class="pi pi-discord drop-shadow-sm drop-shadow-black/60  scale-90 ml-1 mr-0.5" />
            <p class="mr-0.5 drop-shadow-sm drop-shadow-black/60 font-bold "> Last Synced</p>
        </span>
        <!-- SIDE: Last Sync & Refresh Btn -->
        <div class="flex flex-row gap-0 h-7 flex-nowrap rounded-r-md overflow-clip transition-all" :class="{
            'bg-zinc-600/60! hover:bg-zinc-600/60! active:bg-zinc-600/60! opacity-55': (auth.$state.refreshStatus == 'busy'),
            'bg-red-700/70! hover:bg-red-700/70! active:bg-red-700/70!': (auth.$state.refreshStatus == 'failed'),
            'bg-green-700/70! hover:bg-green-700/70! active:bg-green-700/70!': (auth.$state.refreshStatus == 'succeeded'),
        }">
            <!-- Last Synced Time Elapsed -->
            <span
                class="bg-zinc-500/50 italic font-bold border-2 border-x-1 borderColor drop-shadow-sm drop-shadow-black/60 p-1 h-full flex items-center">

                {{ DateTime.fromISO(user?.app_metadata?.last_synced as string)?.toRelative() }}

            </span>
            <!-- Refresh Button -->
            <Button unstyled title="Refresh Account Data"
                class="px-1 border-2 border-l borderColor rounded-r-md flex items-center justify-center cursor-pointer bg-zinc-500/50 hover:bg-zinc-600/60 active:bg-zinc-500/70 disabled:cursor-not-allowed h-full transition-all"
                :disabled="auth.$state.refreshStatus != 'idle'" @click="async () => attemptDataResync()">
                <RefreshCcwIcon class="size-4" :class="{ 'animate-spin': (auth.$state.refreshStatus == 'busy'), }" />
            </Button>
        </div>
    </div>
</template>

<style scoped>

    @reference "../../styles/main.css";

    .borderColor {
        @apply border-ring
    }

</style>