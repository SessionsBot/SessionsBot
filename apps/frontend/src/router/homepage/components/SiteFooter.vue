<script setup lang="ts">
  import { externalUrls } from '@/stores/nav';
</script>

<template>
  <footer class="border-t border-violet-200/15 px-6 py-10">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-violet-200/80 sm:flex-row">
      <p>© {{ new Date().getFullYear() }} Sessions Bot</p>
      <nav class="flex flex-wrap justify-center gap-4">
        <RouterLink to="/dashboard" class="transition hover:text-white">Dashboard</RouterLink>
        <a :href="externalUrls.documentation" target="_blank" rel="noopener noreferrer" class="transition hover:text-white">Documentation</a>
        <a :href="externalUrls.discordServer.supportInvite" target="_blank" rel="noopener noreferrer" class="transition hover:text-white">Support Server</a>
        <a :href="externalUrls.gitHub" target="_blank" rel="noopener noreferrer" class="transition hover:text-white">GitHub</a>
      </nav>
    </div>
  </footer>
</template>
