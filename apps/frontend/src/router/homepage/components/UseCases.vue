<script setup lang="ts">
  const useCases = [
    'Gaming Communities',
    'Roleplay Servers',
    'Study Groups',
    'Team Practices',
    'Community Events',
  ];
</script>

<template>
  <section class="px-6 py-16 sm:py-20">
    <div class="mx-auto max-w-6xl">
      <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">Use cases</h2>
      <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <article
          v-for="useCase in useCases"
          :key="useCase"
          class="rounded-2xl border border-violet-200/20 bg-white/5 p-5 text-center font-medium text-violet-100 transition duration-300 hover:-translate-y-1 hover:border-violet-300/40"
        >
          {{ useCase }}
        </article>
      </div>
    </div>
  </section>
</template>
