<script lang="ts" setup>
    import type { PopoverMethods } from 'primevue';
    import Previewer from './Previewer.vue';
    import TabBar, { type TabName } from './TabBar.vue'
    import LinkPopup from './LinkPopup.vue';
    import MentionPopup from './MentionPopup.vue';

    // Incoming Props:
    const props = defineProps<{
        class?: string
    }>()

    // Vars:
    const discordMarkdownDocsUrl = "https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline"

    // Tab View / Bar:
    const selectedTab = ref<TabName>('Editor')

    // Text Input Element:
    const textInputRef = ref<HTMLTextAreaElement>()
    const textInputValue = ref<string>()

    // Editor Restraints:
    const maxCharacters = 350;
    const curCharacters = computed(() => textInputValue.value?.length || 0)


    // Position Cursor: 
    async function positionCursor(start = 0, end = 0) {
        await nextTick(() => {
            textInputRef.value?.focus()
            textInputRef.value?.setSelectionRange(start, end)
        })
    }

    // Format - Inline Styles:
    async function addInlineStyle(prefix: string, suffix = prefix) {
        // Get Text Input & State(s):
        const el = textInputRef.value
        if (!el) return console.warn('No TextArea for formatting function!');
        const selectionStart = el.selectionStart
        const selectionEnd = el.selectionEnd
        const selectedText = el.value.slice(selectionStart, selectionEnd)

        // Check if ALREADY FORMATTED - Undo:
        const exteriorText = el.value.slice(selectionStart - prefix.length, selectionEnd + suffix.length);
        if (exteriorText.startsWith(prefix) && exteriorText.endsWith(suffix)) {
            // REMOVE Formatting
            const before = el.value.slice(0, selectionStart - prefix.length)
            const after = el.value.slice(selectionEnd + suffix.length)
            const removedFormat = exteriorText.slice(prefix.length, exteriorText.length - suffix.length)
            textInputValue.value = before + removedFormat + after;
            // Re-Position Cursor:
            return await positionCursor((selectionStart - prefix.length), (selectionEnd - suffix.length))
        }

        // Get Existing Text from Input:
        const before = el.value.slice(0, selectionStart)
        const after = el.value.slice(selectionEnd)

        // Get & Assign Result Text:
        const newFormatText = prefix + selectedText + suffix;
        const newInputValue = before + newFormatText + after;
        textInputValue.value = newInputValue

        // Reposition Cursor:
        return await positionCursor((selectionStart + prefix.length), (selectionEnd + suffix.length))
    }


    // Format - Line Styles:
    async function addLinedStyle(prefix: string) {
        // Get Text Input & State(s):
        const el = textInputRef.value
        if (!el) return console.warn('No TextArea for formatting function!');
        const selectionStart = el.selectionStart
        const selectionEnd = el.selectionEnd
        const selectedText = el.value.slice(selectionStart, selectionEnd)

        // Get Exterior Text - ALREADY FORMATTED - UNDO:
        const exteriorText = el.value.slice(selectionStart - prefix.length, selectionEnd)
        if (exteriorText.startsWith(prefix)) {
            // REMOVE Formatting
            const before = el.value.slice(0, selectionStart - prefix.length)
            const after = el.value.slice(selectionEnd)
            const removedFormat = exteriorText.slice(prefix.length)
            textInputValue.value = before + removedFormat + after;
            // Reposition Cursor:
            return await positionCursor((selectionStart - prefix.length), (selectionStart - prefix.length))
        }

        // Get Existing Text from Input:
        const before = el.value.slice(0, selectionStart)
        const after = el.value.slice(selectionEnd)

        // Get & Assign Result Text:
        const lastChar = before?.at(-1)
        const trimmedLast = before.trim().at(-1)
        const newLine = () => {
            if (lastChar == '') return '';
            if (lastChar == '\n') return '';
            if (!lastChar) return ''
            return '\n'
        }
        const newText = newLine() + prefix + selectedText
        textInputValue.value = before + newText + after

        // Reposition Cursor:
        return await positionCursor((selectionStart + newText.length), (selectionStart + newText.length))
    }


    // Format - Popup:
    const formatPopup = ref<PopoverMethods>()
    type FormatPopup = 'link' | 'mention'
    const popupOption = ref<FormatPopup>('link')
    const popupSelection = ref<string>()
    async function showFormatPopup(e: Event, format: FormatPopup) {
        // Initially hide (if already open) & set selection text as value:
        formatPopup.value?.hide()
        popupSelection.value = textInputValue.value?.slice(textInputRef.value?.selectionStart, textInputRef.value?.selectionEnd)
        // Open popup with selection:
        await nextTick(() => {
            popupOption.value = format;
            formatPopup.value?.show(e)
        })

    }


    // Format - Text Insert (link/mention):
    async function addTextBlock(text: string, atPos?: number) {
        // Get Text Input & State(s):
        const el = textInputRef.value
        if (!el) return console.warn('No TextArea for formatting function!');
        const selectionStart = el.selectionStart
        const selectionEnd = el.selectionEnd
        const selectedText = el.value.slice(selectionStart, selectionEnd)


        // Get Existing Text from Input:
        const before = el.value.slice(0, selectionStart)
        const after = el.value.slice(selectionEnd)

        // Get & Assign NEW Text Value:
        textInputValue.value = before + text + after
    }


