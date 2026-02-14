<script lang="ts" setup>
    import useAnalyticsStore from '@/stores/analytics';
    import useNotifier from '@/stores/notifier';
    import CookieInformation from './cookieInformation.vue';


    // Services:
    const analytics = useAnalyticsStore()
    const notifier = useNotifier()

    // Watch for Cookie Alert:
    watch(() => analytics.cookieConsent.showCookieAlert, (visible) => {
        if (visible) {
            notifier.send({
                header: '🍪 Want Cookies?',
                content: CookieInformation,
                icon: false, // 'sidekickicons:cookie-20-solid',
                duration: false,
                close_button: false,
                actions: [
                    {
                        button: {
                            title: 'Accept',
                            class: 'bg-emerald-500/70! hover:bg-emerald-500/50! text-white!',
                            icon: 'material-symbols:check'
                        },
                        onClick(e, ctx) {
                            ctx.close()
                            analytics.cookieConsent.acceptAll()
                        },
                    },
                    {
                        button: {
                            title: 'Manage Preferences',
                            class: 'text-white!',
                            icon: 'oui:nav-manage'
                        },
                        onClick(e, ctx) {
                            ctx.close()
                            analytics.cookieConsent.showManagePreferences = true;
                        },
                    }
                ],
            })
        }
    })

    // Watch for Managing Preferences - Auto Select:
    watch(() => analytics.cookieConsent.showManagePreferences, (visible) => {
        if (visible) {
            analytics.cookiePreferences.analytics = true;
            analytics.cookiePreferences.preferences = true;
            analytics.cookiePreferences.marketing = true;
        }
    })


    // Confirm Choices - Close Dialog:
    async function confirmChoices() {
        analytics.cookieConsent.showManagePreferences = false
        await analytics.cookieConsent.savePreferences()
        await analytics.cookieConsent.applyConsent()
    }

</script>


<template>
    <Dialog :visible="analytics.cookieConsent.showManagePreferences" class="border-2! border-ring! m-7! max-w-95!"
        block-scroll modal>
        <template #container>
            <div class="flex flex-col relative gap-2 p-4 items-start justify-start min-h-fit h-fit overflow-auto">

                <h1 class="font-extrabold w-full text-lg"> 🍪 Cookie Preferences </h1>

                <div class="w-[88%] self-center h-[2px] rounded-full bg-ring" />

                <!-- Necessary Cookies -->
                <div class="flex flex-row flex-nowrap w-full">
                    <!-- Cookie Detail -->
                    <div class="flex flex-wrap flex-col gap-1">
                        <p class="font-bold text-sm"> Necessary <span class="text-xs text-zinc-400 italic"> (Always
                                on) </span> </p>
                        <p class="text-zinc-400 mx-3 text-xs"> Essential for the website to function properly (e.g.
                            remembering your cookie preferences, security, and core features). These cannot be disabled.
                        </p>
                    </div>
                    <!-- Cookie Toggle -->
                    <div class="m-1 ml-3">
                        <ToggleSwitch disabled v-model="analytics.cookiePreferences.necessary" />
                    </div>
                </div>

                <!-- Analytics Cookies -->
                <div class="flex flex-row flex-nowrap w-full">
                    <!-- Cookie Detail -->
                    <div class="flex flex-wrap flex-col gap-1">
                        <p class="font-bold text-sm"> Analytics </p>
                        <p class="text-zinc-400 mx-3 text-xs"> Helps us understand how visitors use our site so we can
                            improve performance and content. (e.g. Google Analytics) </p>
                    </div>
                    <!-- Cookie Toggle -->
                    <div class="m-1 ml-3">
                        <ToggleSwitch v-model="analytics.cookiePreferences.analytics" />
                    </div>
                </div>

                <!-- Preference Cookies -->
                <div class="flex flex-row flex-nowrap w-full">
                    <!-- Cookie Detail -->
                    <div class="flex flex-wrap flex-col gap-1">
                        <p class="font-bold text-sm"> Preferences </p>
                        <p class="text-zinc-400 mx-3 text-xs"> Allows the site to remember your choices (like language,
                            theme, or layout) to give you a more personalized experience. </p>
                    </div>
                    <!-- Cookie Toggle -->
                    <div class="m-1 ml-3">
                        <ToggleSwitch v-model="analytics.cookiePreferences.preferences" />
                    </div>
                </div>

                <!-- Marketing Cookies -->
                <div class="flex flex-row flex-nowrap w-full">
                    <!-- Cookie Detail -->
                    <div class="flex flex-wrap flex-col gap-1">
                        <p class="font-bold text-sm"> Marketing </p>
                        <p class="text-zinc-400 mx-3 text-xs"> Used to deliver relevant ads and measure their
                            effectiveness, often across different websites and apps. </p>
                    </div>
                    <!-- Cookie Toggle -->
                    <div class="m-1 ml-3">
                        <ToggleSwitch v-model="analytics.cookiePreferences.marketing" />
                    </div>
                </div>



                <span class="w-full mt-4 mb-1 flex items-center justify-center flex-wrap h-fit min-h-fit">
                    <Button @click="confirmChoices" unstyled
                        class="bg-indigo-500 py-1.25 px-2 w-[75%] min-w-fit min-h-fit! self-center rounded-md text-xs font-medium cursor-pointer hover:bg-indigo-400 transition-all">
                        <p class="p-1 self-center font-bold"> Save </p>
                    </Button>
                </span>

            </div>
        </template>

    </Dialog>
</template>


<style scoped>

    :deep().p-toggleswitch {
        --p-toggleswitch-checked-background: var(--color-indigo-500);
        --p-toggleswitch-checked-hover-background: var(--color-indigo-400);
    }

    :deep().p-toggleswitch-checked {
        --p-toggleswitch-disabled-background: var(--color-indigo-500)
    }

    .p-toggleswitch {

        &.p-disabled {
            opacity: .5;
        }

    }

</style>