<script setup lang="ts">
  const features = [
    {
      title: 'Recurring Sessions',
      description: 'Schedule sessions for once or automatically repeat at set intervals (daily, weekly, monthly, yearly).'
    },
    {
      title: 'RSVP Role Signups',
      description: 'Members can claim defined session RSVP roles like Host, Player, or Assistant.'
    },
    {
      title: 'Session Panels',
      description: 'Interactive signup panels are posted directly in Discord from the schedules you create.'
    },
    {
      title: 'Web Dashboard',
      description: 'Manage sessions, schedules, channels, and server settings from one clean control center.'
    },
    {
      title: 'Markdown Descriptions',
      description: 'Add links, rich formatting, and detailed notes to each session panel.'
    },
    {
      title: 'Native Discord Integration',
      description: 'Works with Discord events, channels, and thread mode for grouping session panels by day.'
    },
  ];
</script>

<template>
  <section class="px-6 py-16 sm:py-20" id="features">
    <div class="mx-auto max-w-6xl">
      <div class="mb-10 text-center">
        <h2 class="text-3xl font-bold text-white sm:text-4xl">Built for communities that run on schedules</h2>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-2xl border border-violet-200/20 bg-gradient-to-b from-white/8 to-white/2 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-violet-300/40"
        >
          <h3 class="text-lg font-semibold text-violet-100">{{ feature.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-violet-100/80">{{ feature.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
