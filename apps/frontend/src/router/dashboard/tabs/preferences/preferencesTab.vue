<script lang="ts" setup>
    import { z } from 'zod'
    import { CheckIcon } from 'lucide-vue-next';
    import { API_GuildPreferencesDefaults, RegExp_HexColorCode, type APIResponseValue, type SubscriptionLevelType } from '@sessionsbot/shared';
    import PublicSessions from './inputs/fieldGroups/publicSessions.vue';
    import AccentColor from './inputs/fieldGroups/accentColor.vue';
    import AddToCalendar from './inputs/fieldGroups/addToCalendar.vue';
    import ThreadStartMessage from './inputs/fieldGroups/threadMessage/threadStartMessage.vue';
    import SubscriptionPlan from './inputs/fieldGroups/subscriptionPlan.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { API } from '@/utils/api';
    import { useAuthStore } from '@/stores/auth';
    import useNotifier from '@/stores/notifier';
    import { externalUrls } from '@/stores/nav';

    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore();
    const subscription = computed(() => dashboard.guildData.subscription.state as SubscriptionLevelType)

    // Root Preference Form States & Methods:
    const usePreferencesForm = () => {

        /** Form Schema / Validation */
        const schema = z.object({
            accent_color: z.string("Invalid Accent Color!").regex(RegExp_HexColorCode, 'Invalid Hex Color Code!'),
            public_sessions: z.boolean("Invalid Choice!"),
            calendar_button: z.boolean("Invalid Choice!"),
            thread_message_title: z.string('Invalid Title!').transform((v: string) => v.replace('### ', '')).pipe(z.string().regex(/^[a-zA-Z0-9%_ !&?,.\p{Extended_Pictographic}]+$/gu, 'Title cannot include special characters!').min(1, 'Title cannot be empty!').max(45, 'Title cannot exceed 45 characters!').normalize()),
            thread_message_description: z.string('Invalid Description!').max(225, 'Description cannot exceed 225 characters!').normalize()
        })

        /** Form Current Values (v-modeled)*/
        const values = reactive({
            accent_color: '#777777',
            public_sessions: true,
            calendar_button: true,
            thread_message_title: 'DEFAULT',
            thread_message_description: 'DEFAULT'
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
        const submitState = ref<'idle' | 'loading' | 'success' | 'failed'>('idle')
        async function submit() {
            try {
                submitState.value = 'idle'
                console.info(`{i} Form Submission`)
                // Validate Form Fields:
                const validation = z.safeParse(schema, values)
                if (!validation.success) {
                    // Input Errors - Return:
                    submitState.value = 'failed'
                    const input_errors = z.treeifyError(validation.error)
                    return console.warn('Invalid Submission!', { input_errors, values })
                } else {
                    // Valid Submission - Parse Validated Data:
                    errors.value.clear()
                    let fields = validation.data;
                    // Prepare API Req Data - Default Thread Start Msg(s):
                    if (fields.thread_message_title == API_GuildPreferencesDefaults.thread_message_title)
                        fields.thread_message_title = "DEFAULT";
                    else
                        fields.thread_message_title = '### ' + fields.thread_message_title
                    if (fields.thread_message_description == API_GuildPreferencesDefaults.thread_message_description)
                        fields.thread_message_description = "DEFAULT";
                    // Send API Update/Patch Request:
                    const access_token = auth.session?.access_token
                    if (!access_token) throw { display_error: 'Cannot update guild preferences - No access token....' };
                    if (!dashboard.guildId) throw { display_error: 'Cannot update guild preferences - No guild selected....' };

                    console.info('Sending API Req', { fields })

                    const result = await API.patch<APIResponseValue>(`/guilds/${dashboard.guildId}/preferences`, { data: fields }, {
                        headers: {
                            Authorization: `Bearer ${access_token}`
                        }
                    })

                    // Read API Req Results:
                    if (result.data.success) {
                        console.info('API Success', result.data)
                        submitState.value = 'success'
                    } else throw { display_error: 'API Request - Failed - ' + result.data.error }
                }
            } catch (err: any) {
                // Submission - Error:
                const display_error = err?.display_error
                // Show Alert:
                submitState.value = 'failed'
                const notifier = useNotifier();
                notifier.send({
                    level: 'error',
                    header: 'Failed to Update!',
                    content: display_error
                        ? `We failed to update your server's preferences! <br> <span class="text-xs opacity-55"> Reason: ${display_error} </span>`
                        : `We failed to update your server's preferences! <br> <span class="text-xs opacity-55"> Reason: UNKNOWN </span>`,
                    actions: [
                        {
                            button: { title: 'Get Support', href: externalUrls.discordServer.supportInvite }
                        }
                    ]
                })
            } finally {
                // Reset Submit State:
                setTimeout(() => {
                    submitState.value = 'idle'
                }, 2_000)
            }
        }

        return {
            schema,
            values,
            errors,
            validateFields,
            submitState,
            submit,
        }
    }
    const preferenceForm = usePreferencesForm()
    export type PreferenceFormInterface = z.infer<typeof preferenceForm.schema>
    export type PreferenceFormFields = keyof PreferenceFormInterface


    // Test  - Load Real Existing Prefs:
    onMounted(() => {
        console.info('Preferences Tab Mounted')
        preferenceForm.values.accent_color = '#9e54e8'
        preferenceForm.values.public_sessions = true
        preferenceForm.values.calendar_button = true
        preferenceForm.values.thread_message_title = 'DEFAULT'
        preferenceForm.values.thread_message_description = 'DEFAULT'
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

            <p class="mx-4 pt-1 text-sm text-start w-full text-text-1/70">
                Review your server wide preferences, this changes how things work with Sessions Bot across your <b>whole
                    server</b>.
            </p>
        </span>

        <!-- Content Wrap -->
        <div class="tab-content-wrap">

            <!-- Preferences - Form/Inputs -->
            <div class="preferences-form">


                <!-- Input - Public Sessions -->
                <PublicSessions v-model:field-value="preferenceForm.values.public_sessions"
                    :input-errors="preferenceForm.errors.value.get('public_sessions') || []"
                    @validate="preferenceForm.validateFields(['public_sessions'])" />


                <!-- Input - Enable Add to Calendar Button -->
                <AddToCalendar v-model:field-value="preferenceForm.values.calendar_button"
                    :input-errors="preferenceForm.errors.value.get('calendar_button') || []"
                    @validate="preferenceForm.validateFields(['calendar_button'])" />


                <!-- Input - Accent Color -->
                <AccentColor v-model:field-value="preferenceForm.values.accent_color"
                    :input-errors="preferenceForm.errors.value.get('accent_color') || []"
                    @validate="preferenceForm.validateFields(['accent_color'])" :subscription />


                <!-- Input - Thread Start Message -->
                <ThreadStartMessage v-model:field-title="preferenceForm.values.thread_message_title"
                    v-model:field-description="preferenceForm.values.thread_message_description"
                    :input-errors="preferenceForm.errors.value" :subscription
                    @validate="preferenceForm.validateFields(['thread_message_title', 'thread_message_description'])" />


                <!-- Input / Details - Subscription Plan -->
                <SubscriptionPlan />


                <!-- Action(s) Row -->
                <span class="form-actions-footer">

                    <!-- Submit/Save -->
                    <Button unstyled type="submit" :disabled="preferenceForm.submitState.value != 'idle'"
                        class="bg-bg-4 hover:bg-bg-4/80 flex items-center justify-center gap-0.75 p-1 rounded-md cursor-pointer active:scale-95 transition-all drop-shadow-sm drop-shadow-black/25"
                        :class="{
                            'scale-95! opacity-50!': preferenceForm.submitState.value == 'failed',
                            'bg-invalid-soft!': preferenceForm.submitState.value == 'failed',
                            'bg-emerald-500/50!': preferenceForm.submitState.value == 'success',
                        }" @click="preferenceForm.submit">
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

                </span>

            </div>

        </div>


    </div>
</template>


<style scoped>

    @reference '@/styles/main.css';

    :deep(.tab-content-wrap) {
        /* Root & Override Variables */
        --input-background: color-mix(in oklab, var(--color-bg-2), black 12%) !important;
        --p-inputtext-placeholder-color: color-mix(in oklab, var(--color-text-1) 45%, transparent) !important;
        --p-inputtext-background: var(--input-background);
    }

    .tab-content-wrap {
        @apply flex flex-col gap-1 p-7 items-center justify-center w-full h-fit grow;
    }

    .preferences-form {
        @apply bg-bg-2 gap-2.5 p-3 mb-4 w-full max-w-135 border-2 border-ring-soft rounded-md flex justify-start items-center flex-col flex-wrap drop-shadow-md drop-shadow-black/35;
    }

    :deep(.input-group) {
        @apply w-full flex gap-1 flex-col items-center justify-center flex-wrap h-fit;

        .input {
            @apply w-full p-0.5 flex flex-row gap-1 items-center justify-between flex-nowrap;
        }

        .errors {
            @apply text-invalid-1 text-sm font-semibold w-full flex flex-col flex-wrap gap-0.75;
        }
    }

    .form-actions-footer {
        @apply mt-1 w-full flex flex-row gap-1 px-1 flex-wrap items-center justify-end;
    }

</style>