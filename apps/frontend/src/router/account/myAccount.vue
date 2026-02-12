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
    <main class="flex flex-col w-full flex-1 grow justify-between">

        <!-- Content Area -->
        <span class="flex items-center justify-center flex-col gap-1 p-5 grow flex-1 w-full">

            <Transition name="zoom" mode="out-in">

                <!-- Main Account Panel -->
                <AccountPanel v-if="auth.signedIn" v-model:deleteDataDialogVisible="deleteDataDialogVisible" />

                <!-- Sign In - No Account Panel -->
                <SignInCard v-else />

            </Transition>

        </span>

        <!-- Delete Data - Dialog -->
        <DeleteData v-model:is-visible="deleteDataDialogVisible" />


        <!-- Footer -->
        <SiteFooter />
    </main>
</template>

<style scoped>
    @reference '../../styles/main.css';

    .userDataField {
        @apply ml-2.5 mb-0.5 opacity-70 font-medium text-sm bg-zinc-400/30 rounded-md p-0.5 px-1;
    }
</style>
