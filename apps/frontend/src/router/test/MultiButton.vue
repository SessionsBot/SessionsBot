<script lang="ts" setup>

    import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
    import { onClickOutside } from '@vueuse/core'
    import type { Component } from 'vue'

    const buttonRef = ref<HTMLElement>()
    const dropdownButtonRef = ref<HTMLElement>()
    const dropdownRef = ref<HTMLElement>()

    const showDropdown = ref(false)

    // Floating Dropdown:
    const { floatingStyles, middlewareData, placement } = useFloating(buttonRef, dropdownRef, {
        placement: 'bottom-start',
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(7),
            // shift(),
            flip(),
        ]
    })

    onClickOutside(dropdownRef, async (e) => {
        showDropdown.value = false
    }, { ignore: [dropdownButtonRef] })



    type DropdownAction = {
        label?: string,
        icon?: string | Component,
        fn: (e: Event) => any,
        disabled?: boolean
    }
    const dropdownActions = ref<DropdownAction[]>([
        {
            label: 'Modify',
            icon: 'mdi:pencil',
            fn(e) {
                showDropdown.value = false;
                return console.info('Clicked Edit')
            },
        },
        {
            label: 'Duplicate',
            icon: 'mdi:layers',
            fn(e) {
                showDropdown.value = false;
                return console.info('Clicked duplicate')
            },
        }
    ])


</script>


<template>

    <!-- Multi Button -->
    <div ref="buttonRef" class="flex flex-row items-center h-7 w-fit bg-bg-bg-4 rounded-md">
        <!-- Main Action -->
        <Button unstyled
            class="flex h-full flex-row items-center button-base bg-bg-4 hover:bg-bg-4/60 active:bg-bg-4/80 active:scale-95 rounded-r-none">
            <Iconify icon="lucide:wrench" class="pl-0.75" :size="18" />
            <p class="font-semibold">
                Action
            </p>
        </Button>
        <!-- Open Dropdown -->
        <Button unstyled @click="showDropdown = !showDropdown" ref="dropdownButtonRef"
            class="flex h-full flex-row items-center aspect-square button-base bg-bg-4 hover:bg-bg-4/60 active:bg-bg-4/80 active:scale-95 rounded-l-none">
            <Iconify icon="mingcute:down-line" :size="20" />
        </Button>
    </div>


    <!-- Dropdown - List -->
    <Transition name="dropdown">
        <div v-if="showDropdown" ref="dropdownRef" :style="floatingStyles"
            class="bg-bg-3 border-2 border-ring-soft p-1 flex flex-col gap-0.5 rounded-md w-fit absolute">

            <!-- Dropdown Action -->
            <Button unstyled v-for="a in dropdownActions" @click="a?.fn"
                class="flex h-full flex-row items-center justify-start button-base rounded! active:scale-x-97 hover:bg-bg-4/60 active:bg-bg-4/80">
                <Iconify v-if="typeof a?.icon == 'string'" class="mx-px opacity-80" :icon="a?.icon" :size="18" />
                <p v-if="a?.label" class="pr-1 font-semibold text-sm"> {{ a?.label }} </p>
            </Button>

        </div>
    </Transition>


</template>


<style scoped>

    .dropdown-enter-from,
    .dropdown-leave-to {
        opacity: 0;
    }

    .dropdown-leave-from,
    .dropdown-enter-to {
        opacity: 1;
    }

    .dropdown-leave-active,
    .dropdown-enter-active {
        transition: opacity 0.2s;
    }

</style>