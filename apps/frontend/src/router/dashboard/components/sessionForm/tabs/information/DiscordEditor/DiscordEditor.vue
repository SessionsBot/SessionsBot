<script lang="ts" setup>
    import type { PopoverMethods } from 'primevue';
    import Previewer from './Previewer.vue';
    import TabBar, { type TabName } from './TabBar.vue'
    import LinkPopup from './LinkPopup.vue';
    import MentionPopup from './MentionPopup.vue';

    // Auto Size - Text Area:

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
    const textInputValue = defineModel<string>('textInputValue')


    // Editor Restraints:
    const maxCharacters = 225;
    const curCharacters = computed(() => textInputValue.value?.length || 0)

    // Position Cursor: 
    async function positionCursor(start = 0, end = 0) {
        await nextTick(() => {
            textInputRef.value?.focus()
            textInputRef.value?.setSelectionRange(start, end)
            emits('focusOut')
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



    // Watch - Text Value - Emit Value Change:
    watch(textInputValue, (v) => {
        emits('valueChange', v)
    })

    // Fn - On Input Focus Out:
    function onInputFocusOut() {
        emits('focusOut')
    }

    // Emits:
    const emits = defineEmits<{
        valueChange: [value: any],
        focusOut: []
    }>()


</script>


<template>

    <!-- Editor Wrap -->
    <div class="editor-wrap" :class="props.class">

        <!-- Tabbar -->
        <TabBar hidden v-model:selected-tab="selectedTab" />
        <Transition name="fade" leave-active-class="absolute!">

            <!-- Editor -->
            <span v-if="selectedTab == 'Editor'"
                class="flex-col bg-bg-2 flex justify-between items-center flex-wrap w-full h-full grow">

                <!-- Toolbar -->
                <div class="editor-toolbar">

                    <!-- Formation - Section 1 -->
                    <section class="toolbar-section">
                        <!-- Bold -->
                        <Button title="Bold" @click="addInlineStyle('**')" unstyled class="toolbar-button">
                            <Iconify icon="wordpress:format-bold" size="20" />
                        </Button>
                        <!-- Italic -->
                        <Button title="Italic" @click="addInlineStyle('*')" unstyled class="toolbar-button">
                            <Iconify icon="wordpress:format-italic" size="20" />
                        </Button>
                        <!-- Underline -->
                        <Button title="Underline" @click="addInlineStyle('__')" unstyled class="toolbar-button">
                            <Iconify icon="wordpress:format-underline" size="20" />
                        </Button>
                        <!-- Heading 1 -->
                        <Button title="Heading 1" @click="addLinedStyle('# ')" unstyled class="toolbar-button">
                            <Iconify icon="wordpress:heading-level-1" size="20" />
                        </Button>
                        <!-- Heading 2 -->
                        <Button title="Heading 2" @click="addLinedStyle('## ')" unstyled class="toolbar-button">
                            <Iconify icon="wordpress:heading-level-2" size="20" />
                        </Button>
                        <!-- Heading 3 -->
                        <Button title="Heading 3" @click="addLinedStyle('### ')" unstyled class="toolbar-button">
                            <Iconify icon="wordpress:heading-level-3" size="20" />
                        </Button>
                        <!-- Heading 4 -->
                        <Button title="Heading 4" @click="addLinedStyle('-# ')" unstyled class="toolbar-button">
                            <Iconify class="opacity-60 scale-80" icon="wordpress:heading-level-4" size="20" />
                        </Button>
                        <!-- List -->
                        <Button title="List" @click="addLinedStyle('- ')" unstyled class="toolbar-button">
                            <Iconify icon="wordpress:format-list-bullets" size="20" />
                        </Button>
                    </section>

                    <!-- Formation - Section 2 -->
                    <section class="toolbar-section">
                        <!-- Mention -->
                        <Button title="Mention" @click="(e) => showFormatPopup(e, 'mention')" unstyled
                            class="toolbar-button">
                            <Iconify class="scale-95" icon="fluent:mention-32-filled" size="20" />
                        </Button>
                        <!-- Link -->
                        <Button title="Link" @click="(e) => showFormatPopup(e, 'link')" unstyled class="toolbar-button">
                            <Iconify icon="material-symbols:link-rounded" size="20" />
                        </Button>
                        <!-- Quote -->
                        <Button title="Quote" @click="addLinedStyle('> ')" unstyled class="toolbar-button">
                            <Iconify icon="ri:chat-quote-line" size="20" />
                        </Button>
                        <!-- Code -->
                        <Button title="Code" @click="addInlineStyle('`', '`')" unstyled class="toolbar-button">
                            <Iconify icon="material-symbols:code" size="20" />
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
                    :maxlength="maxCharacters" @focusout="onInputFocusOut" />

            </span>

            <!-- Previewer -->
            <span v-else-if="selectedTab == 'Preview'" class="editor-preview">
                <Previewer :text-value="textInputValue" @switch-to-editor="selectedTab = 'Editor'" />
            </span>
        </Transition>

        <!-- Editor Footer -->
        <div class="editor-footer">

            <!-- Tab Switcher -->
            <div class="flex flex-row gap-1 p-0.75">

                <!-- Edit Button -->
                <Button unstyled @click="selectedTab = 'Editor'" :class="{ 'opacity-55': selectedTab != 'Editor' }"
                    class="bg-ring-soft/60 hover:bg-ring-soft/65 border border-ring-soft hover:opacity-80 gap-0.75 p-px px-1 rounded! button-base flex! flex-row! flex-nowrap! h-fit ">
                    <Iconify icon="mdi:pencil" size="14" />
                    <p class="text-xs font-semibold"> Edit </p>
                </Button>

                <!-- Preview Button -->
                <Button unstyled @click="selectedTab = 'Preview'" :class="{ 'opacity-55': selectedTab != 'Preview' }"
                    class="bg-ring-soft/60 hover:bg-ring-soft/65 border border-ring-soft hover:opacity-80 gap-0.75 p-px px-1 rounded! button-base flex! flex-row! flex-nowrap! h-fit ">
                    <Iconify icon="mdi:eye" size="14" />
                    <p class="text-xs font-semibold"> Preview </p>
                </Button>

            </div>

            <!-- Character Count / Markdown Help -->
            <Transition name="fade">
                <!-- Discord Markdown - Icon/Link -->
                <a v-if="selectedTab == 'Preview'" :href="discordMarkdownDocsUrl" target="_blank"
                    class="gap-0.75 p-0.5 text-text-1/40 group/dm flex items-center justify-center w-fit h-full transition-all">
                    <DiscordIcon class="size-4  group-hover/dm:text-brand-2/90! transition-all" />
                    <p
                        class="font-extrabold text-xs group-hover/dm:text-brand-2/90! relative top-px uppercase truncate transition-all">
                        Markdown
                    </p>
                </a>

                <!-- Character Count -->
                <p v-else-if="selectedTab == 'Editor'"
                    class="text-text-1/50 p-0.5 font-semibold text-xs uppercase italic w-full text-end" :class="{
                        'text-amber-400/50!': (curCharacters / maxCharacters) > 0.75,
                        'text-invalid-1/80!': (curCharacters / maxCharacters) > 0.95,
                    }">
                    {{ curCharacters }}/{{ maxCharacters }}
                </p>
            </Transition>
        </div>

    </div>

</template>


<style scoped>
    @reference "@/styles/main.css";

    .editor-wrap {
        /* Style Variables */
        --borderColor: var(--color-ring-soft);
        --hoverBorderColor: var(--color-indigo-300);
        --activeBorderColor: var(--color-indigo-400);
        --invalidBorderColor: var(--color-red-400);
        --accentBackground: var(--color-bg-soft);
        /* --accentBackground: color-mix(in oklab, var(--color-surface), black 12%); */

        /* Editor Wrap Root Styles */
        @apply relative !min-w-60 !w-full max-w-120 flex flex-col flex-nowrap items-center justify-between bg-bg-3/80 border-2 border-(--borderColor) rounded-md overflow-clip transition-colors;

        /* Toolbar Styles */
        .editor-toolbar {

            @apply bg-bg-3/50 gap-2.5 p-1.5 w-full min-w-full h-fit flex flex-row items-center justify-between flex-wrap content-center border-b-2 border-(--borderColor) transition-colors;

            .toolbar-section {
                @apply gap-1.25 flex items-center justify-start flex-wrap;
            }

            .toolbar-button {
                @apply p-0.5 rounded bg-ring-soft/80 hover:bg-ring-soft/65 active:bg-ring-soft/64 active:scale-95 aspect-square transition-all cursor-pointer flex items-center justify-center content-center;
            }

        }


        .editor-preview {
            background: color-mix(in oklab, var(--c-bg-2), black 12%);
            @apply flex-col flex justify-center items-center flex-wrap w-full h-full grow;
        }

        /* Text Input Styles */
        .editor-textInput {
            background: color-mix(in oklab, var(--c-bg-2), black 12%);
            @apply p-1.5 min-h-11 max-h-55 resize-y w-full flex grow outline-none overflow-y-auto wrap-break-word;
        }

        /* Footer Styles */
        .editor-footer {
            @apply gap-1 p-0.5 border-t-2 border-(--borderColor) w-full h-fit flex flex-row items-center justify-between content-center bg-(--accent-background) transition-colors;
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