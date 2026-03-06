<script setup lang="ts">
import { externalUrls } from '@/stores/nav';
</script>

<template>
  <section class="relative isolate overflow-hidden px-6 pb-18 pt-24 sm:pt-30">
    <div class="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-b from-violet-950 via-fuchsia-900/30 to-transparent" />
    <div class="pointer-events-none absolute -left-28 top-16 -z-10 size-72 rounded-full bg-violet-500/35 blur-3xl" />
    <div class="pointer-events-none absolute -right-14 top-24 -z-10 size-64 rounded-full bg-fuchsia-400/30 blur-3xl" />
    <div class="pointer-events-none absolute bottom-4 left-1/2 -z-10 h-56 w-10/12 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

    <div class="mx-auto max-w-6xl">
      <div class="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-violet-900/30 backdrop-blur-xl sm:p-14">
        <p class="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">Discord Session Management</p>
        <h1 class="mx-auto max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
          Organize Discord events effortlessly.
        </h1>
        <p class="mx-auto mt-6 max-w-3xl text-base text-violet-100/90 sm:text-lg">
          Schedule sessions, manage RSVPs, and keep your community organized with automated session panels.
        </p>

        <div class="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a
            :href="externalUrls.inviteBot"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/40"
          >
            Add to Discord
          </a>
          <RouterLink
            to="/dashboard"
            class="rounded-xl border border-violet-300/70 bg-white/5 px-6 py-3 font-semibold text-violet-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-500/20"
          >
            Open Dashboard
          </RouterLink>
          <a
            :href="externalUrls.documentation"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-xl border border-transparent px-6 py-3 font-semibold text-violet-100 transition-all duration-300 hover:border-violet-300/60 hover:bg-violet-500/10"
          >
            View Docs
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
