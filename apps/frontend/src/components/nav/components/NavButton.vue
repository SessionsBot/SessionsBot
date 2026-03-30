<script lang="ts" setup>
    import { useNavStore } from '@/stores/nav';
    import { Icon } from '@iconify/vue';
    import type { URL } from 'url';
    import type { RouteLocationAsString } from 'vue-router';


    // Services:
    const nav = useNavStore()

    // Props:
    const props = defineProps<{
        /** The title of the link button */
        title: string,
        /** The `Iconify` icon name to display */
        icon: string,
        /** If provided - Link to provided router path */
        to?: RouteLocationAsString,
        /** If provided - Link to provided URL */
        href?: URL | string,
        /** Optional function to execute on button click */
        action?: (...args: any) => void | Promise<void>
        /** Nested style classes */
        classes?: {
            root?: string,
            icon?: string,
            text?: string
        }
    }>()


    // Util: Handle Button Click:
    async function handleButtonClick(e: PointerEvent) {

        if (props.action) {
            props.action()
        }
        nav.closeNav()
    }

</script>


<template>

    <!-- Router Links -->
    <RouterLink v-if="props?.to" :to="props.to" v-slot="{ isActive }">
        <Button :title="props.title" class="nav-button" @click="handleButtonClick"
            :class="[{ 'active': isActive }, props.classes?.root]" unstyled :disabled="isActive">
            <Icon :icon="props.icon" class="size-5.5 aspect-square min-w-fit" :class="props.classes?.icon" />
            <p :class="props.classes?.text"> {{ props.title }} </p>
        </Button>
    </RouterLink>

    <!-- Href Links -->
    <a v-else-if="props?.href" :href="String(props.href)" target="_blank">
        <Button :title="props.title" class="nav-button" @click="handleButtonClick" :class="props.classes?.root"
            unstyled>
            <Icon :icon="props.icon" class="size-5.5 aspect-square min-w-fit" :class="props.classes?.icon" />
            <p :class="props.classes?.text"> {{ props.title }} </p>
            <Icon icon="gridicons:external" class="ml-auto size-3.25 opacity-80" />
        </Button>
    </a>

    <!-- Base Button -->
    <Button v-else :title="props.title" class="nav-button" @click="handleButtonClick" :class="props.classes?.root"
        unstyled>
        <Icon :icon="props.icon" class="size-5.5 aspect-square min-w-fit" :class="props.classes?.icon" />
        <p :class="props.classes?.text"> {{ props.title }} </p>
    </Button>


</template>


<style scoped>

    @reference "@/styles/main.css";

    .nav-button {
        @apply bg-text-1/9 button-base flex-row flex-wrap justify-start gap-1 px-1.5 py-1 rounded-lg w-full cursor-pointer;

        &:disabled {
            @apply opacity-100 cursor-default;
        }

        &:hover {
            @apply bg-text-1/15;
        }

        &.active {
            @apply bg-brand-1;
        }
    }


</style>