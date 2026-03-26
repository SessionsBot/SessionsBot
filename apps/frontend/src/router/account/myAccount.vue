<script setup lang="ts">
    import { useAuthStore } from "@/stores/auth/auth";

    import SignInCard from "./signInCard.vue";
    import DeleteData from "./deleteData.vue";
    import AccountPanel from "./AccountPanel.vue";
    import useNotifier from "@/stores/notifier";

    // Services:
    const auth = useAuthStore();
    const route = useRoute()

    // Account Deletion Visibility:
    const deleteDataDialogVisible = ref<boolean>(false);

    // Detect FAILED AUTH ATTEMPT Query:
    const queryError = computed(() => Object.entries(route.query).find(([k, v]) => k?.toLowerCase()?.includes('error')))

    // On Page Mount:
    onMounted(() => {
        if (queryError.value) {
            // Send Alert
            const notifier = useNotifier()
            notifier.send({
                level: 'error',
                header: `Failed to Sign In!`,
                content: `Please try again! If this issue persists, feel free to contact our Support Team!`,
                duration: 10
            })
        }
    })

</script>

<template>
    <main class="flex flex-col w-full flex-1 grow justify-between">

        <!-- Content Area -->
        <span class="flex items-center justify-center flex-col gap-1 p-5 grow flex-1 w-full">

            <Transition name="zoom" mode="out-in">

                <!-- Loading AUTH Card -->
                <div v-if="!auth.authReady"
                    class="flex-center flex-col gap-2 p-4 rounded-md bg-bg-soft border-2 border-ring-soft">

                    <ProgressSpinner />

                    <p class="font-semibold text-xl">
                        Loading Account...
                    </p>
                    <p class="text-xs italic opacity-60">
                        Please wait while we fetch your account data!
                    </p>
                </div>

                <!-- Main Account Panel -->
                <AccountPanel v-else-if="auth.signedIn" v-model:deleteDataDialogVisible="deleteDataDialogVisible" />

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
