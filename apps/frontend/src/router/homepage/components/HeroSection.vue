<script setup lang="ts">
  import { externalUrls } from '@/stores/nav';
</script>

<template>
  <section class="relative overflow-hidden px-6 pb-18 pt-16 sm:pt-24">
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-500/30 blur-3xl"></div>
      <div class="absolute -left-12 top-28 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl"></div>
      <div class="absolute -right-10 top-12 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
      <div class="absolute right-20 top-40 h-20 w-20 rounded-2xl border border-white/15 bg-white/5 rotate-12"></div>
      <div class="absolute left-16 top-44 h-12 w-12 rounded-full border border-white/15 bg-white/5"></div>
    </div>

    <div class="mx-auto max-w-5xl text-center">
      <p class="mb-5 inline-flex rounded-full border border-violet-300/35 bg-violet-600/10 px-4 py-1 text-sm text-violet-200">
        Discord scheduling, simplified
      </p>
      <h1 class="text-balance text-4xl font-extrabold leading-tight text-white sm:text-6xl">
        Organize Discord events effortlessly.
      </h1>
      <p class="mx-auto mt-6 max-w-3xl text-lg text-violet-100/85 sm:text-xl">
        Schedule sessions, manage RSVPs, and keep your community organized with automated session panels.
      </p>

      <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
        <a
          :href="externalUrls.inviteBot"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-violet-500/40"
        >
          Add to Discord
        </a>

        <RouterLink
          to="/dashboard"
          class="rounded-xl border border-violet-300/40 bg-white/5 px-6 py-3 font-semibold text-violet-100 transition duration-300 hover:-translate-y-0.5 hover:bg-white/10"
        >
          Open Dashboard
        </RouterLink>

        <a
          :href="externalUrls.documentation"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl border border-violet-300/30 px-6 py-3 font-semibold text-violet-200 transition duration-300 hover:-translate-y-0.5 hover:border-violet-200/60 hover:text-white"
        >
          View Docs
        </a>
      </div>
    </div>
  </section>
</template>
