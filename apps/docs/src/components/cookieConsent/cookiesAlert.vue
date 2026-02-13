<script lang="ts" setup>
    import { useData } from 'vitepress';
    import { CookieConsentType, useCookieConsent } from './cookieConsent';
    import { computed, onMounted, reactive, ref, watch } from 'vue';
    import { useScrollLock } from '@vueuse/core'


    // Services:
    const pageData = useData();
    const cookieConsent = useCookieConsent()
    const scrollLock = useScrollLock(window)

    // Is Dark Mode:
    const isDarkMode = computed(() => pageData?.isDark?.value)

    // Cookie Preferences Dialog:
    const cookiePrefDialogVisible = ref<boolean>(false)
    watch(cookiePrefDialogVisible, (visible) => {
        if (visible) { // lock body scroll
            scrollLock.value = true
        } else { // unlock body scroll
            scrollLock.value = false
        }
    })

    // Form Values:
    const form_options = reactive({
        functional: {
            title: "Functional",
            description: "Essential for the website to function properly (e.g. remembering your cookie preferences, security, and core features). These cannot be disabled. ",
            required: true,
            allowed: true
        },
        analytics: {
            title: "Analytics",
            description: "Helps us understand how visitors use our site so we can improve performance and content. (e.g. Google Analytics)",
            required: false,
            allowed: false
        },
        preferences: {
            title: "Preferences",
            description: "Allows the site to remember your choices (like language, theme, or layout) to give you a more personalized experience. ",
            required: false,
            allowed: false
        },
        marketing: {
            title: "Marketing",
            description: "Used to deliver relevant ads and measure their effectiveness, often across different websites and apps. ",
            required: false,
            allowed: false
        }
    })

    // fn - open preferences dialog:
    function openPreferences() {
        cookieConsent.showCookieUsageAlert = false
        // auto select all:
        for (const [i, d] of Object.entries(form_options)) {
            // @ts-ignore
            const opt = form_options[i]
            opt.allowed = true;
        }
        cookiePrefDialogVisible.value = true;
    }


    // fn - confirmChoices - Submit Dialog:
    async function confirmChoices() {


        // Parse - Save - Apply Consent Selection:
        let allowed: CookieConsentType[] = []
        if (form_options.analytics.allowed) {
            allowed.push('analytics_storage')
        }
        if (form_options.marketing.allowed) {
            allowed.push('ad_personalization', 'ad_storage', 'ad_user_data')
        }

        // Update Consent - Close Form:
        cookieConsent.updateConsent(allowed)
        cookiePrefDialogVisible.value = false
    }

    // App Mount - Essentially:
    onMounted(() => {
        // Load Consent - Applies or Asks for Consent Preferences: 
        cookieConsent.loadConsent()
    })

</script>


<template>

    <!-- Notification - Cookie Usage Alert -->
    <Transition name="cookie-usage" mode="out-in">
        <div v-if="cookieConsent.showCookieUsageAlert" class="cookie-usage-alert" :class="{ 'dark-mode': isDarkMode }">

            <!-- Header -->
            <span class="header-wrap">
                🍪 Want Cookies?
            </span>

            <!-- Content -->
            <span class="content-wrap">
                This site uses browser cookies & other similar technologies to provide you a better experiencing while
                using
                our platforms.
            </span>

            <!-- Actions -->
            <span class="actions-wrap">

                <button class="action-button" @click="openPreferences()">
                    Manage Preferences
                </button>

                <button class="action-button" @click="cookieConsent.acceptAll()">
                    Accept All
                </button>

            </span>

        </div>
    </Transition>


    <!-- Preferences Modal - Backdrop -->
    <Transition name="fade" mode="out-in">
        <div v-show="cookiePrefDialogVisible" class="w-full h-full flex grow flex-1 bg-black/50 fixed inset-0 z-50!" />
    </Transition>

    <!-- Preferences Modal - Dialog -->
    <Transition name="zoom" mode="out-in">
        <div v-if="cookiePrefDialogVisible" class="cookie-preferences-dialog">

            <!-- Header -->
            <div class="dialog-header">
                <p class="text-lg font-bold">
                    🍪 Cookie Preferences
                </p>
            </div>

            <!-- Options -->
            <div class="dialog-content">

                <!-- Cookie Option(s) -->
                <div v-for="opt of form_options" class="option-wrap">

                    <!-- Title & Checkbox -->
                    <span @click="() => { if (!opt.required) { opt.allowed = !opt.allowed } }"
                        class="w-full flex flex-row gap-1.75 items-center justify-start">
                        <!-- Checkbox -->
                        <button class="option-checkbox"
                            :class="{ 'selected': opt.allowed, 'cursor-not-allowed!': opt.required }">
                            <Transition name="zoom">
                                <svg v-if="opt.allowed" class="text-white/85 w-full h-full p-px"
                                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                        d="M9 16.17L5.53 12.7a.996.996 0 1 0-1.41 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71a.996.996 0 1 0-1.41-1.41z" />
                                </svg>
                            </Transition>
                        </button>

                        <!-- Title -->
                        <p class="option-title"> {{ opt.title }} </p>

                        <div v-if="opt.required" class="text-xs scale-90 right-1 relative opacity-50 italic">
                            (Always on)
                        </div>
                    </span>


                    <div class="block px-1 text-xs/snug">

                        <!-- Description -->
                        {{ opt?.description || opt?.required }}

                    </div>

                </div>

            </div>

            <!-- Footer - Actions -->
            <div class="dialog-footer">

                <button class="confirm-button" @click="confirmChoices">
                    Confirm
                </button>

            </div>


        </div>
    </Transition>

