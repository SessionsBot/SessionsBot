<script lang="ts" setup>
    import ChatIcon from '@/components/icons/ChatIcon.vue';
    import { externalUrls } from '@/stores/nav';
    import { XIcon } from 'lucide-vue-next';
    import type { Component } from 'vue';

    // Resources:
    const resources: {
        name: string,
        icon: string | Component,
        tags: string[],
        routerLink?: string,
        hrefLink?: string,
        classes?: {
            root?: string,
            icon?: string
        }
    }[] = [
            {
                name: 'FAQs',
                icon: 'wpf:faq',
                tags: ['frequently, asked, questions,'],
                hrefLink: externalUrls.documentation
            },
            {
                name: 'Documentation',
                icon: 'mingcute:paper-fill',
                tags: ['documentation, user, manuel, guide, reference'],
                hrefLink: externalUrls.documentation

            },
            {
                name: 'Support Chat',
                icon: ChatIcon,
                tags: ['support, chat, agent, message'],
                classes: { icon: 'ml-1 mr-0.5' },
                hrefLink: externalUrls.discordServer.supportInvite
            },
            {
                name: 'Status Page',
                icon: 'heroicons-outline:status-online',
                tags: ['status, page, connection, network'],
                classes: { icon: 'mr-0! pr-1!' },
                hrefLink: externalUrls.statusPage
            },
            {
                name: 'Contact Email',
                icon: 'material-symbols:mail',
                tags: ['support, email, agent, message', 'contact'],
                classes: { icon: 'mr-0! pr-1!' },
                hrefLink: 'mailto:support@sessionsbot.fyi'
            },
            {
                name: 'Store Front',
                icon: 'tdesign:store-filled',
                tags: ['store, shop, front, buy', 'refund'],
                classes: { icon: 'mr-0! pr-1!' },
                hrefLink: externalUrls.discordStore
            },
            {
                name: 'GitHub',
                icon: 'mdi:github',
                tags: ['git', 'hub', 'code', 'security', 'open', 'source'],
                classes: { icon: 'mr-0! pr-1!' },
                hrefLink: externalUrls.gitHub
            }
        ]

    // Search & AutoComplete:
    function useSearchAndAutocomplete() {
        const autoCompleteVisible = ref<boolean>(false)
        const autoCompleteOptions = ref<string[]>([])

        const searchValue = ref<string>('')

        const filteredResources = computed(() => {
            const q = searchValue.value
            return resources.filter(r => r.tags.some(t => t.includes(q)) || r.name.includes(q))
                .splice(0, 5)
        })

        function showAutoComplete() {
            autoCompleteVisible.value = true
        }

        async function hideAutoComplete() {
            setTimeout(() => {
                autoCompleteVisible.value = false
            }, 150);
        }

        return {
            autoCompleteVisible,
            autoCompleteOptions,
            filteredResources,
            searchValue,
            showAutoComplete,
            hideAutoComplete
        }
    }
    const { autoCompleteVisible, autoCompleteOptions, filteredResources, searchValue, showAutoComplete, hideAutoComplete } = useSearchAndAutocomplete();
    watch(searchValue, (q) => {
        if (q) {
            if (q.trim() == '') return autoCompleteOptions.value = []
            const filtered = resources.filter(r => r.tags.some(t => t.includes(q)) || r.name.includes(q))
            autoCompleteOptions.value = filtered.map(r => r.name)
        } else return autoCompleteOptions.value = []
    })

</script>