</script>


<template>

    <!-- Editor Wrap -->
    <div class="editor-wrap" :class="props.class">

        <!-- Tabbar -->
        <TabBar v-model:selected-tab="selectedTab" />

        <!-- Editor -->
        <span v-if="selectedTab == 'Editor'"
            class="flex-col flex justify-between items-center flex-wrap w-full h-full grow">

            <!-- Toolbar -->
            <div class="editor-toolbar">

                <!-- Formation - Section 1 -->
                <section class="toolbar-section">
                    <!-- Bold -->
                    <Button title="Bold" @click="addInlineStyle('**')" unstyled class="toolbar-button">
                        <Iconify icon="wordpress:format-bold" />
                    </Button>
                    <!-- Italic -->
                    <Button title="Italic" @click="addInlineStyle('*')" unstyled class="toolbar-button">
                        <Iconify icon="wordpress:format-italic" />
                    </Button>
                    <!-- Underline -->
                    <Button title="Underline" @click="addInlineStyle('__')" unstyled class="toolbar-button">
                        <Iconify icon="wordpress:format-underline" />
                    </Button>
                    <!-- Heading 1 -->
                    <Button title="Heading 1" @click="addLinedStyle('# ')" unstyled class="toolbar-button">
                        <Iconify icon="wordpress:heading-level-1" />
                    </Button>
                    <!-- Heading 2 -->
                    <Button title="Heading 2" @click="addLinedStyle('## ')" unstyled class="toolbar-button">
                        <Iconify icon="wordpress:heading-level-2" />
                    </Button>
                    <!-- Heading 3 -->
                    <Button title="Heading 3" @click="addLinedStyle('### ')" unstyled class="toolbar-button">
                        <Iconify icon="wordpress:heading-level-3" />
                    </Button>
                    <!-- Heading 4 -->
                    <Button title="Heading 4" @click="addLinedStyle('-# ')" unstyled class="toolbar-button">
                        <Iconify class="opacity-60 scale-80" icon="wordpress:heading-level-4" />
                    </Button>
                    <!-- List -->
                    <Button title="List" @click="addLinedStyle('- ')" unstyled class="toolbar-button">
                        <Iconify icon="wordpress:format-list-bullets" />
                    </Button>
                </section>

                <!-- Formation - Section 2 -->
                <section class="toolbar-section">
                    <!-- Mention -->
                    <Button title="Mention" @click="(e) => showFormatPopup(e, 'mention')" unstyled
                        class="toolbar-button">
                        <Iconify class="scale-95" icon="fluent:mention-32-filled" />
                    </Button>
                    <!-- Link -->
                    <Button title="Link" @click="(e) => showFormatPopup(e, 'link')" unstyled class="toolbar-button">
                        <Iconify icon="material-symbols:link-rounded" />
                    </Button>
                    <!-- Quote -->
                    <Button title="Quote" @click="addLinedStyle('> ')" unstyled class="toolbar-button">
                        <Iconify icon="ri:chat-quote-line" />
                    </Button>
                    <!-- Code -->
                    <Button title="Code" @click="addInlineStyle('`', '`')" unstyled class="toolbar-button">
                        <Iconify icon="material-symbols:code" />
                    </Button>

                </section>

                <!-- Link / Mention Popup -->
                <Popover ref="formatPopup" class="max-w-70 break-all flex-wrap">
                    <LinkPopup v-if="popupOption == 'link'" :popupSelection
                        @add-link="(l) => { addTextBlock(l); formatPopup?.hide() }" />
                    <MentionPopup v-else-if="popupOption == 'mention'" :popupSelection
                        @add-mention="(m) => { addTextBlock(m); formatPopup?.hide() }" />
                </Popover>

            </div>

            <!-- Text Editor/Input -->
            <textarea invalid ref="textInputRef" v-model="textInputValue" class="editor-textInput"
                :maxlength="maxCharacters" />

        </span>

        <!-- Previewer -->
        <span v-else-if="selectedTab == 'Preview'"
            class="flex-col flex justify-center items-center flex-wrap w-full h-fit">
            <Previewer :text-value="textInputValue" />
        </span>

        <!-- Editor Footer -->
        <div class="editor-footer">

            <!-- Discord Markdown - Icon/Link -->
            <a :href="discordMarkdownDocsUrl" target="_blank"
                class="gap-0.75 p-0.5 text-white/40 group/dm flex items-center justify-center w-fit h-full transition-all">
                <DiscordIcon class="size-4  group-hover/dm:text-indigo-400! transition-all" />
                <p
                    class="font-extrabold text-xs group-hover/dm:text-indigo-400! relative top-px uppercase truncate transition-all">
                    Markdown
                </p>
            </a>

            <!-- Character Count -->
            <p class="text-white/50 p-0.5 font-semibold text-xs uppercase italic w-full text-end" :class="{
                'text-amber-500!': (curCharacters / maxCharacters) > 0.75,
                'text-red-400!': (curCharacters / maxCharacters) > 0.95,
            }">
                {{ curCharacters }}/{{ maxCharacters }}
            </p>
        </div>

    </div>

