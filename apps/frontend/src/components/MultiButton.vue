<script lang="ts" setup>

    import { autoUpdate, flip, offset, useFloating, type Placement } from '@floating-ui/vue'
    import { onClickOutside } from '@vueuse/core'

    const buttonRef = ref<HTMLElement>()
    const dropdownButtonRef = ref<HTMLElement>()
    const dropdownRef = ref<HTMLElement>()

    const showDropdown = ref(false)

    // Define Props:
    const props = defineProps<{
        alignment?: Placement
        mainAction: DropdownAction,
        actions: DropdownAction[]
    }>()

    // Floating Dropdown:
    const { floatingStyles, middlewareData, placement } = useFloating(buttonRef, dropdownRef, {
        placement: props.alignment ?? 'bottom-start',
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(5),
            // shift(),
            flip(),
        ]
    })

    onClickOutside(dropdownRef, async (e) => {
        showDropdown.value = false
    }, { ignore: [dropdownButtonRef] })



    export type MultiButtonAction = {
        label?: string,
        icon?: string
        fn?: (e: Event) => any,
        href?: string
        disabled?: boolean
        classes?: {
            root?: string | undefined
            icon?: string | undefined
            /** only exists on main action */
            dropdown?: string | undefined
        }
    }
    type DropdownAction = MultiButtonAction



</script>


<template>

    <!-- Multi Button -->
    <div ref="buttonRef" class="flex flex-row items-center h-7 w-fit bg-bg-bg-4 rounded-md">
        <!-- Main Action -->
        <Button unstyled @click="props.mainAction.fn" :class="props.mainAction?.classes?.root"
            :disabled="props.mainAction?.disabled"
            class="flex h-full flex-row items-center button-base button-secondary active:scale-95 rounded-r-none">
            <Iconify v-if="props.mainAction?.icon" :icon="props.mainAction.icon" class="pl-0.75"
                :class="props.mainAction?.classes?.icon" :size="18" />
            <p class="font-semibold px-1" :class="{ 'pl-0 pr-0.5': props.mainAction?.icon }">
                {{ props.mainAction?.label }}
            </p>
        </Button>
        <!-- Open Dropdown -->
        <Button unstyled @click="showDropdown = !showDropdown" ref="dropdownButtonRef"
            :disabled="props.mainAction?.disabled" :class="props?.mainAction?.classes?.dropdown"
            class="flex h-full flex-row items-center aspect-square button-base button-secondary  active:scale-95 rounded-l-none">
            <Iconify icon="mingcute:down-line" :size="20" />
        </Button>
    </div>


    <!-- Dropdown - List -->
    <Transition name="dropdown">
        <div v-if="showDropdown" ref="dropdownRef" :style="floatingStyles"
            class="bg-bg-3 z-3 border-2 border-ring-soft p-1 flex flex-col gap-0.5 rounded-md w-fit absolute">

            <!-- Dropdown Action -->
            <Button unstyled v-for="a in props.actions" @click="(e) => { if (a?.fn) a.fn(e); showDropdown = false; }"
                :class="a?.classes?.root" :disabled="a?.disabled"
                class="flex relative h-full flex-row items-center justify-start button-secondary bg-bg-1/0 button-base rounded! active:scale-x-97 disabled:scale-100!">
                <Iconify v-if="a?.icon" class="mx-px opacity-80" :class="a?.classes?.icon" :icon="a?.icon" :size="18" />
                <p v-if="a?.label" class="pr-1 font-semibold text-sm"> {{ a?.label }} </p>
                <!-- Href Provided -->
                <a v-if="a?.href" :href="a?.href" target="_blank"
                    class="bg-red-500/0 w-full h-full absolute inset-0 flex grow" />
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