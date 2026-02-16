<script setup lang="ts">
    import { MenuIcon, XIcon } from "lucide-vue-next";
    import { Button } from "primevue";
    import { ref } from "vue";
    import SiteNav from "./siteNav.vue";
    import { useNavStore } from "@/stores/nav";

    // Services:
    const nav = useNavStore();

    // Expose header element so parent can measure
    const headerRef = ref<HTMLElement | null>(null);
    const headerHeight = useElementSize(headerRef).height || 0;

    // Status Alert Visibility
    const showStatusAlert = ref(false)
    watch(() => nav.systemStatus.state, (v) => {
        if (v?.data.data?.showStatusAlert) {
            showStatusAlert.value = true
        } else {
            showStatusAlert.value = false
        }
    }, { deep: true })


    defineExpose({ headerHeight })


</script>

<template>
    <header ref="headerRef"
        class="bg-bg-2/80 flex flex-col z-5 transition-all fixed top-0 w-full justify-between items-center content-center overflow-y-hidden overflow-x-clip gap-0 sm:gap-2 flex-wrap bg-bg-1/50 backdrop-blur-sm">

        <!-- Main Header Contents -->
        <span class="flex flex-row justify-between items-center w-full flex-wrap">
            <!-- Site Title -->
            <span @click="$router.push('/')"
                class="flex select-none! cursor-pointer items-center :w-fit justify-center content-center gap-1.5 m-3 flex-wrap">
                <div class="sm:size-11 size-9 logo-shadow rounded-xl">
                    <img src="/favicon.ico" class="sm:size-11 size-9 ring-2! ring-ring rounded-xl" :draggable="false" />
                </div>
                <p class="font-cut-letters! text-center title-shadow bg-transparent! text-2xl sm:text-3xl">Sessions Bot
                </p>
            </span>

            <!-- Nav Button -->
            <span class="flex items-center justify-center content-center gap-1 m-1">
                <Button @click="nav.openNav()" unstyled
                    class="bg-brand-1 hover:bg-brand-1/85 dark:active:bg-brand-1/75 p-2 m-3 rounded-md drop-shadow-black active:scale-95 transition-all cursor-pointer">
                    <MenuIcon class="text-xs size-5 sm:size-6" />
                    <p class="hidden">View Menu</p>
                </Button>
            </span>
        </span>

        <!-- Status Alert Bar -->
        <Transition name="slide" mode="out-in">
            <div v-if="showStatusAlert"
                class="bg-black/10 dark:bg-white/10 relative border-t sm:border-t-0 border-t-transparent p-2 w-full gap-1 m-0! min-h-fit! h-fit flex flex-row flex-wrap justify-center items-center">

                <div
                    class="absolute inset-x-0 top-0 h-px sm:h-0.5 bg-ring-3 dark:bg-radial from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />

                <!-- Icon Area -->
                <div
                    class=" py-0.75 px-1.5 gap-0.5 flex items-center justify-center bg-zinc-600/55 rounded-full ring-1 ring-ring">
                    <svg xmlns="http://www.w3.org/2000/svg" class="p-px" width="19" height="19" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                            stroke-width="1.5">
                            <path
                                d="M20.307 15.331c-3.521 3.521-9.173 3.577-12.694.056s-3.465-9.173.056-12.694m12.638 12.638c1.677-1.677.207-5.865-3.283-9.355S9.346 1.016 7.67 2.693m12.638 12.638c-1.677 1.677-5.866.207-9.355-3.282M7.669 2.693C5.992 4.37 7.462 8.56 10.952 12.05m0 0L14 9" />
                            <path
                                d="m6.488 15l-1.737 2.488c-1.399 2.004-2.098 3.006-1.58 3.76C3.687 22 5.075 22 7.85 22h4.297c2.776 0 4.164 0 4.682-.753c.471-.686-.067-1.578-1.225-3.247" />
                        </g>
                    </svg>
                    <p class="text-xs uppercase font-bold relative top-px">
                        System
                    </p>
                </div>

                <!-- Text area -->
                <div class="flex gap-0.5 items-center h-full flex-1">

                    <p class="font-bold text-sm block p-1">
                        It seems we're currently experiencing a service disruption! Please view our
                        <a class="text-sky-500 underline" href="https://status.sessionsbot.fyi" target="_blank">
                            status page</a>
                        for more information.
                    </p>
                </div>

                <!-- Close button -->

                <Button @click="showStatusAlert = false"
                    class="size-5 self-center flex justify-center items-center p-0.5 rounded-md cursor-pointer hover:bg-zinc-700/60 transition-all"
                    unstyled>
                    <XIcon />
                </Button>


            </div>
        </Transition>

        <!-- Accent Color - Bar -->
        <div v-if="!showStatusAlert"
            class="absolute inset-x-0 bottom-0 h-px sm:h-0.5 bg-ring-3 dark:bg-radial from-indigo-500 via-purple-500 to-pink-500 dark:animate-pulse" />


    </header>

    <SiteNav />
</template>

<style>
    .logo-shadow {
        box-shadow: 2px -2px 13px rgba(141, 60, 218, 0.8), -2px 2px 13px rgba(29, 135, 255, 0.68);
    }

    .title-shadow {
        text-shadow: 2px -2px 17px rgba(141, 60, 218), -2px 2px 17px rgb(29, 134, 255);
    }
</style>
