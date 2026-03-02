<script lang="ts" setup>
    import { ref } from 'vue';

    // All Required Bot Perms:
    const allRequiredPerms = [
        'Create Private Threads', 'Create Public Threads', `Embed Links`, `Manage Channels`,
        `Manage Messages`, `Manage Threads`, `Mention Everyone`, `Read Message History`, `Send Messages`,
        `Send Messages in Threads`, `View Channels`
    ]

    // Checked Permissions List:
    const checked = ref(new Set<string>())
    function toggleChecked(perm: string) {
        if (checked.value.has(perm)) {
            checked.value.delete(perm)
        } else {
            checked.value.add(perm)
        }
    }

</script>


<template>
    <!-- Actions -->
    <div class="bg-black/0 m-0! w-full flex items-center justify-start">
        <button
            class="hover:bg-(--vp-c-default-3)/50 active:bg-(--vp-c-default-3)/75 transition-all p-0! px-0.5! pr-1! border-(--vp-c-default-2) border rounded-md py-0.75 flex flex-row gap-1 items-center justify-center">
            <Transition name="fade" mode="out-in" type="animation">
                <span v-if="checked.size != allRequiredPerms.length" @click="checked = new Set(allRequiredPerms)"
                    class="flex flex-row gap-px items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="m9.55 15.15l8.475-8.475q.3-.3.7-.3t.7.3t.3.713t-.3.712l-9.175 9.2q-.3.3-.7.3t-.7-.3L4.55 13q-.3-.3-.288-.712t.313-.713t.713-.3t.712.3z" />
                    </svg>
                    <p class="text-xs opacity-70 m-0! font-semibold!">
                        Select All
                    </p>
                </span>
                <span v-else @click="checked.clear()" class="flex flex-row gap-px items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12L4.81 17.775a1 1 0 1 0 1.414 1.414L12 13.414l5.775 5.775a1 1 0 0 0 1.414-1.414L13.414 12l5.775-5.775a1 1 0 0 0-1.414-1.414L12 10.586z" />
                    </svg>
                    <p class="text-xs opacity-70 m-0! font-semibold!">
                        Deselect All
                    </p>
                </span>
            </Transition>
        </button>
    </div>
    <!-- Required Permissions List -->
    <span
        class="flex! justify-center! items-center! space-y-0! gap-5! p-4 rounded-md bg-(--vp-c-bg-2) max-w-full max-h-fit flex-wrap">
        <p class="perm-label" v-for="perm in allRequiredPerms" @click="toggleChecked(perm)"
            :class="{ 'checked': checked.has(perm) }">
            {{ perm }}
        </p>
    </span>
</template>


<style scoped>

    @reference "@theme/custom.css";

    .perm-label {
        @apply !w-fit !h-fit !m-0 bg-(--vp-c-default-2)/70 text-sm font-bold p-0.75 rounded-md border-2 border-(--vp-c-default-1)/0 cursor-pointer hover:border-(--vp-c-default-1)/20 transition-all active:scale-y-95;

        &.checked {
            @apply !border-(--vp-c-brand-3)/50 bg-(--vp-c-brand-3)/80;
        }
    }

</style>