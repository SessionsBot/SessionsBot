<script setup lang="ts">
  import { defaultLocation, defaultWindow } from '@vueuse/core';
  import { Card } from 'primevue';


</script>

<template>
  <main class="flex-1 text-gray-100 flex-col flex-wrap! justify-between items-center mb-8">

    <!-- Hero Section -->
    <div class="flex justify-center items-center flex-col flex-wrap flex-1">
      <section class="text-center mt-12 px-6">
        <span class="flex w-full justify-center items-center">
          <img src="/logo.png" class="size-37 mb-12 z-2! rounded-xl logo-shadow" />
        </span>
        <h1 class="text-5xl md:text-6xl font-extrabold mb-4">
          Welcome to <span class="text-indigo-400 font-stretch-125% font-cut-letters!">Sessions Bot</span>
        </h1>
        <p class="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Manage your Discord sessions effortlessly — schedule, organize, and host events with ease!
        </p>
        <div class="flex justify-center gap-4">
          <Button label="Invite to Discord" icon="pi pi-discord"
            @click="defaultWindow?.open('https://invite.sessionsbot.fyi', '_blank');"
            class="!bg-indigo-500 hover:!bg-indigo-600 border-none! shadow-md px-5 py-3 text-white font-semibold rounded-xl transition-all duration-300" />
          <Button label="Dashboard" outlined @click="$router.push('/dashboard')" icon="pi pi-home"
            class="!border-indigo-400 !text-indigo-300 hover:!bg-indigo-800 px-5 py-3 hover:!text-white/70 rounded-xl transition-all duration-300" />
        </div>
      </section>
    </div>

    <!-- Features -->
    <div class="flex justify-center items-center flex-col flex-wrap flex-1">
      <section class="mt-14 grid gap-8 grid-cols-1 md:grid-cols-3 px-8 max-w-6xl w-full">

        <!-- Smart Scheduling -->
        <Card
          class="backdrop-blur-md bg-black/15! border border-gray-700 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300">
          <template #title>
            <div class="flex items-center gap-2 text-xl text-indigo-400 font-semibold">
              <i class="pi pi-calendar "></i>
              Smart Scheduling
            </div>
          </template>
          <template #content>
            <p class="text-gray-300/70">
              Automatically create and manage training sessions or meetings with seamless time zone support.
            </p>
          </template>
        </Card>
        <!-- Generous Limits -->
        <Card
          class="backdrop-blur-md bg-black/15! border border-gray-700 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300">
          <template #title>
            <div class="flex items-center gap-2 text-xl text-indigo-400 font-semibold">
              <i class="pi pi-dollar "></i>
              Generous Limits
            </div>
          </template>
          <template #content>
            <p class="text-gray-300/70">
              Configure multiple session schedules, signup channels, custom session rsvps, and more for completley free!
            </p>
          </template>
        </Card>
        <!-- Built for Everyone -->
        <Card
          class="backdrop-blur-md bg-black/15! border border-gray-700 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300">
          <template #title>
            <div class="flex items-center gap-2 text-xl text-indigo-400 font-semibold">
              <i class="pi pi-dollar "></i>
              Built for Everyone
            </div>
          </template>
          <template #content>
            <p class="text-gray-300/70">
              Our session management bot works great for all sorts of Discord Servers!
            </p>
          </template>
        </Card>

      </section>
    </div>

  </main>

</template>

<style scoped></style>
