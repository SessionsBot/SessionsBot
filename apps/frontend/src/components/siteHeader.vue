<script setup lang="ts">
    import { MenuIcon, XIcon } from "lucide-vue-next";
    import { Button } from "primevue";
    import { ref } from "vue";
    import SiteNav from "./siteNav.vue";
    import { useNavStore } from "@/stores/nav";
    import { API } from "@/utils/api";
    import type { APIResponseValue } from "@sessionsbot/shared";

    // Expose header element so parent can measure
    const headerRef = ref<HTMLElement | null>(null);
    const headerHeight = useElementSize(headerRef).height || 0;
    const systemStatuses = ref<string>();
    const showStatusAlert = ref<boolean>(false);


    onMounted(async () => {
        // Get system statuses:
        const { data } = await API.get<APIResponseValue<any>>(`/system/status`)
        if (!data?.success || data?.data?.['showStatusAlert']) {
            showStatusAlert.value = true;
            systemStatuses.value = data.data;
        } else {
            showStatusAlert.value = false;
            systemStatuses.value = data.data;
        }
    })

    defineExpose({ headerHeight, systemStatuses })

    const nav = useNavStore();
</script>

<template>
    <header ref="headerRef"
        class="flex flex-col border-b-2 z-5 drop-shadow-2xl drop-shadow-black/40 border-white/5 border-b-white/0 fixed top-0 w-full justify-between items-center content-center overflow-y-hidden overflow-x-clip gap-0 sm:gap-2 flex-wrap bg-black/40 backdrop-blur-sm">
        <div
            class="absolute inset-x-0 bottom-0 h-px sm:h-0.5 bg-radial from-indigo-500 via-purple-500 to-pink-500 animate-pulse">
        </div>

        <!-- Main Header Contents -->
        <span class="flex flex-row justify-between items-center w-full flex-wrap">
            <!-- Site Title -->
            <span @click="$router.push('/')"
                class="flex select-none! cursor-pointer items-center :w-fit justify-center content-center gap-1.5 m-3 flex-wrap">
                <div class="sm:size-11 size-9 logo-shadow rounded-xl">
                    <img src="/favicon.ico" class="sm:size-11 size-9 ring-2! ring-ring rounded-xl" :draggable="false" />
                </div>
                <p class="font-cutLetters! text-center title-shadow bg-transparent! text-2xl sm:text-3xl">Sessions Bot
                </p>
            </span>

            <!-- Nav Button -->
            <span class="flex items-center justify-center content-center gap-1 m-1">
                <Button @click="nav.openNav()" unstyled
                    class="bg-indigo-500 p-2 m-3 rounded-md drop-shadow-black active:scale-95 transition-all cursor-pointer">
                    <MenuIcon class="text-xs size-5 sm:size-6" />
                    <p class="hidden">View Menu</p>
                </Button>
            </span>
        </span>


        <!-- Status Alert Bar -->
        <Transition name="slide" mode="out-in">
            <div v-if="showStatusAlert"
                class="p-1 relative bg-pink-400/20 w-full flex flex-row flex-wrap justify-center items-center content-center">
                <!-- Text area -->
                <span class="flex flex-1 p-0.5 px-1">
                    <p class="font-medium text-sm block">
                        It seems we're currently experiencing a service disruption! Please view our
                        <a class="text-sky-400 underline" href="https://status.sessionsbot.fyi" target="_blank">
                            status page</a>
                        for more information.
                    </p>
                </span>
                <!-- Close button -->
                <span class="flex justify-evenly items-center">
                    <Button @click="showStatusAlert = false"
                        class="size-5 self-center flex justify-center items-center p-0.5 rounded-md cursor-pointer hover:bg-zinc-700/60 transition-all"
                        unstyled>
                        <XIcon />
                    </Button>
                </span>

                <div
                    class="absolute inset-x-0 top-0 h-px sm:h-0.5 bg-radial from-indigo-500 via-purple-500 to-pink-500 animate-pulse">
                </div>

            </div>
        </Transition>


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
