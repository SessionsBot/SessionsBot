<script setup lang="ts">
  import { useElementSize, type MaybeElementRef } from '@vueuse/core';
  import SiteHeader from './components/siteHeader.vue';
  import SiteFooter from './components/siteFooter.vue';
  import PV_Dialog from './components/ConfirmDialog.vue';
  import { ref } from 'vue';
  import { useNavStore } from './stores/nav';
  import { useAuthStore, watchAuth } from './stores/auth/auth';

  // Services:
  const nav = useNavStore();

  // // Reactive Header Height:
  const headerRef = ref();
  const headerHeight = computed(() => headerRef.value?.['headerHeight'] ?? 0)

  // On App Mount:
  onMounted(async () => {
    await watchAuth();
  })

</script>

<template>

  <!-- Site Header -->
  <SiteHeader ref="headerRef" />

  <span class="flex flex-col flex-1 overflow-x-clip! max-w-screen!"
    :class="{ 'overflow-y-clip! max-h-screen!': nav.navOpen }">
    <RouterView v-slot="{ Component }">
      <Transition name="slide" mode="out-in">
        <!-- Main Body Component -->
        <component :style="{ marginTop: headerHeight ? headerHeight + 'px' : '0 px' }"
          class="max-w-screen! overflow-x-clip min-w-[300px] flex flex-1 flex-wrap" :is="Component" />
      </Transition>
    </RouterView>

    <SiteFooter />
  </span>

  <!-- Confirm Dialog -->
  <PV_Dialog />

</template>

<style scoped></style>
