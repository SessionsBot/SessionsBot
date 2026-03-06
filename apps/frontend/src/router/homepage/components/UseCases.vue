<script setup lang="ts">
const useCases = ['Gaming Communities', 'Roleplay Servers', 'Study Groups', 'Team Practices', 'Community Events'];
</script>

<template>
  <section class="px-6 py-18 sm:py-24">
    <div class="mx-auto max-w-6xl">
      <h2 class="text-center text-3xl font-bold text-white sm:text-4xl">Built for every kind of community</h2>
      <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <article
          v-for="useCase in useCases"
          :key="useCase"
          class="rounded-2xl border border-violet-200/10 bg-white/5 p-5 text-center text-sm font-semibold text-violet-50 transition-all duration-300 hover:-translate-y-1 hover:border-violet-300/50 hover:bg-violet-500/15"
        >
          {{ useCase }}
        </article>
      </div>
    </div>
  </section>
</template>
