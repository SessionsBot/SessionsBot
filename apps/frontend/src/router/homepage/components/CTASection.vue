<script setup lang="ts">
  import { externalUrls } from '@/stores/nav';
</script>

<template>
  <section class="px-6 pb-12 pt-8 sm:pb-16">
    <div class="mx-auto max-w-5xl rounded-3xl border border-violet-200/20 bg-gradient-to-r from-violet-600/25 to-fuchsia-600/20 p-8 text-center backdrop-blur-sm sm:p-12">
      <h2 class="text-3xl font-bold text-white sm:text-4xl">Ready to organize your community?</h2>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          :href="externalUrls.inviteBot"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl bg-white px-6 py-3 font-semibold text-violet-700 transition duration-300 hover:-translate-y-0.5"
        >
          Add to Discord
        </a>
        <RouterLink
          to="/dashboard"
          class="rounded-xl border border-violet-100/40 px-6 py-3 font-semibold text-violet-100 transition duration-300 hover:bg-white/10"
        >
          Open Dashboard
        </RouterLink>
      </div>
    </div>
  </section>
</template>
