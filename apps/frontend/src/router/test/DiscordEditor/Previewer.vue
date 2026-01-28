<script lang="ts" setup>
    import SessionsLogo from '/logo.png'
    import DefaultDiscordIcon from '/discord-grey.png'
    import { toHTML } from '@odiffey/discord-markdown'
    import { DateTime } from 'luxon';

    // Incoming Props:
    const props = defineProps<{
        textValue: string | undefined
    }>()

    // Render Markdown:
    const renderedMarkdown = computed(() => {
        if (!props.textValue?.trim()?.length) return null

        return toHTML(props.textValue, {
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
            }
        })
    })

</script>


<template>
    <div class="p-3 pb-5 flex flex-row gap-1.5 justify-start items-start w-full h-full bg-(--accentBackground)!">

        <!-- Example User Icon -->
        <img :src="SessionsLogo || DefaultDiscordIcon" class="size-9 rounded-full ring-ring ring" />

        <!-- Example User Message Wrap -->
        <div class="flex items-center justify-start flex-col gap-0.5 w-full">
            <!-- Example Username -->
            <p class="w-full text-start font-semibold pb-0.5"> Sessions Bot </p>
            <!-- Rendered Preview -->
            <div v-if="renderedMarkdown" v-html="renderedMarkdown" class="discord-preview"> </div>
            <div v-else class="discord-preview">
                <p class="opacity-45">
                    Enter a message <b class="underline">in the editor</b>...
                </p>
            </div>
        </div>

    </div>
</template>


<style>

    @reference "@/styles/main.css";

    .discord-preview {

        @apply bg-white/7 ring ring-ring p-2 rounded-md w-full;

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