</template>


<style scoped>

    @reference "@theme/custom.css";

    .cookie-usage-alert {
        @apply m-2 ml-[20%] max-w-95 gap-1.75 p-2 font-semibold flex-wrap flex-col flex justify-center items-center w-fit h-fit bg-(--vp-c-bg-soft) rounded-md border border-(--vp-c-text-3)/40 fixed bottom-2 right-2 z-15;

        &.dark-mode {
            /* @apply bg-zinc-800; */
        }

        .header-wrap {
            @apply w-full gap-2 bg-red-500/0 flex-row flex items-center justify-start;
        }

        .content-wrap {
            @apply relative bottom-1 text-(--vp-c-text-2) bg-green-600/0 px-2 text-xs w-full gap-2 flex-col flex items-center justify-start;
        }

        .actions-wrap {
            @apply w-full gap-2 flex-row flex items-center justify-end;

            .action-button {
                @apply flex flex-row gap-px items-center w-fit px-2 py-0.75 text-(--vp-c-text-2) text-xs font-semibold hover:bg-blue-500/20 active:bg-blue-500/25 border border-(--vp-c-text-3) hover:border-(--vp-c-text-2) rounded-md cursor-pointer active:scale-95 transition-all;
            }
        }

    }


    .cookie-preferences-dialog {
        @apply max-w-150 max-h-[90%] bg-(--vp-c-bg) border border-(--vp-c-text-2) rounded-md p-4 m-10 z-55 fixed inset-0 self-center justify-self-center overflow-y-auto;

        .dialog-header {
            @apply w-full;
        }

        .dialog-content {
            @apply w-full flex flex-col items-center justify-center gap-2 px-7 p-4;

            .option-wrap {
                @apply w-full flex flex-col gap-0.5 p-2 bg-(--vp-c-text-3)/30 rounded-md;

                .option-title {
                    @apply flex w-fit text-[14px] font-semibold;
                }

                .option-checkbox {
                    @apply inline-flex justify-center items-center size-5.25 rounded-md aspect-square bg-(--vp-c-text-2) hover:bg-(--vp-c-text-2)/85 active:bg-(--vp-c-text-2)/70 cursor-pointer border border-(--vp-c-text-1) transition-all;

                    &.selected {
                        @apply !bg-(--vp-c-brand-3)/75;
                    }
                }
            }
        }

        .dialog-footer {
            @apply w-full flex items-center justify-end;

            .confirm-button {
                @apply flex flex-row gap-px items-center w-fit px-2 py-0.75 text-(--vp-c-text-2) hover:text-(--vp-c-text-1) text-sm font-bold hover:bg-blue-500/20 active:bg-blue-500/25 border border-(--vp-c-text-2) hover:border-(--vp-c-text-1) rounded-md cursor-pointer active:scale-95 transition-all;
            }
        }

    }


    /* Animations */
    .cookie-usage-enter-from,
    .cookie-usage-leave-to {
        opacity: 0;
        transform: translateY(10px);
    }

    .cookie-usage-enter-to,
    .cookie-usage-leave-from {
        opacity: 1;
        transform: translateY(0);
    }

    .cookie-usage-enter-active,
    .cookie-usage-leave-active {
        transition: all 0.33s ease;
    }


    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
        @apply blur-md;
    }

    .fade-enter-to,
    .fade-leave-from {
        opacity: 1;
        @apply blur-none;
    }

    .fade-enter-active,
    .fade-leave-active {
        transition: all 0.33s ease;
    }


    .zoom-enter-from,
    .zoom-leave-to {
        opacity: 0;
        transform: scale(0);
    }

    .zoom-enter-to,
    .zoom-leave-from {
        opacity: 1;
        transform: scale(1);
    }

    .zoom-enter-active,
    .zoom-leave-active {
        transition: all 0.3s ease;
    }




</style>