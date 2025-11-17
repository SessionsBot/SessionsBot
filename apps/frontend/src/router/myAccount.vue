<script setup lang="ts">
    import { useAuthStore } from "@/stores/auth";
    import { supabase } from "@/utils/supabase";
    import axios from "axios";
    import { InfoIcon, LogOutIcon, MoveRightIcon, RefreshCcwIcon, UserCircle2Icon } from "lucide-vue-next";
    import { DateTime } from "luxon";
    import { storeToRefs } from "pinia";

    const auth = useAuthStore();
    const { userData, signedIn, user, refreshStatus } = storeToRefs(auth);

    const avatarLoaded = ref(false)

    // Create mailto link
    const draftDeleteAccountEmail = () => `mailto:support@sessionsbot.fyi?${new URLSearchParams({
        subject: `ACCOUNT DELETION REQUEST - ${userData?.value?.username}`,
        body: `Hello, I would like to exercise my legal rights and request for my personal user account on https://sessionsbot.fyi and related personal information to be deleted as soon as possible. \n\n──────── DO NOT EDIT BELOW THIS LINE ──────── \nDELETE ACCOUNT REQUEST:\nUID: ${user?.value?.id}\nDID: ${userData?.value?.id}\nUSER_EMAIL: ${user?.value?.email} \n──────── DO NOT EDIT ABOVE THIS LINE ──────── `,
    }).toString()
        }`;

</script>

<template>
    <main class="flex flex-wrap w-full h-full flex-1 justify-center items-center content-center">
        <Transition name="zoom" mode="out-in">

            <!-- Main Account Panel -->
            <div v-if="auth.signedIn"
                class="flex flex-col w-[80%] max-w-170 bg-zinc-400/10 backdrop-blur-md justify-center items-center content-center ring-2 ring-zinc-400 m-5 rounded-md overflow-clip">
                <!-- Panel Header -->
                <header
                    class="bg-white/2.5 gap-1.5 p-3 px-2 w-full flex flex-row flex-wrap justify-start items-center content-center backdrop-blur-md border-b-2 border-zinc-400">
                    <UserCircle2Icon />
                    <p class="font-medium">My Account</p>
                </header>
                <!-- Main Section -->
                <section
                    class="flex flex-col sm:gap-0 sm:flex-row justify-evenly items-center bg-black/40 p-2 w-full backdrop-blur-2xl">

                    <!-- User Data | Sec 1 -->
                    <div class="flex flex-col gap-1 justify-center items-start py-4 pt-3">
                        <p class="font-bold">Username:</p>
                        <p class="userDataField">{{ userData?.username }}</p>
                        <p class="font-bold">Display Name:</p>
                        <p class="userDataField">{{ userData?.display_name }}</p>
                        <p class="font-bold">Email:</p>
                        <p class="userDataField">{{ userData?.email }}</p>
                        <p class="font-bold">User Id:</p>
                        <p class="userDataField">{{ userData?.id }}</p>
                    </div>

                    <!-- User Img/Actions | Sec 2 -->
                    <div class="flex flex-col gap-3 my-4 flex-wrap justify-center items-center content-center">

                        <!-- User Image -->
                        <span>
                            <Skeleton v-if="!avatarLoaded"
                                class="sm:size-40 !size-35 rounded-md ring-3 ring-zinc-400" />
                            <img @load="(e) => avatarLoaded = true" :src="userData?.avatar"
                                class="sm:size-40 size-35 rounded-md ring-3 ring-zinc-400"
                                :class="{ 'hidden': !avatarLoaded }" />

                        </span>

                        <!-- Last Sync Badge -->
                        <div
                            class="text-xs mt-2 flex h-7 flex-row flex-wrap items-center content-center justify-center">
                            <!-- Title -->
                            <span
                                class="flex bg-indigo-800/30 border-black border-2 border-r rounded-l-md flex-row gap-1 items-center p-1 h-full">
                                <i class="pi pi-discord text-indigo-300 scale-90 ml-1 mr-0.5" />
                                <p class="mr-0.5 text-indigo-200 font-medium "> Last Synced</p>
                            </span>
                            <!-- Last Synced Time Elapsed -->
                            <span
                                class="bg-zinc-500/20 italic font-semibold opacity-70 border-black border-2 border-x-0 p-1 h-full flex items-center">

                                {{ DateTime.fromISO(user?.app_metadata?.last_synced).toRelative() }}

                            </span>
                            <!-- Refresh Button -->
                            <Button unstyled
                                class="px-1 border-black border-2 border-l rounded-r-md flex items-center justify-center opacity-50 cursor-pointer bg-zinc-500/50 hover:bg-zinc-600/60 active:bg-zinc-500/70 disabled:cursor-not-allowed h-full"
                                :disabled="auth.$state.refreshStatus != 'idle'" :class="{
                                    'bg-zinc-600/60! opacity-55': (auth.$state.refreshStatus == 'busy'),
                                    'bg-yellow-700/50!': (auth.$state.refreshStatus == 'failed'),
                                    'bg-green-700/50!': (auth.$state.refreshStatus == 'succeeded')
                                }" @click="async () => {
                                    const { data: { session } } = await supabase.auth.getSession();
                                    if (!session) return;
                                    await auth.resyncDiscordData('MANUAL', session?.access_token);
                                }">
                                <RefreshCcwIcon class="size-4"
                                    :class="{ 'animate-spin': (auth.$state.refreshStatus == 'busy'), }" />
                            </Button>
                        </div>

                        <!-- Acc Actions -->
                        <span class="flex flex-wrap flex-row gap-3 pt-1.75 justify-center items-center">
                            <Button @click="async () => {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (!session) return;
                                await auth.resyncDiscordData('MANUAL', session?.access_token)
                            }" unstyled :disabled="auth.$state.refreshStatus != 'idle'"
                                class="flex flex-row justify-between items-center gap-1 flex-nowrap bg-zinc-500/50 hover:bg-zinc-600/60 active:bg-zinc-500/70 disabled:cursor-not-allowed disabled:scale-90 transition-all transition-[350 ms] active:scale-95 p-1.75 rounded-md cursor-pointer"
                                :class="{
                                    'bg-zinc-600/60! opacity-55': (auth.$state.refreshStatus == 'busy'),
                                    'bg-yellow-700/50!': (auth.$state.refreshStatus == 'failed'),
                                    'bg-green-700/50!': (auth.$state.refreshStatus == 'succeeded')
                                }">
                                <RefreshCcwIcon :class="{ 'animate-spin': (auth.$state.refreshStatus == 'busy'), }" />
                                <p class="text-nowrap">Refresh Data</p>
                            </Button>

                            <Button @click="auth.signOut(); $router.push('/')" unstyled
                                class="flex flex-row justify-between items-center gap-1 flex-nowrap bg-red-700/50 hover:bg-red-600/50 active:bg-red-500/50 transition-all active:scale-95 p-1.75 rounded-md cursor-pointer">
                                <LogOutIcon />
                                <p class="text-nowrap">Sign Out</p>
                            </Button>
                        </span>

                        <!-- Last Sync/More: -->
                        <div class="flex flex-col justify-center items-center">
                            <!-- More Details Toggle -->
                            <span class="flex opacity-35 flex-row gap-1 mt-4 items-center">
                                <p class="text-xs"> More Details </p>
                                <MoveRightIcon :size="15" />
                            </span>
                        </div>



                    </div>
                </section>
                <footer hidden
                    class="bg-white/0.5 text-white/45 text-[11px] text-center gap-1 p-1.5 px-2 w-full flex flex-row flex-wrap justify-between items-center content-center backdrop-blur-xl border-t-2 border-zinc-400">
                    <p class="w-full sm:w-fit">
                        <b>UID:</b> {{ user?.id }}
                    </p>
                    <a class="hover:underline sm:w-fit w-full font-medium" :href=draftDeleteAccountEmail()>
                        Account Deletion Request
                    </a>
                </footer>
            </div>

            <!-- Sign In - No Account Panel -->
            <div v-else
                class="flex flex-col w-[85%] max-w-120 bg-zinc-400/10 backdrop-blur-md justify-center items-center content-center ring-2 ring-zinc-400 m-5 rounded-md overflow-clip">
                <!-- Panel Header -->
                <header
                    class="bg-white/2.5 gap-1.5 p-3 px-2 w-full flex flex-row flex-wrap justify-start items-center content-center backdrop-blur-md border-b-2 border-zinc-400">
                    <UserCircle2Icon />
                    <p class="font-medium">Sign Into an Account</p>
                </header>
                <section
                    class="flex flex-col gap-2 p-4 justify-evenly items-center flex-wrap bg-black/40 w-full backdrop-blur-2xl">
                    <div class="flex flex-col gap-1 justify-center items-start">
                        <!-- Info: -->
                        <p
                            class="font-semibold text-xs w-fit self-start text-center py-0.75 px-2 rounded-md bg-red-600/40">
                            Not
                            Signed In</p>
                        <p>To access your account page you must first sign in by using your Discord account. Click the
                            button below
                            to get started.</p>
                    </div>

                    <!-- Sign In Button -->
                    <Button class="mt-3 my-2" size="small" @click="auth.signIn()">
                        <i class="pi pi-discord" />
                        <p class="text-nowrap font-medium">Sign Into Account</p>
                    </Button>
                </section>
            </div>

        </Transition>
    </main>
</template>

<style scoped>
    @reference '../styles/main.css';

    .userDataField {
        @apply ml-2.5 mb-0.5 opacity-70 font-medium text-sm bg-zinc-400/40 rounded-md p-0.5 px-1;
    }
</style>
