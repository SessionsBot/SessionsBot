<script setup lang="ts">
  import { externalUrls } from '@/stores/nav';
  import { defaultLocation, defaultWindow } from '@vueuse/core';
  import { Card } from 'primevue';


</script>

<template>
  <main class="flex flex-1 flex-col grow w-full h-full justify-between items-center text-text-1">


    <!-- Hero Section -->
    <div class="flex justify-center items-center flex-col flex-wrap flex-1">
      <section class="text-center mt-12 px-6">
        <span class="flex w-full justify-center items-center">
          <img src="/logo.png" class="size-37 mb-12 z-2! rounded-xl logo-shadow" />
        </span>
        <h1 class="text-5xl md:text-6xl font-extrabold mb-4">
          Welcome to <span class="text-brand-1 font-stretch-125% font-cut-letters!">Sessions Bot</span>
        </h1>
        <p class="text-text-3 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Manage your Discord sessions effortlessly — schedule, organize, and host events with ease!
        </p>
        <div class="flex justify-center items-center gap-4">
          <a :href="externalUrls.inviteBot" target="_blank" rel="noopener noreferrer">
            <Button label="Invite to Discord" icon="pi pi-discord"
              class="!bg-brand-1/90 hover:!bg-brand-1/70 border-none! shadow-md px-5 py-3 font-semibold rounded-xl transition-all duration-300" />
          </a>
          <RouterLink to="/dashboard">
            <Button label="Dashboard" outlined @click="$router.push('/dashboard')" icon="pi pi-home"
              class="!border-brand-1/90 hover:!bg-brand-1/20 border-2! px-5 py-1.5 rounded-xl transition-all duration-300" />
          </RouterLink>
        </div>
      </section>
    </div>

    <!-- Features -->
    <div class="flex justify-center items-center flex-col flex-wrap flex-1">
      <section class="mt-14 grid gap-8 grid-cols-1 md:grid-cols-3 px-8 max-w-6xl w-full">

        <!-- Smart Scheduling -->
        <Card class="feature-card">
          <template #title>
            <div class="flex items-center gap-2 text-xl text-brand-1 font-semibold">
              <i class="pi pi-calendar "></i>
              Smart Scheduling
            </div>
          </template>
          <template #content>
            <p class="text-text-3">
              Automatically create and manage training sessions or meetings with seamless time zone support.
            </p>
          </template>
        </Card>
        <!-- Generous Limits -->
        <Card class="feature-card">
          <template #title>
            <div class="flex items-center gap-2 text-xl text-brand-1 font-semibold">
              <i class="pi pi-dollar "></i>
              Generous Limits
            </div>
          </template>
          <template #content>
            <p class="text-text-3">
              Configure multiple session schedules, signup channels, custom session rsvps, and more for completley
              free!
            </p>
          </template>
        </Card>
        <!-- Built for Everyone -->
        <Card class="feature-card">
          <template #title>
            <div class="flex items-center gap-2 text-xl text-brand-1 font-semibold">
              <i class="pi pi-dollar "></i>
              Built for Everyone
            </div>
          </template>
          <template #content>
            <p class="text-text-3">
              Our session management bot works great for all sorts of Discord Servers!
            </p>
          </template>
        </Card>

      </section>
    </div>


    <!-- Site Footer -->
    <SiteFooter class="mt-8" />

  </main>

</template>

<style scoped>

  @reference "@/styles/main.css";

  .feature-card {
    @apply backdrop-blur-md !bg-bg-2/80 border border-brand-1 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300;
  }

</style>
