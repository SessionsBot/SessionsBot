<script setup lang="ts">
const features = [
  {
    title: 'Recurring Sessions',
    description:
      'Schedule sessions for once or automatically repeat at set intervals (daily, weekly, monthly, yearly).',
    icon: '🗓️'
  },
  {
    title: 'RSVP Role Signups',
    description:
      'Members can claim defined session RSVP roles like Host, Player, or Assistant.',
    icon: '🙋'
  },
  {
    title: 'Session Panels',
    description: 'Interactive signup panels posted directly in Discord from your schedules.',
    icon: '📋'
  },
  {
    title: 'Web Dashboard',
    description: 'Manage sessions and server settings from one clean control center.',
    icon: '🧭'
  },
  {
    title: 'Markdown Descriptions',
    description: 'Add links, formatting, and detailed notes to each session panel.',
    icon: '✍️'
  },
  {
    title: 'Native Discord Integration',
    description: 'Works seamlessly with Discord events, channels, and thread mode grouped by day.',
    icon: '🔗'
  }
];
</script>

<template>
  <section class="px-6 py-18 sm:py-24">
    <div class="mx-auto max-w-6xl">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="text-3xl font-bold text-white sm:text-4xl">Everything you need to run better sessions</h2>
        <p class="mt-4 text-violet-100/80">Powerful automation without losing the Discord-native experience.</p>
      </div>

      <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="group rounded-2xl border border-violet-200/10 bg-white/5 p-6 shadow-lg shadow-violet-950/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-300/40 hover:bg-violet-500/10"
        >
          <span class="text-2xl" aria-hidden="true">{{ feature.icon }}</span>
          <h3 class="mt-4 text-lg font-semibold text-white">{{ feature.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-violet-100/80">{{ feature.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