<template>
    <div class="resources-list-wrap">

        <!-- Header -->
        <div class="w-full flex flex-wrap justify-between items-center content-center p-0">
            <!-- Title -->
            <div class="text-text-1/70 flex flex-row gap-0.5 items-center justify-start w-fit">
                <Iconify icon="material-symbols:list-alt-outline" :size="22" />
                <p class=" font-extrabold uppercase text-sm">
                    All Resources:
                </p>
            </div>

            <!-- Search - Input Wrap -->
            <div
                class="bg-bg-3 relative w-45 h-7 p-1.5 rounded-md ring-ring-soft ring-2 hover:ring-ring-3 focus-within:ring-ring-4! flex flex-row gap-1 transition-all">
                <input v-model="searchValue" type="search" @focusin="autoCompleteVisible = true"
                    @focusout="hideAutoComplete" class="w-full! h-full! text-sm focus:outline-none! transition-all"
                    :class="{ 'pr-4.75': searchValue?.trim()?.length }" placeholder="Search for more...">

                <!-- Clear Button -->
                <button @click="searchValue = ''" v-if="searchValue?.trim()?.length"
                    class="h-full aspect-square bg-white-50 absolute right-0 top-0 p-1 opacity-50 hover:opacity-70 cursor-pointer transition-all">
                    <XIcon class="w-fit h-full! aspect-square! p-0.5" :stroke-width="2.5" />
                </button>

                <!-- Autocomplete -->
                <Transition name="autocomplete-slide" mode="out-in">
                    <div v-if="autoCompleteVisible"
                        class="gap-1 p-1 z-3 absolute top-[calc(100%+4px)] bg-bg-3 -left-0.5 w-[calc(100%+4px)] h-fit max-h-20 overflow-y-auto flex flex-col items-center justify-start border-ring-4 border-2 rounded-lg transition-all">
                        <button v-if="autoCompleteOptions.length" v-for="o in autoCompleteOptions"
                            @click="() => { autoCompleteVisible = false; searchValue = o }"
                            class="w-full text-left p-1 hover:bg-text-1/7 active:bg-text-1/4 rounded cursor-pointer transition-all">
                            <p class="text-xs font-medium w-full p-0.5 opacity-80 truncate"> {{ o }} </p>
                        </button>

                        <!-- No options msg -->
                        <div v-else class="w-full p-1 rounded transition-all">
                            <p class="text-xs font-medium w-full p-0.5 opacity-60"> No options </p>
                        </div>
                    </div>
                </Transition>

            </div>

        </div>

        <!-- Results Wrap -->
        <div class="resources-results-wrap">

            <!-- Resource Button(s) -->
            <Button unstyled v-for="r in filteredResources" :class="r?.classes?.root"
                class="bg-bg-3 relative w-fit min-h-fit! flex items-center flex-row gap-0 rounded-md ring-2 ring-ring-soft hover:ring-ring-2/70 hover:scale-103 active:scale-95 overflow-clip cursor-pointer transition-all">
                <!-- Icon -->
                <Iconify v-if="typeof r.icon == 'string'" class="p-2" :class="r?.classes?.icon" :icon="r.icon"
                    :size="22" />
                <component v-else :is="r.icon" :class="r?.classes?.icon" />
                <!-- Title -->
                <div class="flex grow items-center justify-center pl-0 p-1 pr-2 flex-col">
                    <p class="font-semibold font-rubik uppercase font-white/70 truncate">
                        {{ r.name }}
                    </p>
                </div>

                <!-- Links -->
                <a v-if="r.hrefLink" :href="r.hrefLink" target="_blank" class="absolute inset-0 w-full h-full" />
                <RouterLink v-if="r.routerLink" :to="r.routerLink" class="absolute inset-0 w-full h-full" />
            </Button>

            <!-- No Results Found -->
            <div v-if="!filteredResources?.length" class="flex items-center justify-center p-1">
                <p class="font-medium italic opacity-40">
                    No Results Found
                </p>
            </div>

        </div>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .resources-list-wrap {
        @apply ring-2 max-w-200 w-full gap-3 p-3 pt-2 ring-ring rounded-md flex items-center justify-center flex-wrap;

        .resources-results-wrap {
            @apply w-full h-fit flex gap-3 p-1 items-center justify-center flex-wrap;
        }
    }

    /* AutoComplete - Animation In/Out */
    .autocomplete-slide-enter-from {
        opacity: 0;
        transform: translateY(5px);
    }

    .autocomplete-slide-leave-to {
        opacity: 0;
    }

    .autocomplete-slide-enter-to,
    .autocomplete-slide-leave-from {
        opacity: 1;
        transform: translateY(0px);
    }

    .autocomplete-slide-enter-active,
    .autocomplete-slide-leave-active {
        transition: all 0.22s ease;
    }

</style>