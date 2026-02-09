<script lang="ts" setup>
    import type { FormInstance, FormSubmitEvent } from '@primevue/forms/form';
    import { zodResolver } from '@primevue/forms/resolvers/zod';
    import { z } from 'zod'
    import InfoHelpButton from '../../components/sessionForm/labels/infoHelpButton.vue';
    import type { PopoverMethods } from 'primevue';
    import { CheckIcon } from 'lucide-vue-next';

    // Root Preference Form States & Methods:
    const usePreferencesForm = () => {
        const formRef = ref<FormInstance>();

        const resolver = zodResolver(z.object({
            accentColor: z.union([z.string(), z.number()])
        }))

        const values = reactive({
            accentColor: '#000000'
        })

        function submit(e: FormSubmitEvent) {
            console.info(`{i} Form Submission - Valid: ${e.valid}`, e.values)
        }

        return {
            formRef,
            values,
            resolver,
            submit
        }
    }
    const preferenceForm = usePreferencesForm()


    // Input - Accent Color (Select)
    const selectColorPopoverIsActive = ref(false)
    const selectColorPopoverRef = ref<PopoverMethods | undefined>()
    function openSelectColorPopover(e: Event) {
        // open
        selectColorPopoverRef.value?.toggle(e)
    }
    const hexColorInputVal = computed({
        get: () => {
            return preferenceForm.values.accentColor.replace('#', '')
        },
        set: (v) => {
            if (!v) { v = '000000' }
            if (v.startsWith('#')) { v = v.replace('#', '') }
            const HexColorSchema = z.string().regex(/^#([a-f0-9]{6}|[a-f0-9]{3})$/i, 'Invalid hex color code!');
            const isHex = z.safeParse(HexColorSchema, `#${v}`)
            if (!isHex.success) {
                preferenceForm.values.accentColor = ('#000000')
            } else {
                preferenceForm.values.accentColor = `#${v}`
            }

        }
    })

</script>


<template>
    <div class="dashboard-tab-view pb-0!">
        <!-- Title & Desc -->
        <span class="w-full flex flex-col gap-0">
            <div class="w-full flex items-center justify-start flex-row gap-0">
                <div class="w-fit h-fit flex aspect-square">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M14 21h-4l-.551-2.48a7 7 0 0 1-1.819-1.05l-2.424.763l-2-3.464l1.872-1.718a7 7 0 0 1 0-2.1L3.206 9.232l2-3.464l2.424.763A7 7 0 0 1 9.45 5.48L10 3h4l.551 2.48a7 7 0 0 1 1.819 1.05l2.424-.763l2 3.464l-1.872 1.718a7 7 0 0 1 0 2.1l1.872 1.718l-2 3.464l-2.424-.763a7 7 0 0 1-1.819 1.052z" />
                            <circle cx="12" cy="12" r="3" />
                        </g>
                    </svg>
                </div>
                <p class="text-xl px-1.5 uppercase font-black">
                    Server Preferences
                </p>
            </div>

            <p class="mx-4 pt-1 text-sm text-start w-full text-white/70">
                Review your server wide preferences, this changes how things work with Sessions Bot across your <b>whole
                    server</b>.
            </p>
        </span>

        <!-- Content Wrap -->
        <div class="tab-content-wrap">

            <!-- Preferences - Form/Inputs -->
            <Form v-slot="$form" :ref="preferenceForm.formRef" :resolver="preferenceForm.resolver"
                @submit="preferenceForm.submit" class="preferences-form">

                <!-- Input - Accent Color -->
                <span class="input-group">
                    <!-- Label -->
                    <div class="label">
                        <span class="flex items-center gap-1 flex-wrap">
                            <Iconify :size="18" icon="mdi:color" />
                            Accent Color
                            <!-- Premium Feature Badge -->
                            <span
                                class="mx-0.5 flex flex-row gap-0 p-0.5 pr-0.75 bg-black/10 text-white/85 border-indigo-400/70 border-2 rounded-lg">
                                <DiamondIcon class="size-4 " />
                                <p class="font-extrabold text-xs"> Premium </p>
                            </span>
                        </span>

                        <InfoHelpButton doc-path="/" />
                    </div>

                    <!-- Input -->
                    <div class="input">

                        <!-- Simulated Input -->
                        <div @click="openSelectColorPopover"
                            class="h-11 w-full p-1.25 py-1.5 bg-black/30 flex items-center justify-center border-2 border-zinc-300 hover:border-indigo-300 active:border-indigo-400 transition-all cursor-pointer rounded-md"
                            :class="{
                                'border-indigo-400!': selectColorPopoverIsActive
                            }">

                            <!-- Selected Color Display -->
                            <span class="w-full h-full rounded relative" :style="{
                                backgroundColor: preferenceForm.values.accentColor
                            }">
                                <p class="absolute right-0 opacity-55 font-bold h-full w-fit p-1 flex items-center">
                                    {{ (preferenceForm.values.accentColor || '#??????') }}
                                </p>
                            </span>


                        </div>
                        <!-- Select Color - Popover -->
                        <Popover ref="selectColorPopoverRef" @show="selectColorPopoverIsActive = true"
                            @hide="selectColorPopoverIsActive = false">
                            <span class="flex items-center justify-center gap-2 flex-col">
                                <ColorPicker v-model="hexColorInputVal" inline />
                                <InputMask v-model="hexColorInputVal" fluid size="small" mask="#******"
                                    :default-value="'000000'" placeholder="#hexColor" class="hex-color-input" />
                            </span>
                        </Popover>

                    </div>



                    <!-- Errors -->
                    <div class="errors" v-if="$form.accentColor?.invalid">
                        <p v-for="err in $form.accentColor?.errors">
                            - {{ err?.message || 'Invalid Input!' }}
                        </p>
                    </div>

                </span>

                <!-- Action Row -->
                <span class="form-actions-footer">

                    <!-- Submit/Save -->
                    <Button unstyled type="submit"
                        class="bg-zinc-500/80 flex items-center justify-center gap-0.75 p-1 rounded-md cursor-pointer active:scale-95 transition-all drop-shadow-md drop-shadow-black/40">
                        <!-- <Iconify /> -->
                        <CheckIcon :size="20" />
                        <p class="flex sm:hidden!"> Save </p>
                        <p class="hidden sm:flex!"> Save Changes </p>
                    </Button>

                </span>

            </Form>

        </div>


    </div>
