<script lang="ts" setup>
    import SessionsLogo from '/logo.png'
    import DefaultDiscordIcon from '/discord-grey.png'
    import { toHTML } from '@odiffey/discord-markdown'
    import { DateTime } from 'luxon';
    import { BotIcon, Check } from 'lucide-vue-next';
    import useDashboardStore from '@/stores/dashboard/dashboard';

    // Services:
    const dashboard = useDashboardStore();


    // Incoming Props:
    const props = defineProps<{
        textValue: string | undefined
        threadTitle: string | undefined
    }>()

    // Pre - Process - Variable Text(s):
    const variableMap = {
        '%server_name%': dashboard.userGuildData?.name || 'Server Name?',
        '%day_sm%': DateTime.now().month + '/' + DateTime.now().day,
        '%day_md%': DateTime.now().toFormat('M/d/yy'),
        '%day_lg%': DateTime.now().toFormat('DD'),
    }


    function processText(text: string) {
        const keys = Object.keys(variableMap)
        // check for & replace variable keys:
        let r = text
        for (const key of keys) {
            const searchExp = new RegExp(`${key}`, 'g')
            // @ts-expect-error
            const replaceVal = variableMap[key] as string
            r = r?.replace(searchExp, replaceVal)
        }
        return r
    }

    const preProcessedText = computed(() => {
        if (!props.textValue?.trim()?.length) return ''
        return processText(props.textValue)
    })


    // Render Markdown:
    const renderedMarkdown = computed(() => {
        if (!preProcessedText.value?.length) return null

        return toHTML(preProcessedText.value, {
            embed: true,
            discordOnly: false,
            discordCallback: {
                role(node) {
                    return `&Role`
                },
                channel(node) {
                    return `#Channel`
                },
                user(node) {
                    return `@User`
                },
                timestamp(node) {
                    if (!isNaN(node.timestamp)) {
                        if (node.style == 'R') {
                            return DateTime.fromSeconds(Number(node.timestamp)).toRelative() ?? "TIMESTAMP"
                        }
                        const styleToken = () => {
                            if (node.style == 't') return 't'
                            else if (node.style == 'T') return 'tt'
                            else if (node.style == 'd') return 'D'
                            else if (node.style == 'D') return 'DDD'
                            else if (node.style == 'f') return `DDD 'at' t`
                            else if (node.style == 'F') return `DDD 'at' t`
                            else return 'f'
                        }
                        return DateTime.fromSeconds(Number(node.timestamp)).toFormat(styleToken())
                    } else return "TIMESTAMP"

                },
                slash(node) {
                    return '/command'
                }
            },
        })
    })

</script>


<template>
    <div
        class="p-3 pb-5 bg-black/20! shadow-md shadow-black/30 relative rounded-md flex flex-row gap-1.5 justify-start items-stretch! w-full h-fit ">

        <!-- Example User Icon -->
        <div class="w-fit min-w-fit h-full relative min-h-full flex flex-col">
            <img :src="SessionsLogo || DefaultDiscordIcon" class="size-9 m-px rounded-full" />


        </div>

        <span class="absolute w-0.75 h-[62.5%] top-[15%] left-7.5 -z-1 bg-ring rounded-full">
            <span class="absolute size-5 bg-ring bottom-0 w-6.5 h-0.75 rounded-full" />
        </span>

        <!-- Example User Message Wrap -->
        <div class="flex relative items-center justify-start flex-col gap-0.5 h-fit">
            <!-- Example Username -->
            <p class="w-full text-start font-bold pb-0.5"> Sessions Bot </p>
            <!-- Rendered Preview -->
            <div v-if="renderedMarkdown" v-html="renderedMarkdown" class="discord-preview"> </div>
            <div v-else class="discord-preview">
                <p class="opacity-45">
                    Enter a message <b class="underline">in the editor</b>...
                </p>
            </div>

            <!-- Attached Thread - Message Contents -->
            <div class="flex flex-col font-bold text-sm w-full gap-1 mt-1.5 rounded-md discord-preview">

                <span class="flex flexc-row gap-1.75 items-center ">
                    <p class="opacity-65"> {{ processText(props.threadTitle || '?')?.replace(/#/g, '') }} </p>

                    <p class="text-sky-600 underline  text-sm"> 1 Message › </p>
                </span>

                <span>
                    <!-- Bot App Icon & Name -->
                    <div class="flex gap-1 items-center justify-start flex-wrap">

                        <img :src="SessionsLogo" class="aspect-square size-5 min-w-fit rounded-full" />

                        <span
                            class="flex text-xs items-center justify-center gap-px px-1.25 py-0.5 bg-indigo-500/70 rounded">
                            <Check :size="12" :stroke-width="5" />
                            APP
                        </span>


                        <span class="flex grow items-center justify-between font-medium flex-wrap">
                            <p class="opacity-50">
                                Sessions
                            </p>
                            <p class="italic">
                                Click to see message
                            </p>
                            <p class="opacity-50">
                                1m ago
                            </p>
                        </span>

                    </div>
                </span>

            </div>

        </div>

    </div>
</template>


<style>

    @reference "@/styles/main.css";


    .discord-preview {

        @apply bg-white/7 border border-zinc-500 p-2 rounded-md w-full shadow-md shadow-black/10;

        strong {
            font-weight: 800 !important;
        }

        h1 {
            @apply font-bold text-3xl
        }

        h2 {
            @apply font-bold text-2xl
        }

        h3 {
            @apply font-bold text-xl
        }

        small {
            @apply font-bold opacity-70
        }

        li {
            margin-left: 14px;
            list-style: disc;

            li {
                margin-left: 10px;
                list-style: circle;
            }
        }

        a {
            color: var(--color-sky-600) !important;
            text-decoration: underline !important;
        }

        code {
            @apply !bg-black/40 !p-1 !py-0.5 !rounded text-white/80 text-sm
        }

        pre {
            @apply !w-full !h-fit;

            code {
                @apply !bg-black/40 !p-1 !py-0.5 !rounded !min-w-full flex text-white/80 text-sm
            }
        }

        blockquote {
            @apply pl-6 bg-white/7 w-full py-3 px-1 relative font-semibold text-white/80 rounded-md;

            &::after {
                z-index: 1;
                content: '';
                @apply bg-white/40 h-[70%] w-1 rounded-full absolute left-2 top-[15%]
            }
        }

        .d-mention, .d-slash {
            @apply bg-[#005473] hover:bg-[#005473]/75 px-0.75 py-0.25 rounded text-sm font-bold break-all cursor-pointer;
        }

        .d-timestamp {
            @apply bg-black/15 px-1 py-0.5 rounded text-sm font-semibold break-all;
        }

    }

</style>