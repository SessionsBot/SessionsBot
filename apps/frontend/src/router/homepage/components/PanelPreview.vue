<template>
  <section class="px-6 py-18 sm:py-24">
    <div class="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
      <div>
        <h2 class="text-3xl font-bold text-white sm:text-4xl">Session Panel preview</h2>
        <p class="mt-4 text-violet-100/80">
          Every session can be posted as an interactive panel inside Discord so members can join or leave in one click.
        </p>
      </div>

      <article class="rounded-2xl border border-violet-300/20 bg-[#2b2d31] p-5 text-slate-100 shadow-2xl shadow-black/30">
        <p class="text-xs uppercase tracking-wider text-slate-400">Session Panel</p>
        <h3 class="mt-2 text-xl font-bold text-white">Game Night</h3>
        <p class="text-sm text-slate-300">Friday 8:00 PM</p>

        <div class="mt-5 rounded-xl bg-[#1e1f22] p-4">
          <p class="text-xs uppercase tracking-wider text-slate-400">Description</p>
          <p class="mt-2 text-sm text-slate-200">"Join our weekly community game night!"</p>

          <p class="mt-4 text-xs uppercase tracking-wider text-slate-400">Roles</p>
          <ul class="mt-2 space-y-1 text-sm text-slate-100">
            <li>🎮 Player (4/6)</li>
            <li>🧑‍💻 Host (1/1)</li>
          </ul>

          <div class="mt-5 flex gap-3">
            <button class="rounded-lg bg-green-500/85 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-500">
              Join
            </button>
            <button class="rounded-lg bg-rose-500/85 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500">
              Leave
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
