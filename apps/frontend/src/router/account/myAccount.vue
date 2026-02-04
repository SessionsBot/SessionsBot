<script setup lang="ts">
    import { useAuthStore } from "@/stores/auth/auth";

    import SignInCard from "./signInCard.vue";
    import DeleteData from "./deleteData.vue";
    import AccountPanel from "./AccountPanel.vue";


    const auth = useAuthStore();

    // Account Deletion Visibility:
    const deleteDataDialogVisible = ref<boolean>(false);

</script>

<template>
    <main class="flex flex-wrap w-full h-full flex-1 p-5 justify-center items-center content-center">
        <Transition name="zoom" mode="out-in">

            <!-- Main Account Panel -->
            <AccountPanel v-if="auth.signedIn" v-model:deleteDataDialogVisible="deleteDataDialogVisible" />

            <!-- Sign In - No Account Panel -->
            <SignInCard v-else />

        </Transition>



        <!-- Delete Data - Dialog -->
        <DeleteData v-model:is-visible="deleteDataDialogVisible" />
    </main>
</template>

<style scoped>
    @reference '../../styles/main.css';

    .userDataField {
        @apply ml-2.5 mb-0.5 opacity-70 font-medium text-sm bg-zinc-400/30 rounded-md p-0.5 px-1;
    }
</style>
