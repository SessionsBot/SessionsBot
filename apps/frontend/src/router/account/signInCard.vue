<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth/auth';
    import { UserCircle2Icon } from 'lucide-vue-next';

    const auth = useAuthStore();
</script>


<template>
    <div
        class="flex flex-col w-[85%] max-w-120 bg-surface border-ring border-2 justify-center items-center content-center m-5 rounded-md overflow-clip">
        <!-- Panel Header -->
        <header
            class="bg-black/30 gap-1.5 p-3 px-2 w-full flex flex-row flex-wrap justify-start items-center content-center border-b-2 border-zinc-500">
            <UserCircle2Icon />
            <p class="font-bold">Sign In</p>
        </header>
        <section class="flex flex-col gap-2 p-4 justify-evenly items-center flex-wrap w-full">
            <div class="flex flex-col gap-1 justify-center items-start">
                <!-- Info: -->
                <p
                    class="font-bold text-xs w-fit self-start text-center py-0.75 px-2 rounded-md bg-red-600/40 ring ring-ring/50">
                    Not Signed In</p>
                <p>To access your account page you must first sign in by using your <b>Discord account</b>.</p>
                <p class="pt-0.5 text-sm italic opacity-70">
                    Click the button below to get started.
                </p>
            </div>

            <!-- Sign In Button -->
            <a href="https://api.sessionsbot.fyi/auth/discord-sign-in">
                <Button unstyled
                    class="mt-3 my-2 gap-1! p-2.25 py-1.5 rounded-md drop-shadow-2xl cursor-pointer bg-indigo-500 hover:bg-indigo-500/70 active:scale-95 transition-all flex items-center justify-center"
                    size="small">
                    <DiscordIcon />
                    <p class="text-nowrap font-extrabold">Sign Into Account</p>
                </Button>
            </a>
        </section>
    </div>
</template>