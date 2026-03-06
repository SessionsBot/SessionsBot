<script setup lang="ts">
import { externalUrls } from '@/stores/nav';
</script>

<template>
  <section class="px-6 py-18 sm:py-24">
    <div class="mx-auto max-w-5xl rounded-3xl border border-violet-200/20 bg-gradient-to-r from-violet-700/40 to-fuchsia-700/30 p-10 text-center shadow-xl shadow-violet-800/30 backdrop-blur-xl sm:p-14">
      <h2 class="text-3xl font-bold text-white sm:text-4xl">Ready to organize your community?</h2>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
        <a
          :href="externalUrls.inviteBot"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl bg-white px-6 py-3 font-semibold text-violet-900 transition-transform duration-300 hover:-translate-y-0.5"
        >
          Add to Discord
        </a>
        <RouterLink
          to="/dashboard"
          class="rounded-xl border border-white/60 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
        >
          Open Dashboard
        </RouterLink>
      </div>
    </div>
  </section>
</template>
