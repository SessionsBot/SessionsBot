<script lang="ts" setup>
    import { DateTime } from 'luxon';


</script>


<template>
    <!-- Variable Key -->
    <div
        class="flex w-70 min-w-fit max-w-[80%] self-center flex-col items-center p-2 mt-2 mb-1 gap-2 rounded-md bg-black/20 opacity-90 shadow-sm shadow-black/40">

        <p class="font-bold text-sm"> Replaceable Text - Map: </p>


        <div class="flex flex-row gap-2 text-xs font-medium justify-between items-center w-full">
            <p> %day_lg% </p>
            <p class="opacity-65"> {{ DateTime.now().toFormat('DD') }} </p>
        </div>
        <div class="flex flex-row gap-2 text-xs font-medium justify-between items-center w-full">
            <p> %day_md% </p>
            <p class="opacity-65"> {{ DateTime.now().toFormat('M/d/yy') }} </p>
        </div>
        <div class="flex flex-row gap-2 text-xs font-medium justify-between items-center w-full">
            <p> %day_sm% </p>
            <p class="opacity-65"> {{ DateTime.now().month + '/' + DateTime.now().day }} </p>
        </div>

    </div>
</template>


<style scoped></style>