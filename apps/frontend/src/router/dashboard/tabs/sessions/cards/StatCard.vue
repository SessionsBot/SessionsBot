<script lang="ts" setup>

    // Incoming Props:
    const props = defineProps<{
        title: string,
        value: any,
        iconName: string,
        classes?: {
            iconContainer?: string
        }
    }>()


</script>


<template>
    <!-- Total Sessions - Card -->
    <div
        class="border-2 bg-bg-soft flex-1 grow max-w-85 gap-1 rounded-md min-h-14 h-fit min-w-38 w-fit! border-ring-soft flex flex-col p-2 content-center items-center justify-center">

        <!-- Card Title -->
        <p class="text-xs text-start w-full uppercase font-black opacity-60">
            {{ props.title || 'STAT_NAME' }}
        </p>

        <!-- Bottom Row -->
        <div class="flex flex-row items-center w-full bg-red-500/0 gap-0 p-0">
            <!-- Icon Area -->
            <div class="p-1.25 sm:mt-1 rounded-lg aspect-square! bg-bg-4 border-2 border-ring-4 min-w-fit w-fit flex items-center justify-center"
                :class="props?.classes?.iconContainer ?? ''">
                <Iconify :icon="props?.iconName" class="sm:flex hidden" :size="28" />
                <Iconify :icon="props?.iconName" class="sm:hidden flex" />
            </div>
            <!-- Detail Area -->
            <div class="p-1.5 w-fit! bg-red-500/0 flex flex-col gap-0 flex-1 grow items-start justify-center">
                <p class="sm:text-2xl text-xl font-extrabold">
                    {{ props.value ?? '%' }}
                </p>
            </div>
        </div>


    </div>

</template>
