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
  const headerHeight = computed(() => Number(headerRef.value?.['headerHeight']) ?? 0)


  // On App Mount:
  onMounted(async () => {
    await watchAuth();
  })

</script>

<template>

  <div class="flex flex-col min-h-screen"
    :class="{ 'overflow-hidden! overflow-y-clip! max-h-screen! max-w-screen!': nav.lockBodyScroll }">
    <SiteHeader ref="headerRef" />

    <div class="flex-1 flex flex-col overflow-hidden">
      <RouterView v-slot="{ Component }">
        <Transition name="slide" mode="out-in">
          <component class="flex-1 w-full h-full" :is="Component"
            :style="{ marginTop: headerHeight ? headerHeight + 'px' : '0px' }" />
        </Transition>
      </RouterView>
    </div>

    <SiteFooter hidden />
  </div>

  <!-- Confirm Dialog -->
  <PV_Dialog />
  <!-- Custom Notifications -->
  <!-- <Notifier hidden /> -->

</template>

<style scoped></style>
