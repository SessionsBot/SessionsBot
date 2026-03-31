<script setup lang="ts">
  import GalaxyBackground from '@/components/GalaxyBackground.vue';
  import { externalUrls } from '@/stores/nav';
</script>

<template>

  <section class="px-6 pb-12 sm:pb-16 w-full h-fit">

    <div
      class="mx-auto max-w-3xl relative w-fit h-fit flex rounded-3xl overflow-clip border border-ring-soft p-8 text-center sm:p-12">

      <div class="z-1 absolute inset-0 bg-indigo-500/14 opacity-50 w-full h-full grow flex">
        <GalaxyBackground :mouse-repulsion="false" :density="0.07" class="z-1! relative! w-full! h-full" />
      </div>


      <div class="mt-8 **:z-4! flex flex-wrap items-center justify-center gap-3 sm:gap-6">
        <h2 class="text-3xl pb-4 **:z-4 font-bold text-text-1 sm:text-4xl">Ready to organize your community?</h2>
        <a :href="externalUrls.inviteBot" target="_blank" rel="noopener noreferrer"
          class="rounded-xl button-primary px-6 py-3 font-semibold transition duration-300 hover:-translate-y-0.5">
          <DiscordIconOutlined class="relative bottom-px mr-px" />
          Add to Discord
        </a>
        <RouterLink to="/dashboard"
          class="rounded-xl border flex flex-center gap-0.75 border-violet-100/40 px-6 py-3 font-semibold text-violet-100 transition duration-300 hover:bg-white/10 hover:-translate-y-0.5">
          <Iconify icon="mdi:cards-outline" class="opacity-50!" size="20" />
          Open Dashboard
        </RouterLink>
      </div>

    </div>


  </section>
</template>
