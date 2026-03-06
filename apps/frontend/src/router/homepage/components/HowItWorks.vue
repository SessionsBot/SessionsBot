<script setup lang="ts">
const steps = [
  'Create a session schedule from the dashboard',
  'Sessions Bot posts a session panel in Discord',
  'Members RSVP and your event fills automatically'
];
</script>

<template>
  <section class="px-6 py-18 sm:py-24">
    <div class="mx-auto max-w-6xl rounded-3xl border border-violet-200/10 bg-violet-950/40 p-8 backdrop-blur-xl sm:p-12">
      <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">How it works</h2>
      <div class="mt-10 grid gap-6 md:grid-cols-3">
        <article
          v-for="(step, index) in steps"
          :key="step"
          class="rounded-2xl border border-violet-200/10 bg-white/5 p-6 transition-colors hover:border-violet-300/40"
        >
          <p class="text-sm font-semibold uppercase tracking-wider text-violet-300">Step {{ index + 1 }}</p>
          <p class="mt-3 text-base text-violet-50">{{ step }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
