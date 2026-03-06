<script setup lang="ts">
  const steps = [
    'Invite the bot to a Discord server you manage or own.',
    'Sign into your Bot Dashboard, to create your first Session Schedule',
    'Sessions Bot posts a session panel in Discord',
    'Members RSVP and your event fills automatically',
  ];
</script>

<template>
  <section class="px-6 py-16 sm:py-20">
    <div class="mx-auto max-w-5xl">
      <h2 class="text-center text-3xl font-bold sm:text-4xl">How it works</h2>
      <div class="w-full mt-10 flex flex-center flex-wrap p-auto bg-red-500/0">
        <!-- Flex Wrap -->
        <div v-for="(step, index) in steps" :key="step"
          class="gap-4 w-full! group max-w-[80%] flex flex-center flex-col flex-wrap p-4 pt-0">
          <article
            class="rounded-2xl w-full border border-ring-soft bg-text-1/4 p-6 transition duration-300 hover:border-brand-2/50">
            <p class="text-sm font-semibold text-brand-1 dark:text-brand-2">Step {{ index + 1 }}</p>
            <span v-html="step" class="mt-3 text-text-2/90 text-sm" />
          </article>
          <Iconify v-if="index + 1 != steps?.length" icon="mdi-arrow-down"
            class="opacity-75 -rotate-7 group-odd:rotate-7!" />
        </div>
      </div>
    </div>
  </section>
</template>
