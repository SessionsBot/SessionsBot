<script lang="ts" setup>
    import { Paginator } from 'primevue';


    // Define Props:
    const props = defineProps<{
        /** The total number of records the paginator is handling */
        totalRecords: number,
        /** The number of records each page displays */
        pageSize: number,
        /** Weather to always show the paginator, while theres no pagination. */
        alwaysShow: boolean
    }>()


    // Sessions Paginator:
    const pageIndexStart = defineModel<number>('pageIndexStart')

    const selectPageOptions = (pageCount: number) => {
        let r: number[] = []
        for (let i = 0; i < pageCount; i++) {
            r.push(i + 1)
        }
        return r
    }


</script>


<template>
    <Paginator v-model:first="pageIndexStart" :total-records="props?.totalRecords" :rows="props?.pageSize"
        :always-show="props?.alwaysShow" unstyled>
        <template
            #container="{ page, pageCount, changePageCallback, prevPageCallback, nextPageCallback, lastPageCallback, firstPageCallback, }">
            <div class="flex-center gap-2 w-full flex-wrap p-2">
                <!-- First -->
                <Button @click="firstPageCallback" :disabled="page == 0" unstyled
                    class="button-base aspect-square p-1 rounded hidden sm:flex">
                    <Iconify icon="mingcute:arrows-left-line" />
                </Button>
                <!-- Previous -->
                <Button @click="prevPageCallback" :disabled="page == 0" unstyled
                    class="button-base aspect-square p-1 rounded">
                    <Iconify icon="mingcute:left-line" />
                </Button>
                <span class="text-text-1/75 flex-center gap-1.5">
                    Page
                    <Select size="small" :model-value="page + 1" :options="selectPageOptions(pageCount ?? 0)"
                        @value-change="(v) => changePageCallback(v - 1)"
                        :pt="{ root: 'bg-bg-soft!', overlay: 'min-w-fit!', list: 'bg-bg-soft! px-2! rounded! text-sm!', label: 'p-1! pl-2! w-fit!', option: '[.p-select-option-selected]:bg-brand-1! flex-center! p-1.75! px-2.5! selected-bg-emerald-500! checked:bg-yellow-500!', dropdown: 'pl-1! pr-2! m-0! w-fit!' }" />
                    of {{ pageCount }}
                </span>
                <!-- Next -->
                <Button @click="nextPageCallback" :disabled="(page + 1) == pageCount" unstyled
                    class="button-base aspect-square p-1 rounded">
                    <Iconify icon="mingcute:right-line" />
                </Button>
                <!-- Final -->
                <Button @click="lastPageCallback" :disabled="(page + 1) == pageCount" unstyled
                    class="button-base aspect-square p-1 rounded hidden sm:flex">
                    <Iconify icon="mingcute:arrows-right-line" />
                </Button>
            </div>

        </template>
    </Paginator>
</template>


<style scoped></style>