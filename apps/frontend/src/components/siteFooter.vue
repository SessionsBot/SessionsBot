<script setup lang="ts">

</script>

<template>
  <footer
    class="bg-bg-2/80 p-3 w-full h-fit flex font-semibold justify-between items-center content-center gap-2 text-text-soft text-sm text-center backdrop-blur-sm">

    <p> <span class="font-black">©</span> {{ new Date().getFullYear() }} Sessions Bot</p>
    <p> Made with 💜</p>

    <ColorModeToggle />

  </footer>

</template>