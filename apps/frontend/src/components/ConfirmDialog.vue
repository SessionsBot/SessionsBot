<script lang="ts" setup>
    import { CircleQuestionMarkIcon } from 'lucide-vue-next';
    import { ConfirmDialog } from 'primevue';
</script>


<template>
    <ConfirmDialog class="mx-5 border-none!">
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="flex ring-3 ring-zinc-700 flex-col items-center p-8 bg-zinc-900 text-white rounded max-w-120">
                <div
                    class="rounded-full bg-zinc-700 text-white inline-flex justify-center items-center h-24 w-24 -mt-20">
                    <CircleQuestionMarkIcon class="grow! flex! size-max! p-3 drop-shadow-md drop-shadow-black/40" />
                </div>
                <span class="font-bold text-3xl block mb-2 mt-6">{{ message.header }}</span>
                <p class="mb-0">{{ message.message }}</p>
                <div class="flex items-center gap-2 mt-6">

                    <Button label="Cancel" variant="outlined" severity="contrast" @click="rejectCallback"
                        class="w-32"></Button>
                    <Button label="Confirm" @click="acceptCallback" severity="danger" class="w-32"></Button>
                </div>
            </div>
        </template>

    </ConfirmDialog>
</template>


<style scoped></style>