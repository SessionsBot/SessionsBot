<script lang="ts" setup>
    import { externalUrls } from '@/stores/nav';
    import useNotifier from '@/stores/notifier';
    import { XIcon } from 'lucide-vue-next';
    import CookieConsentTemplate from './cookieConsent.vue';
    import { storeToRefs } from 'pinia';

    // Services:
    const notifier = useNotifier()
    const router = useRouter()
    const { notifications } = storeToRefs(notifier)

    let opts = ['upgrade', 'default', 'warn', 'error', 'info',]
    const getRandomLevel = () => opts[Math.floor((opts.length * Math.random()))]

    // Testing:
    // let intervalId = ref<NodeJS.Timeout>()
    onMounted(() => {
        // Send Cookie Prompt:
        notifier.send({
            header: 'Want Cookies?',
            content: CookieConsentTemplate,
            icon: 'sidekickicons:cookie-20-solid',
            duration: false,
            actions: [
                {
                    button: {
                        title: 'Accept',
                        class: 'bg-emerald-500/70! hover:bg-emerald-500/50! text-white!',
                        icon: 'material-symbols:check'
                    },
                    onClick(e, ctx) {
                        ctx.close()
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
                    },
                }
            ],
        })
    })
    // onUnmounted(() => )


</script>


<template>
    <!-- Notification(s) Wrap -->
    <div class="notifier-app-container">



        <TransitionGroup name="notification" type="transition">
            <!-- Notification Card -->
            <div v-for="[msgId, data] in notifications" :key="msgId" class="notification-card" :class="{
                'level-info': data.level == 'info',
                'level-upgrade': data.level == 'upgrade',
                'level-warn': data.level == 'warn',
                'level-error': data.level == 'error'
            }">

                <!-- Header -->
                <span class="notification-header">

                    <!-- Header & Icon -->
                    <span class="flex gap-1 items-center justify-center w-fit">
                        <span v-if="data.icon != false">
                            <Iconify v-if="data.level == 'upgrade'" :icon="data?.icon || 'tabler:diamond'" />
                            <Iconify v-else-if="data.level == 'error'" :icon="data?.icon || 'ix:error'" />
                            <Iconify v-else-if="data.level == 'warn'" :icon="data?.icon || 'pajamas:warning'" :size="18"
                                class="pl-0.5 px-px" />
                            <Iconify v-else :icon="data?.icon || 'mynaui:info-square'" />
                        </span>
                        <p class="font-semibold font-rubik">
                            {{ data.header }}
                        </p>
                    </span>

                    <!-- Close Button -->
                    <Button unstyled @click="notifier.hide(msgId)" class="close-button group/cb">
                        <XIcon class="close-icon group-hover/cb:text-white/70!" />
                    </Button>

                </span>


                <!-- Content - Text / Template -->
                <component v-if="typeof data?.content != 'string'" :is="data.content" />
                <span v-else class="notification-content-wrap">

                    <span class="w-full text-start">
                        {{ data?.content || '?' }}
                    </span>

                </span>


                <!-- Actions Row -->
                <span class="notification-action-row" v-if="data.actions?.length || data.level == 'upgrade'">

                    <Button v-for="{ button, onClick } in data.actions"
                        @click="(e) => { let ctx = { close: () => notifier.hide(msgId) }; onClick(e, ctx) }"
                        :class="button.class" unstyled class="action-button">
                        <Iconify v-if="button.icon" :icon="button.icon" :size="18" />
                        <p class="font-bold text-sm">
                            {{ button.title }}
                        </p>
                    </Button>

                    <!-- Default Upgrade Level Buttons -->
                    <span v-if="(!data.actions || !data.actions?.length) && data.level == 'upgrade'"
                        class="flex flex-row items-center justify-center gap-2.25 w-fit!">
                        <a :href="externalUrls.discordStore" target="_blank">
                            <Button unstyled class="bg-indigo-500! hover:bg-indigo-500/80! action-button">
                                <Iconify icon="grommet-icons:upgrade" :size="16" />
                                <p class="font-bold text-sm">
                                    Upgrade Now!
                                </p>
                            </Button>
                        </a>
                    </span>

                </span>

            </div>
        </TransitionGroup>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .notifier-app-container {
        @apply fixed bottom-0 right-0 p-3.5 pl-[45%] gap-2 w-fit max-h-screen z-4 flex items-end content-center justify-end flex-col transition-all;
    }

    .notification-card {
        @apply max-w-95 bg-zinc-800 !w-fit p-2 gap-2 border-2 border-zinc-400 rounded-md flex flex-row flex-wrap items-center justify-start transition-all;

        &.level-info {
            @apply border-sky-500;
        }

        &.level-upgrade {
            @apply border-indigo-400;
        }

        &.level-warn {
            @apply border-amber-400;
        }

        &.level-error {
            @apply border-red-400;
        }

    }

    .notification-header {
        @apply flex w-full flex-row gap-1 flex-nowrap items-start justify-between;

        .close-button {
            @apply rounded-md hover:bg-zinc-400/20 transition-all cursor-pointer active:scale-95 !flex !self-end justify-self-end;
        }

        .close-icon {
            @apply p-1 text-white/50 transition-all;
        }
    }

    .notification-content-wrap {
        @apply w-full flex items-center justify-center wrap-break-word;
    }

    .notification-action-row {
        @apply w-full flex flex-row items-start justify-center gap-2.25 flex-wrap;

        .action-button {
            @apply flex bg-zinc-600 hover:bg-zinc-600/80 items-center justify-center gap-1 p-1 px-1.5 rounded-md active:scale-95 transition-all cursor-pointer truncate;
        }

    }

    /* Notification Slide Transition */
    .notification-enter-active,
    .notification-leave-active {
        transition: all .33s ease;
    }

    .notification-enter-from {
        opacity: 0;
        transform: translateX(50px);
    }

    .notification-leave-to {
        opacity: 0;
        transform: translateX(50px);
    }

</style>