</template>


<style scoped>
    @reference "@/styles/main.css";

    .editor-wrap {
        /* Style Variables */
        --borderColor: var(--color-zinc-600);
        --hoverBorderColor: var(--color-indigo-300);
        --activeBorderColor: var(--color-indigo-400);
        --invalidBorderColor: var(--color-red-400);
        --accentBackground: color-mix(in oklab, var(--color-surface), black 12%);

        /* Editor Wrap Root Styles */
        @apply relative resize overflow-auto !min-w-60 !min-h-50 flex flex-col flex-nowrap items-center justify-between bg-surface border-2 border-(--borderColor) rounded-md transition-colors;

        /* Toolbar Styles */
        .editor-toolbar {

            @apply gap-3.5 p-1.5 w-full min-w-full h-fit flex flex-row items-center justify-between flex-wrap content-center border-b-2 border-(--borderColor) bg-(--accent-background) transition-colors;

            .toolbar-section {
                @apply gap-1.25 flex items-center justify-start flex-wrap;
            }

            .toolbar-button {
                @apply p-0.5 rounded bg-zinc-400/22 hover:bg-ring active:bg-ring/80 active:scale-95 aspect-square transition-all cursor-pointer flex items-center justify-center content-center;
            }

        }


        /* Text Input Styles */
        .editor-textInput {
            @apply bg-white/3 p-1.5 resize-none w-full flex grow outline-none;
        }

        /* Footer Styles */
        .editor-footer {
            @apply gap-1 p-0.5 pr-2.5 border-t-2 border-(--borderColor) w-full h-fit flex flex-row items-center justify-between content-center bg-(--accent-background) transition-colors;
        }

    }

    /* Hover Styles */
    .editor-wrap:has(.editor-textInput:hover) {

        border-color: var(--hoverBorderColor);

        .editor-toolbar,
        .editor-tab-bar,
        .editor-footer {
            border-color: var(--hoverBorderColor);
        }
    }

    /* Active Styles */
    .editor-wrap:has(.editor-textInput:focus),
    .editor-wrap:has(.editor-textInput:focus-visible) {

        border-color: var(--activeBorderColor);

        .editor-toolbar,
        .editor-tab-bar,
        .editor-footer {
            border-color: var(--activeBorderColor);
        }
    }

    /* Invalid Styles */
    .editor-wrap:has(.editor-textInput:invalid),
    .editor-wrap.invalid {

        border-color: var(--invalidBorderColor) !important;

        .editor-toolbar,
        .editor-tab-bar,
        .editor-footer {
            border-color: var(--invalidBorderColor) !important;
        }
    }


</style>