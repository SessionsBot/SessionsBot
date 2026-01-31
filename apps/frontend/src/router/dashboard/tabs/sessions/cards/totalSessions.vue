<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';


    // Services:
    const dashboard = useDashboardStore();
    const totalSessions = computed(() => dashboard.guildData.sessions?.state?.length)

</script>


<template>
    <div class="m-4 flex justify-center items-center gap-0 rounded-md font-bold bg-white/2 border-2 border-ring/40">

        <div class="bg-white/7 h-full p-1.5 rounded-full flex items-center justify-center">
            <div class="bg-amber-500/60 ring-ring/70 ring-2 p-1 w-full h-full aspect-square rounded-full">
                <!-- Icon -->
                <svg class="size-full" xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="M17.5 12a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11m.25-9A3.25 3.25 0 0 1 21 6.25l.001 5.773a6.5 6.5 0 0 0-1.5-.71L19.5 8.5h-15v9.25c0 .966.784 1.75 1.75 1.75h5.064c.172.534.412 1.038.709 1.501L6.25 21A3.25 3.25 0 0 1 3 17.75V6.25A3.25 3.25 0 0 1 6.25 3zm-.766 11.046l-.04.098l-.556 1.787h-1.803c-.532 0-.772.668-.417 1.036l.074.065l1.458 1.105l-.557 1.787c-.165.53.375.975.821.73l.078-.05L17.5 19.5l1.458 1.104c.433.328 1.006-.07.92-.588l-.021-.092l-.557-1.787l1.458-1.105c.43-.326.248-1.014-.247-1.093l-.096-.008h-1.803l-.557-1.787a.576.576 0 0 0-1.071-.098M17.75 4.5H6.25A1.75 1.75 0 0 0 4.5 6.25V7h15v-.75a1.75 1.75 0 0 0-1.75-1.75" />
                </svg>
            </div>
        </div>

        <div class="flex flex-col gap-0 items-center justify-center">
            <p class="text-xl font-extrabold p-2 pb-0"> Total Sessions </p>
            <p class=" font-black text-lg p-2 pt-0.5 opacity-80"> {{ totalSessions || "?" }} </p>
        </div>

    </div>
</template>


<style scoped></style>