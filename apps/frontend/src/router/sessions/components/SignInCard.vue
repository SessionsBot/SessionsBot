<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import { XIcon } from 'lucide-vue-next';

    // Services:
    const auth = useAuthStore();
    const dismissed = defineModel<boolean>('dismissed')

</script>


<template>
    <div
        class="flex-center relative max-w-65 mt-2.5 gap-2 flex-col p-3 rounded-md bg-bg-soft/70 border-2 border-ring-soft">
        <!-- Header -->
        <span class="flex flex-row gap-0.5 items-center w-full">
            <Iconify icon="boxicons:user-x-filled" class="mt-px" />
            <p class="text-lg/tight font-bold w-fit p-0 bg-red-500/0">
                You're not signed in!
            </p>
        </span>
        <div class="h-1 my-1 w-12 bg-text-soft rounded-full" />
        <p class="font-medium opacity-65 text-sm">
            Sign into an account using Discord to view full session information...
        </p>

        <!-- Dismiss Button -->
        <Button title="Dismiss" @click="dismissed = true" unstyled
            class="button-base absolute! right-2! top-2! aspect-square self-start">
            <XIcon class="opacity-50 size-4.25" />
        </Button>

        <!-- Sign In Button -->
        <Button v-if="!auth.signedIn" title="Sign Into Account" @click="auth.signIn($route.fullPath)" unstyled
            class="button-base button-primary font-semibold active:scale-95 py-0.5 px-1.5 pr-2.5 my-2">
            <DiscordIcon class="scale-90 opacity-80" />
            Sign In
        </Button>

    </div>
</template>


<style scoped></style>