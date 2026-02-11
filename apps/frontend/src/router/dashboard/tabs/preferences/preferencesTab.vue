<script lang="ts" setup>
    import { z } from 'zod'
    import { CheckIcon } from 'lucide-vue-next';
    import { RegExp_HexColorCode } from '@sessionsbot/shared';
    import PublicSessions from './inputs/fieldGroups/publicSessions.vue';
    import AccentColor from './inputs/fieldGroups/accentColor.vue';
    import AddToCalendar from './inputs/fieldGroups/addToCalendar.vue';
    import ThreadStartMessage from './inputs/fieldGroups/threadMessage/threadStartMessage.vue';

    // Root Preference Form States & Methods:
    const usePreferencesForm = () => {

        /** Form Schema / Validation */
        const schema = z.object({
            accentColor: z.string().regex(RegExp_HexColorCode, 'Invalid hex color code!'),
            publicSessions: z.boolean(),
            addToCalendarButton: z.boolean(),
            threadStartMessageTitle: z.string().transform((s) => s.replace('### ', '')).check(z.regex(/^[a-zA-Z0-9 %_\p{Extended_Pictographic}]+$/gu)),
            threadStartMessageDescription: z.string().max(225).normalize().nullish()
        })

        /** Form Current Values (v-modeled)*/
        const values = reactive({
            accentColor: '#000000',
            publicSessions: true,
            addToCalendarButton: false,
            threadStartMessageTitle: '',
            threadStartMessageDescription: ''
        })
        type FieldName = keyof typeof values

        /** Current Form Input Errors - Map */
        const errors = ref<Map<FieldName, string[]>>(new Map());

        /** Method - Validate Specified Form Fields */
        function validateFields(fields: PreferenceFormFields[]) {
            for (const field of fields) {
                const fieldSchema = schema.shape[field]
                const result = fieldSchema.safeParse(values[field])

                if (!result.success) {
                    const errs = z.treeifyError(result.error as any)
                    errors.value.set(
                        field,
                        errs?.errors || []
                    )
                } else {
                    errors.value.delete(field)
                }
            }
        }

        /** Method - Form Submission */
        function submit() {
            console.info(`{i} Form Submission`)
        }

        return {
            schema,
            values,
            errors,
            validateFields,
            submit,
        }
    }
    const preferenceForm = usePreferencesForm()
    export type PreferenceFormInterface = z.infer<typeof preferenceForm.schema>
    export type PreferenceFormFields = keyof PreferenceFormInterface


    // Test  - Load Real Existing Prefs:
    onMounted(() => {
        console.info('Preferences Tab Mounted')
        preferenceForm.values.accentColor = '#123123'
        preferenceForm.values.publicSessions = true
        preferenceForm.values.addToCalendarButton = true
        preferenceForm.values.threadStartMessageTitle = 'DEFAULT'
        preferenceForm.values.threadStartMessageDescription = 'DEFAULT'
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
            <div class="preferences-form">


                <!-- Input - Public Sessions -->
                <PublicSessions v-model:field-value="preferenceForm.values.publicSessions"
                    :input-errors="preferenceForm.errors.value.get('publicSessions') || []"
                    @validate="preferenceForm.validateFields(['publicSessions'])" />


                <!-- Input - Enable Add to Calendar Button -->
                <AddToCalendar v-model:field-value="preferenceForm.values.addToCalendarButton"
                    :input-errors="preferenceForm.errors.value.get('addToCalendarButton') || []"
                    @validate="preferenceForm.validateFields(['addToCalendarButton'])" />


                <!-- Input - Accent Color -->
                <AccentColor v-model:field-value="preferenceForm.values.accentColor"
                    :input-errors="preferenceForm.errors.value.get('accentColor') || []"
                    @validate="preferenceForm.validateFields(['accentColor'])" />




                <!-- Input - Thread Start Message -->
                <ThreadStartMessage v-model:field-title="preferenceForm.values.threadStartMessageTitle"
                    v-model:field-description="preferenceForm.values.threadStartMessageDescription"
                    :input-errors="preferenceForm.errors.value"
                    @validate="preferenceForm.validateFields(['threadStartMessageTitle', 'threadStartMessageDescription'])" />


                <!-- Action(s) Row -->
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

                <!-- Debug View -->
                <span hidden class="p-3 w-full block items-center justify-center bg-white/7 border-2 border-white/20">

                    <span
                        v-html="JSON.stringify(preferenceForm.values, null, '<br>').replace(/}$/, '') + '<br>}' || {}" />


                    <span>
                        {{ preferenceForm.errors.value }}
                    </span>
                </span>

            </div>

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
        --p-inputtext-background: color-mix(in oklab, var(--color-white) 7%, transparent) !important;

        @apply flex flex-col gap-1 p-7 items-center justify-center w-full h-fit grow;
    }

    .preferences-form {
        @apply bg-surface gap-2.5 p-3 mb-4 w-full max-w-135 border-2 border-ring rounded-md flex justify-start items-center flex-col flex-wrap drop-shadow-md drop-shadow-black/35;
    }

    :deep(.input-group) {
        @apply w-full flex gap-1 flex-col items-center justify-center flex-wrap h-fit;

        .input {
            @apply w-full p-0.5 flex flex-row gap-1 items-center justify-between flex-nowrap;
        }

        .errors {
            @apply text-red-400 text-sm font-semibold w-full flex flex-col flex-wrap gap-0.75;
        }
    }

    .form-actions-footer {
        @apply mt-1 w-full flex flex-row gap-1 px-1 flex-wrap items-center justify-end;
    }

</style>