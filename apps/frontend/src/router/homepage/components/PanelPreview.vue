<template>
  <section class="px-6 py-16 sm:py-20">
    <div class="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
      <div>
        <h2 class="text-3xl font-bold sm:text-4xl">Session panel preview</h2>
        <p class="mt-4 text-text-2/85">
          Each session occurrence is published as an interactive Discord panel with clear details and quick RSVP
          actions.
        </p>
      </div>

      <article class="rounded-2xl border border-brand-2/50 bg-[#1f1b2e]/90 p-5 shadow-xl shadow-violet-950/30">
        <div class="rounded-xl bg-[#2a2440] p-4">
          <p class="text-lg font-semibold">Game Night</p>
          <p class="text-sm opacity-70">Friday 8:00 PM</p>

          <div class="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
            <p class="font-medium opacity-70">Description:</p>
            <p class="mt-1">"Join our weekly community game night!"</p>
          </div>

          <div class="mt-4 space-y-2 text-sm text-violet-100">
            <p class="font-medium">Roles:</p>
            <p>🎮 Player (4/6)</p>
            <p>🧑‍💻 Host (1/1)</p>
          </div>

          <div class="mt-5 flex gap-2">
            <button
              class="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400">Join</button>
            <button
              class="rounded-lg border border-violet-300/40 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-white/10">Leave</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
