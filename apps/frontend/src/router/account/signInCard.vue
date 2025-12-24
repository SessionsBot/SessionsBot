<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth/auth';
    import { UserCircle2Icon } from 'lucide-vue-next';

    const auth = useAuthStore();
</script>


<template>
    <div
        class="flex flex-col w-[85%] max-w-120 bg-zinc-700/90 justify-center items-center content-center ring-2 ring-zinc-500 m-5 rounded-md overflow-clip">
        <!-- Panel Header -->
        <header
            class="bg-black/50 gap-1.5 p-3 px-2 w-full flex flex-row flex-wrap justify-start items-center content-center border-b-2 border-zinc-500">
            <UserCircle2Icon />
            <p class="font-bold">Sign In</p>
        </header>
        <section class="flex flex-col gap-2 p-4 justify-evenly items-center flex-wrap bg-black/40 w-full">
            <div class="flex flex-col gap-1 justify-center items-start">
                <!-- Info: -->
                <p class="font-bold text-xs w-fit self-start text-center py-0.75 px-2 rounded-md bg-red-600/40">
                    Not Signed In</p>
                <p>To access your account page you must first sign in by using your Discord account. Click the
                    button below
                    to get started.</p>
            </div>

            <!-- Sign In Button -->
            <a href="https://api.sessionsbot.fyi/auth/discord-sign-in">
                <Button unstyled
                    class="mt-3 my-2 gap-1! p-2.25 py-1.5 rounded-md drop-shadow-2xl cursor-pointer bg-indigo-400/90 hover:bg-indigo-400/70 active:scale-95 transition-all flex items-center justify-center"
                    size="small">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M18.59 5.89c-1.23-.57-2.54-.99-3.92-1.23c-.17.3-.37.71-.5 1.04c-1.46-.22-2.91-.22-4.34 0c-.14-.33-.34-.74-.51-1.04c-1.38.24-2.69.66-3.92 1.23c-2.48 3.74-3.15 7.39-2.82 10.98c1.65 1.23 3.24 1.97 4.81 2.46c.39-.53.73-1.1 1.03-1.69c-.57-.21-1.11-.48-1.62-.79c.14-.1.27-.21.4-.31c3.13 1.46 6.52 1.46 9.61 0c.13.11.26.21.4.31c-.51.31-1.06.57-1.62.79c.3.59.64 1.16 1.03 1.69c1.57-.49 3.17-1.23 4.81-2.46c.39-4.17-.67-7.78-2.82-10.98Zm-9.75 8.78c-.94 0-1.71-.87-1.71-1.94s.75-1.94 1.71-1.94s1.72.87 1.71 1.94c0 1.06-.75 1.94-1.71 1.94m6.31 0c-.94 0-1.71-.87-1.71-1.94s.75-1.94 1.71-1.94s1.72.87 1.71 1.94c0 1.06-.75 1.94-1.71 1.94" />
                    </svg>
                    <p class="text-nowrap font-extrabold">Sign Into Account</p>
                </Button>
            </a>
        </section>
    </div>
</template>