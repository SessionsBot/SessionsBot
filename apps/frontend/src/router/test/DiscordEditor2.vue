<script lang="ts" setup>



    // Text Input Element:
    const textInputRef = ref<HTMLTextAreaElement>()
    const textInputValue = ref<string>()

    // Editor Restraints:
    const maxCharacters = 700;
    const curCharacters = computed(() => textInputValue.value?.length || 0)

    // Selection / Inlined Styles:
    function addInlineStyle(prefix: string, suffix = prefix) {
        console.info('Adding inlined style...')
        const el = textInputRef.value
        if (!el) return console.warn('No text element found for styling...')
        const selectionStart = el.selectionStart
        const selectionEnd = el.selectionEnd
        const selectedText = el.value.slice(selectionStart, selectionEnd)

        const before = el.value.slice(0, selectionStart)
        const after = el.value.slice(selectionEnd)

        console.info({
            selectionStart, selectionEnd, selectedText, before, after
        })

        const newFormatText = prefix + selectedText + suffix;
        const newInputValue = before + newFormatText + after;
        el.value = newInputValue
    }

</script>


<template>

    <!-- Editor Wrap -->
    <div class="editor-wrap">

        <!-- Toolbar -->
        <div class="editor-toolbar">

            <!-- Formation - Section 1 -->
            <section class="flex items-center justify-start gap-1 flex-wrap">
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
                <Button title="Heading 1" @click="addInlineStyle('# ', '')" unstyled class="toolbar-button">
                    <Iconify icon="wordpress:heading-level-1" />
                </Button>
                <!-- Heading 2 -->
                <Button title="Heading 2" @click="addInlineStyle('## ', '')" unstyled class="toolbar-button">
                    <Iconify icon="wordpress:heading-level-2" />
                </Button>
                <!-- Heading 3 -->
                <Button title="Heading 3" @click="addInlineStyle('### ', '')" unstyled class="toolbar-button">
                    <Iconify icon="wordpress:heading-level-3" />
                </Button>
                <!-- Heading 4 -->
                <Button title="Heading 4" @click="addInlineStyle('-# ', '')" unstyled class="toolbar-button">
                    <Iconify class="opacity-60 scale-80" icon="wordpress:heading-level-4" />
                </Button>
                <!-- List -->
                <Button title="List" unstyled @click="addInlineStyle('- ', '')" class="toolbar-button">
                    <Iconify icon="wordpress:format-list-bullets" />
                </Button>
            </section>

            <!-- Attachments - Section 2 -->
            <section class="flex items-center justify-start gap-1 flex-wrap">
                <!-- Link -->
                <Button title="Link" unstyled class="toolbar-button">
                    <Iconify icon="material-symbols:link-rounded" />
                </Button>
                <!-- Quote -->
                <Button title="Quote" unstyled class="toolbar-button">
                    <Iconify icon="ri:chat-quote-line" />
                </Button>
                <!-- Code -->
                <Button title="Code" unstyled class="toolbar-button">
                    <Iconify icon="material-symbols:code" />
                </Button>

            </section>

        </div>

        <!-- Text Editor/Input -->
        <textarea ref="textInputRef" v-model="textInputValue" class="editor-textInput" />

        <!-- Editor Footer -->
        <div class="editor-footer">
            <!-- Character Count -->
            <p class="opacity-55 font-semibold text-xs uppercase italic w-full text-end">
                {{ curCharacters }}/{{ maxCharacters }}
            </p>
        </div>

    </div>

    <div class="w-full flex items-center justify-center flex-col gap-2 p-2">
        <p>
            VALUES
        </p>
        <p>
            String: <br>{{ textInputValue }}
        </p>
    </div>


</template>


<style scoped>

    @reference "@/styles/main.css";

    .editor-wrap {
        @apply max-h-fit relative inline-flex flex-col items-center justify-center bg-surface ring-2 ring-ring rounded;

        .editor-toolbar {
            @apply gap-4 p-1 w-full h-fit flex flex-row items-center justify-between flex-wrap content-center border-b-2 border-ring;

            .toolbar-button {
                @apply p-0.5 rounded bg-zinc-400/20 hover:bg-ring active:bg-ring/80 active:scale-95 aspect-square transition-all cursor-pointer flex items-center justify-center content-center;
            }

        }

        .editor-textInput {
            @apply bg-white/10 p-1 w-full min-w-full max-w-full min-h-7 outline-none;
        }

        .editor-footer {
            @apply gap-1 p-0.5 w-full h-fit flex flex-row items-center justify-between content-center bg-white/10;
        }
    }

</style>