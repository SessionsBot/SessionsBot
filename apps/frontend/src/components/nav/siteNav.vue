<script lang="ts" setup>
    import { useAuthStore } from "@/stores/auth/auth";
    import { externalUrls, useNavStore } from "@/stores/nav";
    import { defaultWindow } from "@vueuse/core";
    import { ExternalLinkIcon, LogOutIcon, ShieldUserIcon, UserCircle2Icon, XIcon } from "lucide-vue-next";
    import NavButton from "./components/NavButton.vue";

    // Services:
    const auth = useAuthStore();
    const nav = useNavStore();

    // Util: Close Nav Menu:
    const closeNav = (): void => nav.closeNav();

    // On Color Mode Change - Apply to HTML:
    const colorMode = useColorMode({
        disableTransition: false,
    })
    watch(colorMode, (mode) => {
        const html = document.documentElement

        if (mode === 'dark') {
            html.setAttribute('data-theme', 'dark')
        } else if (mode === 'light') {
            html.setAttribute('data-theme', 'light')
        } else {
            html.removeAttribute('data-theme')
        }
    }, { immediate: true })

</script>

<template>
    <!-- Overlay / Modal -->
    <transition name="fade">
        <div v-if="nav.navVisible" @click="closeNav()"
            class="dark:bg-black/35 bg-black/55 backdrop-blur-md w-full min-h-screen h-full flex-1 flex absolute top-0 bottom-0 z-10!" />
    </transition>

    <transition name="navSlide">
        <nav v-if="nav.navVisible"
            class="dark:bg-black/25 text-white border-x-2 border-text-1/5 backdrop-blur-md gap-0 w-fit min-w-58 flex grow flex-col justify-start items-center content-center text-center fixed top-0 right-0 bottom-0 h-dvh overflow-x-clip overflow-y-auto drop-shadow-2xl drop-shadow-black/50 z-20">

            <!-- Nav Header -->
            <section
                class="flex p-3.5 bg-white/2.5 w-full select-none flex-row gap-1.5 flex-wrap justify-between items-center content-center">
                <!-- Site Title/Logo -->
                <span class="flex flex-row flex-wrap gap-1.5 items-center content-center justify-center">
                    <img src="/favicon.ico" alt="" class="size-7.5 ring-1 ring-white/5 rounded-md" draggable="false" />
                    <p class="font-cut-letters text-xl">Sessions Bot</p>
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
                    class="flex bg-white/2.5 p-3.5 pt-0 gap-3.5 flex-col w-full justify-start items-center content-center flex-1">

                    <!-- MOST VISITED SECTION -->
                    <span class="flex flex-col gap-2 w-full">
                        <!-- Title - Divider -->
                        <div
                            class="w-full mt-1 mb-1.75 flex gap-1.75 flex-row flex-nowrap justify-center items-center content-center">
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                            <p class="text-xs text-nowrap text-white/30">
                                Most Visited
                            </p>
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                        </div>

                        <NavButton title="Homepage" to="/" icon="typcn:home" />

                        <NavButton title="Dashboard" to="/dashboard" icon="mdi:cards" />

                        <NavButton title="Invite Bot" :href="externalUrls.inviteBot" icon="ic:baseline-discord"
                            :classes="{ icon: 'p-px' }" />

                    </span>

                    <!-- INFORMATION SECTION -->
                    <span class="flex flex-col gap-2 w-full">
                        <!-- Title - Divider -->
                        <div
                            class="w-full my-1.75 flex gap-1.75 flex-row flex-nowrap justify-center items-center content-center">
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                            <p class="text-xs text-nowrap text-white/30">
                                Information
                            </p>
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                        </div>

                        <NavButton title="Pricing" to="/pricing" icon="healthicons:money-bag" />

                        <NavButton title="Support" to="/support" icon="streamline:help-chat-2-solid"
                            :classes="{ icon: 'p-0.75' }" />

                        <NavButton title="Documentation" :href="externalUrls.documentation"
                            icon="material-symbols:book-rounded" :classes="{ icon: 'p-px' }" />

                        <NavButton title="Status" :href="externalUrls.statusPage" icon="heroicons-outline:status-online"
                            :classes="{ icon: 'p-px' }" />

                    </span>

                    <!-- ACCOUNT SECTION -->
                    <span class="flex flex-col gap-2 w-full">
                        <!-- Title - Divider -->
                        <div
                            class="w-full my-1.75 flex gap-1.75 flex-row flex-nowrap justify-center items-center content-center">
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                            <p class="text-xs text-nowrap text-white/30">My Account</p>
                            <div class="bg-ring/50 h-1 rounded-full flex-1/2" />
                        </div>

                        <!-- Sign In -->
                        <NavButton title="Sign Into Account" v-if="!auth.signedIn" icon="mdi:user"
                            :action="() => auth.signIn($route.fullPath)" />
                        <!-- My Account -->
                        <NavButton title="My Account" v-else icon="mdi:user" to="/account"
                            :classes="{ icon: 'p-px' }" />
                        <!-- Sign Out -->
                        <NavButton title="Sign Out" v-if="auth.signedIn" icon="line-md:logout"
                            :action="() => { auth.signOut(); $router.push('/') }"
                            :classes="{ root: 'bg-text-1/9! hover:bg-invalid-1/17!' }" />

                        <!-- Bot Admin -->
                        <NavButton title="BOT ADMIN" icon="eos-icons:admin" to="/bot-admin"
                            v-if="auth.user?.app_metadata?.roles?.includes('admin')"
                            :classes="{ root: 'bg-fuchsia-600/10! hover:bg-fuchsia-600/15!', text: 'font-cut-letters' }" />

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
                <!-- Privacy Policy -->
                <RouterLink to="/privacy-policy">
                    <p class="nav-footer-link" @click="closeNav();"
                        :class="{ 'text-indigo-300': $route.matched[0]?.name == 'Privacy' }">
                        Privacy Policy
                    </p>
                </RouterLink>
                <!-- Terms & Conditions -->
                <RouterLink to="/terms-and-conditions">
                    <p class="nav-footer-link" @click="closeNav();"
                        :class="{ 'text-indigo-300': $route.matched[0]?.name == 'Terms' }">
                        Terms and Conditions
                    </p>
                </RouterLink>

                <!-- Terms & Conditions -->
                <RouterLink to="/dev-sign-in"
                    v-if="!auth.signedIn && !defaultWindow?.location.hostname?.includes('sessionsbot')">
                    <p class="nav-footer-link" @click="closeNav();"
                        :class="{ 'text-indigo-300': $route.matched[0]?.name == 'Terms' }">
                        Developer Sign In
                    </p>
                </RouterLink>

                <!-- Color Mode - Toggler -->
                <ColorModeToggle class="scale-90" />

                <p hidden class="font-medium text-white/30 text-[11px]">© {{ new Date().getFullYear() }} - Sessions Bot
                </p>
            </section>

        </nav>
    </transition>
</template>

<style scoped>
    @reference "@/styles/main.css";

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
