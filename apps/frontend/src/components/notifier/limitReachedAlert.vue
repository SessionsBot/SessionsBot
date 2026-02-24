<script lang="ts" setup>

    const props = defineProps<{
        limitName: string
    }>()

</script>


<template>
    <span class="w-full flex flex-col gap-0 pt-px px-0.5">
        <p class="bg-white/5 rounded-md p-1">
            You've reached you're maximum amount of <b class='text-indigo-400 font-extrabold'>{{ props.limitName }}</b>
            allowed!
        </p>
        <div class="text-xs/4.5 py-1 w-full text-text-1/65 font-semibold">
            Consider upgrading your bot's subscription plan..
        </div>
    </span>
</template>


<style scoped></style>