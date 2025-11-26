<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth/auth';
    import { UserCircle2Icon } from 'lucide-vue-next';

    const auth = useAuthStore();
</script>


<template>
    <div
        class="flex flex-col w-[85%] max-w-120 bg-zinc-400/10 justify-center items-center content-center ring-2 ring-zinc-400 m-5 rounded-md overflow-clip">
        <!-- Panel Header -->
        <header
            class="bg-white/2.5 gap-1.5 p-3 px-2 w-full flex flex-row flex-wrap justify-start items-center content-center border-b-2 border-zinc-400">
            <UserCircle2Icon />
            <p class="font-medium">Sign In</p>
        </header>
        <section class="flex flex-col gap-2 p-4 justify-evenly items-center flex-wrap bg-black/40 w-full">
            <div class="flex flex-col gap-1 justify-center items-start">
                <!-- Info: -->
                <p class="font-semibold text-xs w-fit self-start text-center py-0.75 px-2 rounded-md bg-red-600/40">
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
</template>