<script setup lang="ts">
import { externalUrls } from '@/stores/nav';

const links = [
  { label: 'Dashboard', to: '/dashboard', external: false },
  { label: 'Documentation', to: externalUrls.documentation, external: true },
  { label: 'Support Server', to: externalUrls.discordServer.supportInvite, external: true },
  { label: 'GitHub', to: externalUrls.gitHub, external: true }
];
</script>

<template>
  <footer class="border-t border-violet-200/10 px-6 py-10">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
      <p class="text-sm text-violet-200/80">© {{ new Date().getFullYear() }} Sessions Bot</p>
      <nav aria-label="Footer links" class="flex flex-wrap items-center justify-center gap-4 text-sm text-violet-100/90">
        <template v-for="link in links" :key="link.label">
          <a
            v-if="link.external"
            :href="link.to"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-colors hover:text-white"
          >
            {{ link.label }}
          </a>
          <RouterLink v-else :to="link.to" class="transition-colors hover:text-white">{{ link.label }}</RouterLink>
        </template>
      </nav>
    </div>
  </footer>
</template>
