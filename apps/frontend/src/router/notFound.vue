<script setup lang="ts">
  import { useNavStore } from "@/stores/nav";
  const router = useRouter();

  const nav = useNavStore();
  const redirectTimeRemaining = ref(0);

  let countDownId: ReturnType<typeof setInterval>;

  onMounted(() => {
    redirectTimeRemaining.value = 15;
    countDownId = setInterval(() => {
      if (redirectTimeRemaining.value <= 0) {
        router.push("/");
        clearInterval(countDownId);
      } else {
        redirectTimeRemaining.value -= 1;
      }
    }, 1_000);
  });
  onUnmounted(() => {
    if (countDownId) clearInterval(countDownId);
  });
</script>

<template>
  <main class="flex flex-1 flex-col flex-wrap justify-center items-center content-center">
    <section class="flex flex-col gap-1 flex-wrap items-center justify-center">
      <span>
        <div class="m-10 flex flex-col rounded-md flex-wrap items-center justify-center bg-zinc-400/10 backdrop-blur-md ring-2 ring-zinc-400 drop-shadow-lg drop-shadow-black/50">
          <h1 class="font-extrabold my-3 mx-5 text-5xl sm:text-7xl text-center"><span class="text-rose-500">NOT</span> FOUND?</h1>

          <p class="my-3 px-3 mt-0 text-center">We can't find the page you're looking for...</p>

          <div class="bg-zinc-400 w-full h-0.5 mt-0" />

          <div class="p-3 w-full bg-black/50 backdrop-blur-sm rounded-b-md">
            <p>
              If you believe this is an error, please get in contact with our
              <a :href="nav.externalUrls.discordServer.supportInvite" target="_blank" class="text-sky-400! hover:underline"> Support Team</a>.
            </p>

            <span class="text-sm self-center opacity-55">
              You'll be redirected to the <span class="hover:underline cursor-pointer" @click="$router.push('/')">homepage</span> in {{ redirectTimeRemaining }} seconds.
            </span>
          </div>
        </div>
      </span>
    </section>
  </main>
</template>
