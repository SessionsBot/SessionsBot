<script lang="ts" setup>
    import { useAuthStore } from "@/stores/auth/auth";
    import { externalUrls, useNavStore } from "@/stores/nav";
    import { supabase } from "@/utils/supabase";
    import { defaultWindow } from "@vueuse/core";
    import { BookOpenTextIcon, CircleDollarSignIcon, ExternalLinkIcon, HomeIcon, LogOutIcon, LucideLayoutDashboard, MessageCircleQuestionMark, ShieldUserIcon, UserCircle2Icon, XIcon } from "lucide-vue-next";

    const auth = useAuthStore();

    const nav = useNavStore();
    const navPages = {
        main: ref(),
        resources: ref(),
        admin: ref(),
    };
    const currentNavPage = ref<keyof typeof navPages>("main");
    const goToNavHome = () => { currentNavPage.value = "main"; };

    // auto nav to main nav page on nav open
    watch(() => nav.navOpen, (isOpen) => {
        if (isOpen) return goToNavHome();
    });
</script>

<template>
    <!-- Overlay / Modal -->
    <transition name="fade">
        <div v-if="nav.navOpen" @click="nav.closeNav()"
            class="bg-black/35 backdrop-blur-md w-full min-h-screen h-full flex-1 flex absolute top-0 bottom-0 z-10!" />
    </transition>

    <transition name="navSlide">
        <nav v-if="nav.navOpen"
            class="bg-black/25 border-x-2 border-white/5 backdrop-blur-md gap-1 w-fit min-w-58 flex flex-col justify-start items-center content-center text-center fixed top-0 right-0 h-screen overflow-x-clip drop-shadow-2xl drop-shadow-black/50 z-20">
            <!-- Nav Header -->
            <section
                class="flex p-3.5 bottom-1 relative bg-white/10 w-full select-none flex-row gap-1.5 flex-wrap justify-between items-center content-center m-1">
                <!-- Site Title/Logo -->
                <span class="flex flex-row flex-wrap gap-1.5 items-center content-center justify-center"
                    @click="currentNavPage == 'main' ? (currentNavPage = 'resources') : (currentNavPage = 'main')">
                    <img src="/favicon.ico" alt="" class="size-7.5 ring-1 ring-white/5 rounded-md" draggable="false" />
                    <p class="font-cutLetters text-xl">Sessions Bot</p>
                </span>
                <!-- Close Nav Btn -->
                <Button unstyled @click="nav.closeNav()"
                    class="flex flex-row flex-wrap justify-start items-center content-center gap-1.25 size-7.5 bg-white/10 p-1.25 rounded-md transition-all hover:bg-white/25 cursor-pointer active:bg-white/45">
                    <XIcon />
                </Button>
            </section>

            <!-- Nav Page Area -->
            <transition name="slide" mode="out-in">
                <!--- MAIN/Homepage - Nav Page -->
                <section v-if="currentNavPage == 'main'" ref="navPages.main"
                    class="flex p-3.5 pt-0 gap-5 scroll-hidden flex-col w-full scroll-w-0 justify-start items-center content-center flex-1">
                    <!-- MOST VISITED SECTION -->
                    <span class="flex flex-col gap-2 w-full">
                        <!-- Divider -->
                        <div
                            class="w-full mt-1 mb-1.75 flex gap-1.75 flex-row flex-nowrap justify-center items-center content-center">
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                            <p class="text-xs text-nowrap text-white/30">
                                Most Visited
                            </p>
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                        </div>

                        <!-- Homepage -->
                        <RouterLink :to="'/'">
                            <Button @click="nav.closeNav()" :disabled="$route.matched[0]?.name == 'Homepage'"
                                class="nav-button" unstyled>
                                <HomeIcon :stroke-width="2" />
                                <p>
                                    Homepage
                                </p>
                            </Button>
                        </RouterLink>


                        <!-- Dashboard -->
                        <RouterLink :to="'/dashboard'">
                            <Button @click="nav.closeNav()" :disabled="$route.matched[0]?.name == 'Dashboard'"
                                class="nav-button" unstyled>
                                <LucideLayoutDashboard :stroke-width="2" />
                                <p class="">Dashboard</p>
                            </Button>
                        </RouterLink>

                        <!-- Invite Bot -->
                        <Button @click="
                            nav.closeNav();
                        defaultWindow?.open(externalUrls.inviteBot, '_blank');
                        " class="nav-button relative" unstyled>
                            <i class="pi pi-discord ml-0.5" />
                            <p class="">Invite Bot</p>
                            <ExternalLinkIcon :stroke-width="2.5" class="absolute right-1.5 size-3" />
                        </Button>
                    </span>
                    <!-- INFORMATION SECTION -->
                    <span class="flex flex-col gap-2 w-full">
                        <!-- Divider -->
                        <div
                            class="w-full my-1.75 flex gap-1.75 flex-row flex-nowrap justify-center items-center content-center">
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                            <p class="text-xs text-nowrap text-white/30">Information</p>
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                        </div>

                        <!-- Pricing -->
                        <Button @click="
                            nav.closeNav();
                        $router.push('/pricing');
                        " :disabled="$route.matched[0]?.name == 'Pricing'" class="nav-button" unstyled>
                            <CircleDollarSignIcon :stroke-width="2" />
                            <p class="">Pricing</p>
                        </Button>

                        <!-- Support -->
                        <Button @click="
                            nav.closeNav();
                        $router.push('/support');
                        " :disabled="$route.matched[0]?.name == 'Support'" class="nav-button" unstyled>
                            <MessageCircleQuestionMark :stroke-width="2" />
                            <p class="">Support</p>
                        </Button>

                        <!-- Documentation -->
                        <Button @click="
                            nav.closeNav();
                        defaultWindow?.open('https://docs.sessionsbot.fyi', '_blank');
                        " class="nav-button relative!" unstyled>
                            <BookOpenTextIcon :stroke-width="2" />
                            <p class="">Documentation</p>
                            <ExternalLinkIcon :stroke-width="2.5" class="absolute right-1.5 size-3" />
                        </Button>
                    </span>
                    <!-- ACCOUNT SECTION -->
                    <span class="flex flex-col gap-2 w-full">
                        <!-- Divider -->
                        <div
                            class="w-full my-1.75 flex gap-1.75 flex-row flex-nowrap justify-center items-center content-center">
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                            <p class="text-xs text-nowrap text-white/30">My Account</p>
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                        </div>

                        <!-- Sign In -->
                        <Button @click="auth.signIn()" v-if="!auth.signedIn" class="nav-button relative!" unstyled>
                            <i class="pi pi-discord ml-0.5" />
                            <p class="">Sign Into Account</p>
                            <ExternalLinkIcon :stroke-width="2.5" class="absolute right-1.5 size-3" />
                        </Button>

                        <!-- My Account -->
                        <Button @click="
                            nav.closeNav();
                        $router.push('/account');
                        " v-if="auth.signedIn" :disabled="$route.matched[0]?.name == 'Account'" class="nav-button"
                            unstyled>
                            <UserCircle2Icon />
                            <p class="">My Account</p>
                        </Button>

                        <!-- Bot ADMIN -->
                        <Button @click="
                            nav.closeNav();
                        $router.push('/bot-admin');
                        " v-if="auth.user?.app_metadata?.roles?.includes('admin')"
                            :disabled="$route.matched[0]?.name == 'Bot Admin'"
                            class="nav-button bg-red-400/10! hover:bg-red-400/20!" unstyled>
                            <ShieldUserIcon />
                            <p class="font-medium">ADMIN Panel</p>
                        </Button>

                        <!-- Sign Out -->
                        <Button @click="auth.signOut()" v-if="auth.signedIn" class="nav-button" unstyled>
                            <LogOutIcon />
                            <p class="">Sign Out</p>
                        </Button>
                    </span>
                </section>
                <!--- Resources - Nav Page -->
            </transition>

            <!-- Nav Footer -->
            <section class="w-full p-3.5 mb-1 py-1 flex flex-col gap-1 justify-center items-center content-center">
                <!-- Divider -->
                <div class="w-full my-1 flex gap-1.75 flex-row flex-nowrap justify-center items-center content-center">
                    <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                    <p class="text-xs text-nowrap text-white/30">More Resources</p>
                    <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                </div>
                <p class="nav-footer-link" @click="$router.push('/privacy'); nav.closeNav();"
                    :class="{ 'text-indigo-300': $route.matched[0]?.name == 'Privacy' }">Privacy Policy</p>
                <p class="nav-footer-link" @click="$router.push('/terms'); nav.closeNav();"
                    :class="{ 'text-indigo-300': $route.matched[0]?.name == 'Terms' }">Terms and Conditions</p>

                <span @click="defaultWindow?.open(externalUrls.gitHub, '_blank')"
                    class="inline! cursor-pointer hover:underline underline-offset-1 text-xs opacity-55">
                    <span> Source Code </span>
                    <ExternalLinkIcon class="inline!" :size="12" />
                </span>

                <p hidden class="font-medium text-white/30 text-[11px]">© {{ new Date().getFullYear() }} - Sessions Bot
                </p>
            </section>
        </nav>
    </transition>
</template>

<style scoped>
    @reference "../styles/main.css";

    .navSlide-enter-active,
    .navSlide-leave-active {
        transition: all 0.4s ease;
    }

    .navSlide-enter-from,
    .navSlide-leave-to {
        opacity: 0;
        transform: translateX(50px);
    }

    .nav-button {
        @apply flex flex-row flex-wrap justify-start items-center content-center gap-1.25 w-full bg-white/10 p-1.25 rounded-md transition-all hover:bg-white/25 cursor-pointer active:scale-95;
    }

    .nav-button:disabled {
        @apply !scale-100 bg-indigo-400/30;
    }

    .nav-footer-link {
        @apply text-xs opacity-55 hover:underline underline-offset-1 cursor-pointer;
    }
</style>
