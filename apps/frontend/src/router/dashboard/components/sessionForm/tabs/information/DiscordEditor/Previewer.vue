<script lang="ts" setup>
    import SessionsLogo from '/logo.png'
    import DefaultDiscordIcon from '/discord-grey.png'
    import { DateTime } from 'luxon';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { getDiscordHtml } from '@/utils/discordHtml';

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
        return getDiscordHtml(preProcessedText.value)
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

<style scoped></style>