<script setup lang="ts">
import HeroSection from './components/HeroSection.vue';
import FeaturesSection from './components/FeaturesSection.vue';
import HowItWorks from './components/HowItWorks.vue';
import PanelPreview from './components/PanelPreview.vue';
import DashboardPreview from './components/DashboardPreview.vue';
import UseCases from './components/UseCases.vue';
import CTASection from './components/CTASection.vue';
import HomeFooter from './components/HomeFooter.vue';
</script>

<template>
  <main class="min-h-screen bg-[#090714] text-white">
    <HeroSection />
    <FeaturesSection />
    <HowItWorks />
    <PanelPreview />
    <DashboardPreview />
    <UseCases />
    <CTASection />
    <HomeFooter />
  </main>
</template>
