<script lang="ts" setup>
    import { useAuthStore } from "@/stores/auth/auth";
    import { externalUrls, useNavStore } from "@/stores/nav";
    import { supabase } from "@/utils/supabase";
    import { defaultWindow } from "@vueuse/core";
    import { BookOpenTextIcon, CircleDollarSignIcon, ExternalLinkIcon, HomeIcon, LogOutIcon, LucideLayoutDashboard, MessageCircleQuestionMark, MessageCircleQuestionMarkIcon, ShieldUserIcon, UserCircle2Icon, XIcon } from "lucide-vue-next";

    // Services:
    const auth = useAuthStore();
    const nav = useNavStore();

    // Util: Close Nav Menu:
    const closeNav = (): void => nav.closeNav();

</script>

<template>
    <!-- Overlay / Modal -->
    <transition name="fade">
        <div v-if="nav.navOpen" @click="closeNav()"
            class="bg-black/35 backdrop-blur-md w-full min-h-screen h-full flex-1 flex absolute top-0 bottom-0 z-10!" />
    </transition>

    <transition name="navSlide">
        <nav v-if="nav.navOpen"
            class="bg-black/25 border-x-2 border-white/5 backdrop-blur-md gap-0 w-fit min-w-58 flex flex-col justify-start items-center content-center text-center fixed top-0 right-0 h-screen overflow-x-clip drop-shadow-2xl drop-shadow-black/50 z-20">

            <!-- Nav Header -->
            <section
                class="flex p-3.5 bg-white/2.5 w-full select-none flex-row gap-1.5 flex-wrap justify-between items-center content-center">
                <!-- Site Title/Logo -->
                <span class="flex flex-row flex-wrap gap-1.5 items-center content-center justify-center">
                    <img src="/favicon.ico" alt="" class="size-7.5 ring-1 ring-white/5 rounded-md" draggable="false" />
                    <p class="font-cutLetters text-xl">Sessions Bot</p>
                </span>
                <!-- Close Nav Btn -->
                <Button unstyled @click="closeNav()"
                    class="flex flex-row flex-wrap justify-start items-center content-center gap-1.25 size-7.5 bg-white/10 p-1.25 rounded-md transition-all hover:bg-white/25 cursor-pointer active:bg-white/45">
                    <XIcon />
                </Button>
            </section>

            <!-- Nav Page Area -->
            <transition name="slide" mode="out-in">

                <!--- MAIN/Homepage - Nav Page -->
                <section
                    class="flex bg-white/2.5 p-3.5 pt-0 gap-3.5 scroll-hidden flex-col w-full scroll-w-0 justify-start items-center content-center flex-1">
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
                        <RouterLink :to="'/'" v-slot="{ isActive }">
                            <Button class="nav-button" @click="closeNav()" :class="{ 'nav-button-active': isActive }"
                                unstyled :disabled="isActive">
                                <HomeIcon :stroke-width="2" />
                                <p class="">
                                    Homepage
                                </p>
                            </Button>
                        </RouterLink>


                        <!-- Dashboard -->
                        <RouterLink :to="'/dashboard'" v-slot="{ isActive }">
                            <Button class="nav-button" @click="closeNav()" :class="{ 'nav-button-active': isActive }"
                                unstyled :disabled="isActive">
                                <LucideLayoutDashboard :stroke-width="2" />
                                <p class="">
                                    Dashboard
                                </p>
                            </Button>
                        </RouterLink>

                        <!-- Invite Bot -->
                        <a :href="externalUrls.inviteBot" target="_blank">
                            <Button @click="closeNav()" class="nav-button relative" unstyled>
                                <i class="pi pi-discord ml-0.5" />
                                <p class="">
                                    Invite Bot
                                </p>
                                <ExternalLinkIcon :stroke-width="2.5" class="absolute right-1.5 size-3" />
                            </Button>
                        </a>

                    </span>
                    <!-- INFORMATION SECTION -->
                    <span class="flex flex-col gap-2 w-full">
                        <!-- Divider -->
                        <div
                            class="w-full my-1.75 flex gap-1.75 flex-row flex-nowrap justify-center items-center content-center">
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                            <p class="text-xs text-nowrap text-white/30">
                                Information
                            </p>
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                        </div>

                        <!-- Pricing -->
                        <RouterLink :to="'/pricing'" v-slot="{ isActive }">
                            <Button class="nav-button" @click="closeNav()" :class="{ 'nav-button-active': isActive }"
                                unstyled :disabled="isActive">
                                <CircleDollarSignIcon :stroke-width="2" />
                                <p>
                                    Pricing
                                </p>
                            </Button>
                        </RouterLink>

                        <!-- Support -->
                        <RouterLink :to="'/support'" v-slot="{ isActive }">
                            <Button class="nav-button" @click="closeNav()" :class="{ 'nav-button-active': isActive }"
                                unstyled :disabled="isActive">
                                <MessageCircleQuestionMarkIcon :stroke-width="2" />
                                <p>
                                    Support
                                </p>
                            </Button>
                        </RouterLink>

                        <!-- Documentation -->
                        <a :href="externalUrls.documentation" target="_blank">
                            <Button @click="closeNav()" class="nav-button relative" unstyled>
                                <BookOpenTextIcon :stroke-width="2" />
                                <p class="">
                                    Documentation
                                </p>
                                <ExternalLinkIcon :stroke-width="2.5" class="absolute right-1.5 size-3" />
                            </Button>
                        </a>
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
                        <RouterLink :to="'/account'" v-slot="{ isActive }">
                            <Button class="nav-button" @click="closeNav()" :class="{ 'nav-button-active': isActive }"
                                unstyled :disabled="isActive">
                                <UserCircle2Icon />
                                <p>
                                    My Account
                                </p>
                            </Button>
                        </RouterLink>

                        <!-- Bot ADMIN -->
                        <RouterLink :to="'/bot-admin'" v-slot="{ isActive }"
                            v-if="auth?.user?.app_metadata?.roles?.includes('admin')">
                            <Button class="nav-button bg-red-400/10! hover:bg-red-400/20!" @click="closeNav()"
                                :class="{ 'nav-button-active': isActive }" unstyled :disabled="isActive">
                                <ShieldUserIcon />
                                <p class="font-cutLetters opacity-87">
                                    BOT ADMIN
                                </p>
                            </Button>
                        </RouterLink>

                        <!-- Sign Out -->
                        <RouterLink :to="'/account'" v-slot="{ isActive }">
                            <Button class="nav-button hover:bg-red-400/20!" @click="auth.signOut(), closeNav()" unstyled
                                :disabled="isActive">
                                <LogOutIcon />
                                <p>
                                    Sign Out
                                </p>
                            </Button>
                        </RouterLink>
                    </span>
                </section>

                <!--- Resources - Nav Page -->

            </transition>

            <!-- Nav Footer -->
            <section
                class="w-full bg-white/2.5 p-3.5 mb-1 py-1 flex flex-col gap-1 justify-center items-center content-center">
                <!-- Divider -->
                <div class="w-full my-1 flex gap-1.75 flex-row flex-nowrap justify-center items-center content-center">
                    <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                    <p class="text-xs text-nowrap text-white/30">More Resources</p>
                    <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                </div>
                <p class="nav-footer-link" @click="$router.push('/privacy'); closeNav();"
                    :class="{ 'text-indigo-300': $route.matched[0]?.name == 'Privacy' }">Privacy Policy</p>
                <p class="nav-footer-link" @click="$router.push('/terms'); closeNav();"
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

    .nav-button-active {
        @apply !scale-100 !bg-indigo-400/30;
    }

    .nav-footer-link {
        @apply text-xs opacity-55 hover:underline underline-offset-1 cursor-pointer;
    }
</style>