</template>


<style scoped>

    @reference '@/styles/main.css';

    .hex-color-input {
        @apply !p-1 !px-1.25 !text-sm;
        --p-inputtext-placeholder-color: color-mix(in oklab, var(--color-white) 45%, transparent) !important;
        --p-inputtext-border-color: color-mix(in oklab, var(--color-white) 45%, transparent) !important;
        --p-inputtext-hover-border-color: color-mix(in oklab, var(--color-white) 65%, transparent) !important;
        --p-inputtext-color: color-mix(in oklab, var(--color-white) 75%, transparent) !important;
    }


    .tab-content-wrap {
        /* Root & Override Variables */
        --p-inputtext-placeholder-color: color-mix(in oklab, var(--color-white) 45%, transparent) !important;

        @apply flex flex-col gap-1 p-7 items-center justify-center w-full h-fit grow;
    }

    .preferences-form {
        @apply bg-surface border-2 border-ring rounded-md gap-2 p-3 mb-4 w-full max-w-135 flex justify-start items-center flex-col flex-wrap drop-shadow-md drop-shadow-black/35;
    }

    .input-group {
        @apply w-full flex gap-1 flex-col items-center justify-center flex-wrap h-fit;

        .label {
            @apply w-full p-0.5 flex flex-row gap-1 items-center justify-between flex-nowrap font-bold;
        }

        .input {
            @apply w-full;
        }

        .errors {
            @apply text-red-400 text-sm font-semibold w-full flex flex-col flex-wrap gap-0.75;
        }
    }

    .form-actions-footer {
        @apply mt-1 w-full flex flex-row gap-1 px-1 flex-wrap items-center justify-end;
    }

</style>