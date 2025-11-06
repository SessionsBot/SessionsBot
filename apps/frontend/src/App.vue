<script setup lang="ts">
  import { useElementSize } from '@vueuse/core';
  import SiteHeader from './components/siteHeader.vue';
  import SiteFooter from './components/siteFooter.vue';
  import { ref } from 'vue';
  import { useNavStore } from './stores/nav';
  import { supabase } from './utils/supabase';
import { useAuthStore } from './stores/auth';

  const auth = useAuthStore();

  // Reactive Header Height:
  const headerElmRef = ref<{ headerRef: HTMLElement | null } | null>(null);
  const headerHeight = useElementSize(() => headerElmRef.value?.headerRef).height;
  // Nav store:
  const nav = useNavStore();

  onMounted(()=>{
    auth.watchAuth()
  })

</script>

<template>

  <SiteHeader ref="headerElmRef" />

  <span class="flex flex-col flex-1 overflow-x-clip! max-w-screen!" :class="{'overflow-y-clip! max-h-screen!': nav.navOpen }">
    <RouterView v-slot="{ Component }">
      <Transition name="slide" mode="out-in">
        <component :style="{ marginTop: `${headerHeight || 40}px` }" class="max-w-screen! overflow-x-clip min-w-[300px]"
          :is="Component" />
      </Transition>
    </RouterView>

    <SiteFooter />
  </span>

</template>

<style scoped></style>
