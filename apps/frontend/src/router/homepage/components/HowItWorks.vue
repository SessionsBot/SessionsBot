<script setup lang="ts">
  const steps = [
    'Create a session schedule from the dashboard',
    'Sessions Bot posts a session panel in Discord',
    'Members RSVP and your event fills automatically',
  ];
</script>

<template>
  <section class="px-6 py-16 sm:py-20">
    <div class="mx-auto max-w-5xl">
      <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">How it works</h2>
      <div class="mt-10 grid gap-4 md:grid-cols-3">
        <article
          v-for="(step, index) in steps"
          :key="step"
          class="rounded-2xl border border-violet-200/20 bg-white/5 p-6 transition duration-300 hover:border-violet-300/40"
        >
          <p class="text-sm font-semibold text-violet-300">Step {{ index + 1 }}</p>
          <p class="mt-3 text-violet-100">{{ step }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
