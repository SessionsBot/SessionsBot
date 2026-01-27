<script setup lang="ts">
    import { ref } from "vue"

    /**
     * Props
     */
    const props = defineProps<{
        placeholder?: string
        maxLength?: number
    }>()

    /** Editor Value */
    const editorValue = defineModel<string>('editorValue')


    /**
     * Refs
     */
    const textareaRef = ref<HTMLTextAreaElement | null>(null)

    /**
     * Insert Discord markdown around selected text
     */
    function wrapSelection(prefix: string, suffix = prefix) {
        const el = textareaRef.value
        if (!el) return

        const start = el.selectionStart
        const end = el.selectionEnd
        const selected = el.value.slice(start, end)

        const before = el.value.slice(0, start)
        const after = el.value.slice(end)

        const newValue =
            before + prefix + selected + suffix + after

        editorValue.value = newValue

        // Restore cursor position
        requestAnimationFrame(() => {
            el.focus()
            el.selectionStart = start + prefix.length
            el.selectionEnd = end + prefix.length
        })
    }

    /**
     * Insert block-style markdown
     */
    function insertBlock(prefix: string) {
        const el = textareaRef.value
        if (!el) return

        const start = el.selectionStart
        const before = el.value.slice(0, start)
        const after = el.value.slice(start)

        const newValue = before + prefix + after
        editorValue.value = newValue

        requestAnimationFrame(() => {
            el.focus()
            el.selectionStart = el.selectionEnd = start + prefix.length
        })
    }
</script>

<template>
    <div class="discord-editor flex flex-col gap-2">
        <!-- Toolbar -->
        <div class="flex gap-1 flex-wrap bg-zinc-800 p-2 rounded-md">
            <button @click="wrapSelection('**')" title="Bold">B</button>
            <button @click="wrapSelection('*')" title="Italic">I</button>
            <button @click="wrapSelection('__')" title="Underline">U</button>
            <button @click="wrapSelection('~~')" title="Strikethrough">S</button>

            <button @click="wrapSelection('`')" title="Inline Code">`</button>
            <button @click="insertBlock('```\\n\\n```')" title="Code Block">
                ````
            </button>

            <button @click="insertBlock('> ')" title="Quote">
                &gt;
            </button>

            <button @click="insertBlock('- ')" title="List">
                •
            </button>
        </div>

        <!-- Textarea -->
        <textarea ref="textareaRef" class="w-full min-h-[140px] rounded-md bg-zinc-900 p-3 font-mono text-sm resize-y"
            :placeholder="placeholder ?? 'Type a Discord message…'" :maxlength="maxLength" :value="editorValue" />

        <!-- Footer -->
        <div class="text-xs text-zinc-400 text-right">
            {{ editorValue?.length || '?' }}<span v-if="maxLength"> / {{ maxLength }}</span>
        </div>
    </div>
</template>

<style scoped>
    @reference "@/styles/main.css"

    button {
        @apply px-2 py-1 rounded bg-zinc-700 text-sm hover:bg-zinc-600 active:bg-zinc-500;
    }
</style>
