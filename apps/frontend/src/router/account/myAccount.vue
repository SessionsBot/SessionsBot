<script setup lang="ts">
    import { useAuthStore } from "@/stores/auth/auth";
    import { supabase } from "@/utils/supabase";
    import axios from "axios";
    import { FileUserIcon, InfoIcon, LogOutIcon, MoveRightIcon, RefreshCcwIcon, UserCircle2Icon } from "lucide-vue-next";
    import { DateTime } from "luxon";
    import { storeToRefs } from "pinia";

    import lastSyncedBadge from "./lastSyncedBadge.vue";
    import LastSyncedBadge from "./lastSyncedBadge.vue";
    import SignInCard from "./signInCard.vue";
    import DeleteData from "./deleteData.vue";

    const clipboard = useClipboard();

    const auth = useAuthStore();
    const { userData, signedIn, user, refreshStatus } = storeToRefs(auth);

    const avatarLoaded = ref(false);

    async function copyAccessToken() {
        const token = auth.session?.access_token;
        if (!token) return alert('No access token!');
        if (!clipboard.isSupported) {
            alert(token);
            console.info(`Clipboard isn't supported!`);
        } else {
            clipboard.copy(token);
            alert('Copied to Clipboard!')
        }
    }

    // Account Deletion Visibility:
    const deleteDataInfoVisible = ref<boolean>(false);

</script>

<template>
    <main class="flex flex-wrap w-full h-full flex-1 justify-center items-center content-center">
        <Transition name="zoom" mode="out-in">

            <!-- Main Account Panel -->
            <div v-if="auth.signedIn"
                class="flex flex-col w-[80%] max-w-170 bg-zinc-400/20 justify-center items-center content-center ring-2 ring-zinc-400 m-5 rounded-md overflow-clip">
                <!-- Panel Header -->
                <header
                    class="bg-white/2.5 gap-1.5 p-3 px-2 w-full flex flex-row flex-wrap justify-start items-center content-center border-b-2 border-zinc-400">
                    <UserCircle2Icon />
                    <p class="font-medium">My Account</p>
                </header>
                <!-- Main Section -->
                <section class="flex flex-col sm:gap-0 sm:flex-row justify-evenly items-center bg-black/40 p-2 w-full">

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
                        <LastSyncedBadge />

                        <!-- Acc Actions -->
                        <span class="flex flex-wrap flex-row gap-3 pt-1.75 justify-center items-center">
                            <!-- Sign Out -->
                            <Button @click="auth.signOut(); $router.push('/')" unstyled
                                class="flex flex-row justify-between items-center gap-1 flex-nowrap bg-red-700/50 hover:bg-red-600/50 active:bg-red-500/50 transition-all active:scale-95 p-1.75 rounded-md cursor-pointer">
                                <LogOutIcon />
                                <p class="text-nowrap">Sign Out</p>
                            </Button>
                        </span>


                        <!-- Acc/Data Deletion Req Button -->
                        <span hidden @click="deleteDataInfoVisible = !deleteDataInfoVisible;"
                            class="flex opacity-35 flex-row gap-1 mt-2 items-center cursor-pointer active:bg-black/80 hover:bg-black/50 transition-all p-1.75 px-2 rounded-full">
                            <FileUserIcon class="m-auto p-auto" :size="15" />
                            <p class="text-xs"> Account / Data Deletion Requests </p>
                        </span>


                    </div>
                </section>

                <footer v-if="user?.user_metadata.username == 'scrixt'"
                    class="bg-white/0.5 text-white/45 text-[11px] text-center gap-1 p-1.5 px-2 w-full flex flex-row flex-wrap justify-between items-center content-center border-t-2 border-zinc-400">
                    <p class="w-full sm:w-fit">
                        <b>UID:</b> {{ user?.id }}
                    </p>
                    <a @click="copyAccessToken" class="hover:underline cursor-pointer sm:w-fit w-full font-medium">
                        Copy Access Token
                    </a>
                    <a @click="console.log(auth.session, auth.user)"
                        class="hover:underline cursor-pointer sm:w-fit w-full font-medium">
                        Log User/Session Data
                    </a>
                </footer>
            </div>

            <!-- Sign In - No Account Panel -->
            <SignInCard v-else />

        </Transition>

        <!-- Delete Data - Dialog -->
        <DeleteData v-model:is-visible="deleteDataInfoVisible" />
    </main>
</template>

<style scoped>
    @reference '../../styles/main.css';

    .userDataField {
        @apply ml-2.5 mb-0.5 opacity-70 font-medium text-sm bg-zinc-400/40 rounded-md p-0.5 px-1;
    }
</style>
