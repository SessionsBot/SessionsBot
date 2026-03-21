<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { DateTime } from 'luxon';
    import EmojiPicker, { type EmojiExt } from 'vue3-emoji-picker'

    // Services:
    const dashboard = useDashboardStore()

    // Guild Emojis:
    const guildEmojis = computed(() => dashboard.guildData.emojis.state)
    const lastEmojiFetch = ref<DateTime | undefined>(undefined)
    async function refreshEmojis() {
        lastEmojiFetch.value = DateTime.now();
        await dashboard.guildData.emojis.execute()
    }

    // On Mounted - Focus Search:
    onMounted(async () => {
        await focusEmojiSearch()
    })

    // Tab Selection:
    const tab = ref<'regular' | 'custom'>('regular')

    // Default Emoji Utils:
    const emojiPickerElRef = ref<InstanceType<typeof EmojiPicker> | null>(null)
    async function focusEmojiSearch() {
        await nextTick(() => {
            const pickerRoot = emojiPickerElRef.value?.$el as HTMLElement | undefined;
            if (!pickerRoot) return;

            const searchInput = pickerRoot.querySelector('input');
            searchInput?.focus();
        });
    }

    // Custom Emoji Utils:
    const customSearchValue = ref<string>('')
    const filteredCustomEmojis = computed(() => {
        const allEmojis = guildEmojis.value
        const query = customSearchValue.value?.trim()
        if (!query || query == '') return allEmojis
        return allEmojis?.filter(e => (e?.name?.includes(query) || e?.id?.includes(query)))
    })


    // Outgoing Emits:
    const emits = defineEmits<{
        selectEmoji: [EmojiExt],
        selectCustomEmoji: [string]
    }>()

</script>


<template>
    <div class="flex-center flex-col gap-1 w-full">
        <!-- Tab Switcher -->
        <div class="flex items-center justify-between relative w-full px-2 gap-2 top-1">
            <span class="flex-center flex-row gap-2">
                <Button title="Regular Emojis" @click="tab = 'regular'" unstyled
                    class="button-base bg-bg-soft border border-ring-soft rounded-lg px-1">
                    <Iconify icon="boxicons:smile-filled" size="16" />
                    <p class="text-sm font-bold"> Regular </p>
                </Button>
                <Button title="Custom Emojis" @click="tab = 'custom'" unstyled
                    class="button-base bg-bg-soft border border-ring-soft rounded-lg px-1">
                    <Iconify icon="mingcute:star-fill" size="16" />
                    <p class="text-sm font-bold"> Custom </p>
                </Button>
            </span>

            <!-- Refresh Button -->
            <Button @click="refreshEmojis" :disabled="(lastEmojiFetch?.diffNow('minutes')?.minutes ?? 2) < 1"
                v-if="tab == 'custom'" unstyled
                class="button-base disabled:opacity-40! aspect-square border border-ring-soft">
                <Iconify icon="material-symbols:refresh" size="16" class="opacity-65" />
            </Button>


        </div>
        <Transition name="fade" mode="out-in">
            <!-- Default/Native Emojis -->
            <EmojiPicker v-if="tab == 'regular'" class="text-text-1! shadow-none!" ref="emojiPickerElRef"
                disable-skin-tones native @select="(e) => $emit('selectEmoji', e)" />
            <!-- Custom Emojis -->
            <div v-else-if="tab == 'custom'" class="flex flex-center gap-2 flex-col p-2 min-w-62!">
                <!-- Custom Emoji Search -->
                <div
                    class="w-[90%] bg-black/10 mt-2 flex flex-center border border-ring-2 transition-all rounded has-focus-within:border-brand-1!">
                    <input v-model="customSearchValue" class="w-full outline-0! p-1 px-1.5 text-xs"
                        placeholder="Search Emoji">
                </div>

                <div class="w-full h-px bg-text-2 my-1.5" />

                <!-- Custom Emojis List -->
                <Button v-if="filteredCustomEmojis?.length" v-for="e in filteredCustomEmojis" unstyled
                    @click="$emit('selectCustomEmoji', e?.value)"
                    class="flex cursor-pointer items-center w-full flex-row gap-1 hover:bg-text-1/7 transition-all p-0.5 rounded">
                    <img class="size-7 aspect-square" :src="e?.url" />
                    <p class="text-sm">
                        {{ e.name }}
                    </p>
                </Button>

                <div v-else class="flex-center w-full">
                    <p class="opacity-65 text-sm">
                        No results found..
                    </p>
                </div>

            </div>
        </Transition>
    </div>
</template>


<style scoped>

    .v3-emoji-picker {
        --v3-picker-bg: var(--c-bg-2);
        --v3-picker-fg: color-mix(in oklab, var(--c-bg-2), var(--c-text-1) 11%);
        --v3-picker-border: var(--c-ring-2);
        --v3-picker-input-bg: color-mix(in oklab, var(--c-bg-2), black 11%);
        --v3-picker-input-border: var(--c-ring-2);
        --v3-picker-input-focus-border: var(--c-brand-1);
        --v3-group-image-filter: none;
        --v3-picker-emoji-hover: transparent;

    }

    [data-theme="dark"] .v3-emoji-picker {
        --v3-group-image-filter: invert(1) !important;
    }

</style>