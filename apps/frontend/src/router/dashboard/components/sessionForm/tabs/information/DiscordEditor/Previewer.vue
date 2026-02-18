<script lang="ts" setup>
    import SessionsLogo from '/logo.png'
    import DefaultDiscordIcon from '/discord-grey.png'
    import { toHTML } from '@odiffey/discord-markdown'
    import { DateTime } from 'luxon';
    import useDashboardStore from '@/stores/dashboard/dashboard';

    // Services:
    const dashboard = useDashboardStore();


    // Incoming Props:
    const props = defineProps<{
        textValue: string | undefined
    }>()

    // Outgoing Emits:
    const emits = defineEmits<{
        switchToEditor: []
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
    <div class="p-3 relative rounded-md flex flex-row gap-1.5 justify-start items-stretch! w-full h-fit ">

        <!-- Example User Icon -->
        <div hidden class="w-fit min-w-fit h-full relative min-h-full flex flex-col">
            <img :src="SessionsLogo || DefaultDiscordIcon" class="size-9 m-px rounded-full" />
        </div>


        <!-- Example User Message Wrap -->
        <div class="flex relative items-center justify-start flex-col gap-0.5 h-fit">
            <!-- Example Username -->
            <p hidden class="w-full text-start font-bold pb-0.5"> Sessions Bot </p>
            <!-- Rendered Preview -->
            <div v-if="renderedMarkdown" v-html="renderedMarkdown" class="discord-preview" />

            <div v-else class="discord-preview">
                <p class="opacity-45">
                    Enter a message <b @click="emits('switchToEditor')" class="underline cursor-pointer">in the
                        editor</b>...
                </p>
            </div>

        </div>

    </div>
</template>

<style scoped>

    @reference "@/styles/main.css";

    .discord-preview-styles-old {

        @apply bg-transparent/65 p-2 font-normal rounded-md w-full;

        strong {
            font-weight: 800 !important;
        }

        h1 {
            @apply font-bold text-3xl;
        }

        h2 {
            @apply font-bold text-2xl;
        }

        h3 {
            @apply font-bold text-xl;
        }

        small {
            @apply font-bold opacity-70;
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
            @apply text-link/55;
            text-decoration: underline !important;
        }

        code {
            @apply !bg-black/40 !p-1 !py-0.5 !rounded text-white/80 text-sm;
        }

        pre {
            @apply !w-full !h-fit;

            code {
                @apply !bg-black/40 !p-1 !py-0.5 !rounded !min-w-full flex text-white/80 text-sm;
            }
        }

        blockquote {
            @apply pl-6 !bg-text-1/14 w-full !py-2 !mt-2.5 mb-1.5 px-1 relative font-semibold !text-text-1/80 rounded-md;

            &::after {
                z-index: 1;
                content: '';
                @apply !bg-text-1/40 h-[70%] w-1 rounded-full absolute left-2 top-[15%];
            }
        }

        .d-mention,
        .d-slash {
            @apply bg-link/50 hover:bg-link/65 px-0.75 py-0.25 rounded text-sm font-bold break-all cursor-pointer;
        }

        .d-timestamp {
            @apply bg-black/15 px-1 py-0.5 rounded text-sm font-semibold break-all;
        }

    }

</style>