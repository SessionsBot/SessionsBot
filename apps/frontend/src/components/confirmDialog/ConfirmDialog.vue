<script lang="ts" setup>
    import { CircleQuestionMarkIcon } from 'lucide-vue-next';
    import { ConfirmDialog } from 'primevue';

</script>


<template>
    <!-- Default Dialog - Headless w/ Question Icon - Red Confirm Button -->
    <ConfirmDialog class="m-7! border-none!">
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="flex text-text-1 ring-2 ring-ring-4 flex-col items-center p-6 bg-bg-3 rounded max-w-120">
                <div
                    class="rounded-full bg-(--p-button-danger-background) ring-3 ring-ring-4 text-text-1 inline-flex justify-center items-center h-24 w-24 -mt-20">
                    <Iconify v-if="message?.icon" :size="68" :icon="message?.icon" class="size-full! grow! flex!" />
                    <CircleQuestionMarkIcon v-else
                        class="grow! flex! size-max! p-3 drop-shadow-md drop-shadow-black/40" />
                </div>
                <span class="font-bold text-3xl block mb-2 mt-6">
                    {{ message.header }}
                </span>
                <p v-html="message.message" class="mb-0" />
                <div class="flex items-center gap-2 mt-6">

                    <Button label="Cancel" variant="outlined" severity="secondary" @click="rejectCallback"
                        class="w-32"></Button>
                    <Button label="Confirm" @click="acceptCallback" severity="danger" class="w-32"></Button>
                </div>
            </div>
        </template>

    </ConfirmDialog>

</template>


<style scoped></style>