<script setup lang="ts">
  import { externalUrls } from '@/stores/nav';
</script>

<template>
  <footer class="border-t border-ring-soft/70 px-6 py-10 w-full">
    <div
      class="mx-auto flex max-w-6xl flex-col items-center text-center justify-between gap-4 text-sm text-text-4 sm:flex-row">
      <p>© {{ new Date().getFullYear() }} Sessions Bot</p>

      <nav class="flex flex-wrap justify-center gap-4 sm:gap-7">
        <RouterLink to="/dashboard" class="transition hover:text-brand-2">
          Dashboard
        </RouterLink>
        <a :href="externalUrls.documentation" target="_blank" rel="noopener noreferrer"
          class="transition hover:text-brand-2">
          Documentation
        </a>
        <RouterLink to="/support" class="transition hover:text-brand-2">
          Support
        </RouterLink>
        <a :href="externalUrls.statusPage" target="_blank" rel="noopener noreferrer"
          class="transition hover:text-brand-2">
          Status
        </a>
        <span class="w-full sm:w-fit flex flex-center flex-wrap gap-4">
          <RouterLink to="/privacy" class="transition hover:text-brand-2">
            Privacy
          </RouterLink>
          <RouterLink to="/terms" class="transition hover:text-brand-2">
            Terms
          </RouterLink>
        </span>

      </nav>

      <!-- Socials -->
      <nav class="flex flex-wrap flex-center gap-4 sm:gap-7">
        <a :href="externalUrls.gitHub" class="transition opacity-60 hover:opacity-100">
          <Iconify icon="mdi:github" />
        </a>
        <a :href="externalUrls.discordServer.invite" class="transition opacity-60 hover:opacity-100">
          <Iconify icon="ic:round-discord" />
        </a>

      </nav>

    </div>
  </footer>
</template>
