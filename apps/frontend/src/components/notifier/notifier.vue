<script lang="ts" setup>
    import { externalUrls } from '@/stores/nav';
    import useNotifier from '@/stores/notifier';
    import { XIcon } from 'lucide-vue-next';
    import CookieConsentTemplate from './cookieConsent.vue';
    import { storeToRefs } from 'pinia';

    // Services:
    const notifier = useNotifier()
    const { notifications } = storeToRefs(notifier)

    let levelOpts = ['default', 'upgrade', 'warn', 'error', 'info',]
    // const getRandomLevel = () => opts[Math.floor((opts.length * Math.random()))]
    let cursor = 0;
    let maxCursor = levelOpts.length
    const getRandomLevel = () => {
        let level = levelOpts[cursor]
        let newCursor = cursor + 1
        if (newCursor > maxCursor) {
            newCursor = 0
        }
        cursor = newCursor
        return level
    }
    const getRandomActions = () => {
        let count = Math.floor(Math.random() * 3) // random 0-2

        let r = []
        for (let i = 0; i < count; i++) {
            r.push(
                {
                    button: {
                        title: 'Example',
                        class: 'bg-emerald-500/70! hover:bg-emerald-500/50! text-white!',
                        icon: 'material-symbols:check'
                    },
                    onClick(e: Event, ctx: any) {
                        ctx.close()
                    }
                }
            )
        }
        return r
    }


    // Testing:
    let intervalId = ref<NodeJS.Timeout>()
    let sendTestNotifs = true;
    onMounted(() => {
        // Send Cookie Prompt:
        if (!sendTestNotifs) return
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

        intervalId.value = setInterval(() => {

            // send random test notification:
            notifier.send({
                header: 'Notification!',
                content: 'Example content!',
                level: getRandomLevel() as any,
                actions: getRandomActions(),
                duration: 10
            })
        }, 1_500)
    })
    onUnmounted(() => clearInterval(intervalId.value))


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
                    <span class="header-wrap">
                        <span v-if="data.icon != false">
                            <!-- Default Icons -->
                            <span v-if="!data.icon">
                                <Iconify v-if="data.level == 'upgrade'" :icon="'tabler:diamond'"
                                    class="header-icon relative bottom-px" />
                                <Iconify v-else-if="data.level == 'error'" :icon="'ix:error'" class="header-icon" />
                                <Iconify v-else-if="data.level == 'warn'" :icon="'pajamas:warning'" :size="18"
                                    class="pl-0.5 px-px mt-0.25 header-icon" />
                                <Iconify v-else :icon="'mynaui:info-square'" class="header-icon" />
                            </span>

                            <!-- Defined Icons -->
                            <Iconify v-else :icon="data.icon" class="header-icon" />

                        </span>
                        <p class="font-semibold font-rubik text-lg">
                            {{ data.header }}
                        </p>
                    </span>

                    <!-- Close Button -->
                    <Button unstyled @click="notifier.hide(msgId)" class="close-button group/cb">
                        <XIcon class="close-icon group-hover/cb:text-white/70!" />
                    </Button>

                </span>


                <!-- Content - Text / Template -->

                <span class="notification-content-wrap">
                    <component v-if="typeof data?.content != 'string'" :is="data.content" />
                    <span v-else v-html="data?.content || '?'" class="w-full text-start px-px" />
                </span>


                <!-- Actions Row -->
                <span class="notification-action-row" v-if="data.actions?.length || data.level == 'upgrade'">

                    <Button v-for="{ button, onClick } in data.actions"
                        @click="(e) => { let ctx = { close: () => notifier.hide(msgId) }; onClick(e, ctx) }"
                        :class="button.class" unstyled class="action-button">
                        <Iconify v-if="button.icon" :icon="button.icon" :size="18" />
                        <p>
                            {{ button.title }}
                        </p>
                    </Button>

                    <!-- Default Upgrade Level Buttons -->
                    <span v-if="(!data.actions || !data.actions?.length) && data.level == 'upgrade'"
                        class="flex flex-row items-center justify-center gap-2.25 w-fit!">
                        <a :href="externalUrls.discordStore" target="_blank">
                            <Button unstyled class="bg-indigo-500/90! hover:bg-indigo-500/70! action-button">
                                <Iconify icon="grommet-icons:upgrade" :size="17" />
                                <p>
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
        --n-color-info: #0081c9;
        --n-color-upgrade: #6b71c1;
        --n-color-warn: #a6770f;
        --n-color-error: #a13d3f;

        @apply fixed bottom-0 right-0 m-3.5 ml-[45%] gap-2 !w-fit flex-nowrap max-h-screen z-4 flex items-end content-center justify-end flex-col transition-all;
    }

    .notification-card {
        @apply max-w-95 bg-zinc-800 w-full p-2 gap-0 border-2 border-ring rounded-md flex flex-row flex-wrap items-center justify-start transition-all;

        @apply drop-shadow-xl drop-shadow-black/25;

        /* Level Styles */
        &.level-info {
            @apply border-(--n-color-info);

            .header-icon {
                @apply text-(--n-color-info);
            }
        }

        &.level-upgrade {
            @apply border-(--n-color-upgrade);

            .header-icon {
                @apply text-(--n-color-upgrade);
            }
        }

        &.level-warn {
            @apply border-(--n-color-warn);

            .header-icon {
                @apply text-(--n-color-warn);
            }
        }

        &.level-error {
            @apply border-(--n-color-error);

            .header-icon {
                @apply text-(--n-color-error);
            }
        }

    }

    .notification-header {
        @apply flex w-full flex-row gap-1 flex-nowrap items-start justify-between;

        .close-button {
            @apply rounded-md hover:bg-zinc-400/20 transition-all cursor-pointer active:scale-95 !flex !self-start justify-self-end;
        }

        .close-icon {
            @apply p-1 text-white/50 transition-all;
        }

        .header-wrap {
            @apply flex gap-1 items-start justify-center w-fit;
        }

        .header-icon {
            @apply pt-0.5
        }
    }

    .notification-content-wrap {
        @apply w-full flex items-center justify-center wrap-break-word text-sm;
    }

    .notification-action-row {
        @apply w-full flex flex-row items-start justify-center gap-2.25 pt-1.25 pb-0.75 flex-wrap;

        .action-button {
            @apply flex bg-zinc-600 hover:bg-zinc-600/80 items-center justify-center gap-1 p-0.75 px-1.5 rounded-md active:scale-95 transition-all cursor-pointer truncate;

            p {
                @apply text-sm font-bold;
            }

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