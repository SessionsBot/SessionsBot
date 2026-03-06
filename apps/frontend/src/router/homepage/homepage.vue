<script setup lang="ts">
  import CTASection from './components/CTASection.vue';
  import DashboardPreview from './components/DashboardPreview.vue';
  import FeaturesSection from './components/FeaturesSection.vue';
  import HeroSection from './components/HeroSection.vue';
  import HowItWorks from './components/HowItWorks.vue';
  import PanelPreview from './components/PanelPreview.vue';
  import SiteFooter from './components/SiteFooter.vue';
  import UseCases from './components/UseCases.vue';
</script>

<template>
  <main class="min-h-screen bg-bg-2 text-text-1">
    <HeroSection />
    <FeaturesSection />
    <HowItWorks />
    <PanelPreview />
    <DashboardPreview hidden />
    <UseCases />
    <CTASection />
    <SiteFooter />
  </main>
</template>
