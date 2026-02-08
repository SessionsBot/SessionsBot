<script setup lang="ts">
    import SiteHeader from './components/siteHeader.vue';
    import SiteFooter from './components/siteFooter.vue';
    import PV_Dialog from './components/confirmDialog/ConfirmDialog.vue';
    import { watchAuth } from './stores/auth/auth';
    import useAnalyticsStore from './stores/analytics';

    // Services:
    const analytics = useAnalyticsStore();

    // // Reactive Header Height:
    const headerRef = ref();
    const headerHeight = computed(() => Number(headerRef.value?.['headerHeight']) ?? 0)

    // On App Mount:
    onMounted(async () => {
        // Initialize Auth (watcher):
        await watchAuth();
        // Initialize Analytics - Cookie Consent:
        analytics.cookieConsent.init()
    })

</script>

<template>

    <div class="flex flex-col min-h-screen">
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
    <!-- Cookie Alert -->
    <CookiePreferencesDialog />
    <!-- Custom Notifications -->
    <Notifier />

</template>

<style scoped></style>
