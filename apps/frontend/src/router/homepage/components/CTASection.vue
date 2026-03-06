<script setup lang="ts">
  import { externalUrls } from '@/stores/nav';
</script>

<template>
  <section class="px-6 pb-12 pt-8 sm:pb-16">
    <div
      class="mx-auto max-w-3xl rounded-3xl border border-ring-soft bg-gradient-to-r from-violet-600/25 to-fuchsia-600/20 p-8 text-center backdrop-blur-sm sm:p-12">
      <h2 class="text-3xl font-bold text-text-1 sm:text-4xl">Ready to organize your community?</h2>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
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
