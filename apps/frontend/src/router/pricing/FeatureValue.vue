<script setup lang="ts">
    import { CheckIcon, InfinityIcon, XIcon } from 'lucide-vue-next';

    defineProps<{
        value: string | number | boolean
    }>()
</script>

<template>
    <span v-if="typeof value === 'boolean'">
        <CheckIcon v-if="value" class="text-emerald-500" :size="18" />
        <XIcon v-else class="text-text-2/50" :size="18" />
    </span>

    <span v-else class="text-text-2/50 font-rubik">
        <InfinityIcon v-if="String(value) == '∞'" class="text-text-2/50" :size="18" />
        <p v-else>
            {{ value }}
        </p>
    </span>
</template>
