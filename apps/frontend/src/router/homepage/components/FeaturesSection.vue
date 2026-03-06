<script setup lang="ts">
    const features = [
        {
            title: 'Recurring Sessions',
            description: 'Schedule sessions for one occurrence or automatically repeat at set intervals (daily, weekly, monthly, yearly).'
        },
        {
            title: 'RSVP Signups',
            description: 'Members can claim defined session RSVP slots you add to sessions like Host, Player, Assistant, etc.'
        },
        {
            title: 'Session Panels',
            description: 'Interactive signup panels are posted directly in Discord from the schedules you create, representing each session occurrence.'
        },
        {
            title: 'Markdown Descriptions',
            description: 'Add links, rich formatting, and detailed notes to each session panel.'
        },
        {
            title: 'Native Discord Integration',
            description: 'Sync your sessions with native Discord events and enable thread mode for grouping session panels by each day.'
        },
        {
            title: 'Web Dashboard',
            description: 'Manage your sessions, schedules, server settings, and more all from one clean control center.'
        },
    ];
</script>

<template>
    <section class="px-6 py-16 sm:py-20" id="features">
        <div class="mx-auto max-w-6xl">
            <div class="mb-10 text-center">
                <h2 class="text-3xl font-bold text-text-1 sm:text-4xl">
                    Built for communities that run on schedules
                </h2>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <article v-for="feature in features" :key="feature.title"
                    class="rounded-2xl border border-ring-soft bg-gradient-to-b from-text-4/8 to-text-4/2 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-brand-2/50">
                    <h3 class="text-lg font-semibold text-text-1">{{ feature.title }}</h3>
                    <p class="mt-2 text-sm leading-relaxed text-text-2/90">{{ feature.description }}</p>
                </article>
            </div>
        </div>
    </section>
</template>
