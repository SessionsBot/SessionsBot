<script setup lang="ts">
    import { CheckIcon, XIcon } from 'lucide-vue-next';

    defineProps<{
        value: string | number | boolean
    }>()
</script>

<template>
    <span v-if="typeof value === 'boolean'">
        <CheckIcon v-if="value" class="text-emerald-400/70" :size="18" />
        <XIcon v-else class="text-zinc-300/50" :size="18" />
    </span>

    <span v-else class="text-zinc-300/50" :class="value === '∞' ? 'font-black text-xl' : ''">
        {{ value }}
    </span>
</template>
