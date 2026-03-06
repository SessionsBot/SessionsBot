<script setup lang="ts">
    import { externalUrls } from '@/stores/nav';
</script>

<template>
    <section class="relative overflow-hidden px-6 pb-18 pt-16 sm:pt-24">
        <!-- Gradient Effect -->
        <div class="pointer-events-none absolute inset-0 z-0">
            <div class="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-500/30 blur-3xl">
            </div>
            <div class="absolute -left-12 top-28 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl"></div>
            <div class="absolute -right-10 top-12 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
        </div>

        <div class="mx-auto max-w-5xl text-center">
            <p
                class="mb-5 inline-flex rounded-full border border-ring-soft/70 bg-violet-600/10 px-4 py-1 text-sm text-text-1/80 dark:text-violet-200">
                Discord Events, simplified
            </p>
            <div class="h-fit w-full flex grow flex-center mb-4 mt-2">
                <img src="/logo.png"
                    class="aspect-square z-2! opacity-85 self-center size-26 rounded-xl shadow-md shadow-black/20 border border-ring-soft" />
            </div>
            <h1 class="text-balance text-4xl font-extrabold leading-tight sm:text-6xl">
                Organize Discord events effortlessly.
            </h1>
            <span class="mx-auto mt-6 max-w-3xl text-lg text-text-2/80 dark:text-violet-100/85 sm:text-xl">
                Schedule sessions <p class="inline opacity-60 text-xs">(events)</p>, manage RSVPs, and keep your
                community organized
                with automated
                session panels.
            </span>

            <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
                <a :href="externalUrls.inviteBot" target="_blank" rel="noopener noreferrer"
                    class="rounded-xl bg-gradient-to-l from-violet-500 to-brand-1 px-6 py-3 font-semibold shadow-lg shadow-violet-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-violet-500/40">
                    <DiscordIconOutlined class="inline! relative bottom-0.5" />
                    Add to Discord
                </a>

                <RouterLink to="/dashboard">
                    <Button unstyled
                        class="button-base px-5 py-3 font-semibold rounded-xl border border-ring-soft hover:border-brand-2/50 transition-all hover:bg-bg-3/50 hover:-translate-y-0.5">
                        <Iconify icon="mdi:cards-outline" :size="18" class="opacity-80" />
                        Open Dashboard
                    </Button>
                </RouterLink>
            </div>

            <div class="flex flex-center w-full p-3.5">
                <a :href="externalUrls.documentation" target="_blank" rel="noopener noreferrer">
                    <Button unstyled
                        class="button-base px-6.5 py-2.5 text-sm font-semibold rounded-xl border border-ring-soft hover:border-brand-2/50 transition-all hover:bg-bg-3/50 hover:-translate-y-0.5">
                        <Iconify icon="mdi:paper-outline" :size="18" class="opacity-80" />
                        View Docs
                    </Button>
                </a>
            </div>

        </div>
    </section>
</template>
