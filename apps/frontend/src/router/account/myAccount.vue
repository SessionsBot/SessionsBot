<script setup lang="ts">
    import { useAuthStore } from "@/stores/auth/auth";
    import { supabase } from "@/utils/supabase";
    import axios from "axios";
    import { FileUserIcon, InfoIcon, LogOutIcon, MoveRightIcon, RefreshCcwIcon, UserCircle2Icon } from "lucide-vue-next";
    import { DateTime } from "luxon";
    import { storeToRefs } from "pinia";

    import SignInCard from "./signInCard.vue";
    import DeleteData from "./deleteData.vue";
    import AccountPanel from "./AccountPanel.vue";

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
            <AccountPanel v-if="auth.signedIn" />

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
        @apply ml-2.5 mb-0.5 opacity-70 font-medium text-sm bg-zinc-400/30 rounded-md p-0.5 px-1;
    }
</style>
