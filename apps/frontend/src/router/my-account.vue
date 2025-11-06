<script setup lang="ts">
  import { useAuthStore } from "@/stores/auth";
  import { LogOutIcon, RefreshCcwIcon, UserCircle2Icon } from "lucide-vue-next";
  import { storeToRefs } from "pinia";

  const auth = useAuthStore();
  const { userData, signedIn } = storeToRefs(auth);
</script>

<template>
  <main class="flex flex-wrap w-full h-full flex-1 justify-center items-center content-center">
    <Transition name="zoom" mode="out-in">
      <!-- Main Account Panel -->
      <div v-if="auth.signedIn"
        class="flex flex-col w-[85%] max-w-170 bg-zinc-400/10 backdrop-blur-md justify-center items-center content-center ring-2 ring-zinc-400 m-5 rounded-md overflow-clip">
        <!-- Panel Header -->
        <header
          class="bg-white/2.5 gap-1.5 p-3 px-2 w-full flex flex-row flex-wrap justify-start items-center content-center backdrop-blur-md border-b-2 border-zinc-400">
          <UserCircle2Icon />
          <p class="font-medium">My Account</p>
        </header>
        <section
          class="flex flex-col sm:gap-0 sm:flex-row justify-evenly items-center flex-wrap bg-black/40 p-2 w-full backdrop-blur-2xl">
          <div class="flex flex-col gap-1 justify-center items-start py-4">
            <!-- User Data: -->
            <p class="font-bold">Username:</p>
            <p class="userDataField">{{ userData?.username }}</p>
            <p class="font-bold">Display Name:</p>
            <p class="userDataField">{{ userData?.display_name }}</p>
            <p class="font-bold">Email:</p>
            <p class="userDataField">{{ userData?.email }}</p>
            <p class="font-bold">User Id:</p>
            <p class="userDataField">{{ userData?.id }}</p>
          </div>
          <div class="flex flex-col mb-5 flex-wrap justify-center items-center content-center">
            <!-- User Image -->
            <img :src="userData?.avatar" class="sm:size-40 size-35 mb-7 sm:mb-5 m-5 rounded-md ring-3 ring-zinc-400" />
            <span class="flex flex-nowrap flex-row gap-2 pt-1.5 justify-center items-center">
              <!-- Acc Actions -->
              <Button unstyled
                class="flex flex-row justify-between items-center gap-1 flex-nowrap bg-zinc-500/50 hover:bg-zinc-600/60 active:bg-zinc-500/70 transition-all active:scale-95 p-1.75 rounded-md cursor-pointer">
                <RefreshCcwIcon />
                <p class="text-nowrap">Refresh Data</p>
              </Button>

              <Button @click="auth.signOut()" unstyled
                class="flex flex-row justify-between items-center gap-1 flex-nowrap bg-red-700/50 hover:bg-red-600/50 active:bg-red-500/50 transition-all active:scale-95 p-1.75 rounded-md cursor-pointer">
                <LogOutIcon />
                <p class="text-nowrap">Sign Out</p>
              </Button>
            </span>
          </div>
        </section>
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
    </Transition>
  </main>
</template>

<style scoped>
  @reference '../styles/main.css';

  .userDataField {
    @apply ml-2.5 mb-0.5 opacity-70 font-medium text-sm bg-zinc-400/40 rounded-md p-0.5 px-1;
  }
</style>
