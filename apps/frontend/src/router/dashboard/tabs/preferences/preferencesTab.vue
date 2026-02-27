<script lang="ts" setup>
    import { z } from 'zod'
    import { CheckIcon } from 'lucide-vue-next';
    import { API_GuildPreferencesDefaults, RegExp_HexColorCode, SubscriptionLevel, type APIResponseValue, type SubscriptionLevelType } from '@sessionsbot/shared';
    import PublicSessions from './inputs/fieldGroups/publicSessions.vue';
    import AccentColor from './inputs/fieldGroups/accentColor.vue';
    import AddToCalendar from './inputs/fieldGroups/addToCalendar.vue';
    import ThreadStartMessage from './inputs/fieldGroups/threadMessage/threadStartMessage.vue';
    import SubscriptionPlan from './inputs/fieldGroups/subscriptionPlan.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { API } from '@/utils/api';
    import { useAuthStore } from '@/stores/auth';
    import useNotifier from '@/stores/notifier';
    import { fetchGuildData } from '@/stores/dashboard/dashboard.api';
    import { fa } from 'zod/v4/locales';

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
            thread_message_title: z.string('Invalid Title!').regex(/^[a-zA-Z0-9- %_!&?,.'"`[\](){}@$^\p{Extended_Pictographic}]+$/gu, 'Title includes invalid characters!').min(1, 'Title cannot be empty!').max(45, 'Title cannot exceed 45 characters!').normalize(),
            thread_message_description: z.string('Invalid Description!').max(225, 'Description cannot exceed 225 characters!').normalize()
        })

        /** Form Current Values (v-modeled)*/
        const values = reactive({
            accent_color: API_GuildPreferencesDefaults.accent_color,
            public_sessions: API_GuildPreferencesDefaults.public_sessions,
            calendar_button: API_GuildPreferencesDefaults.calendar_button,
            thread_message_title: API_GuildPreferencesDefaults.thread_message_title,
            thread_message_description: API_GuildPreferencesDefaults.thread_message_description
        })
        type FieldName = keyof typeof values

        /** `Boolean` represent weather the form values have been modified since mount. */
        const touched = ref(false)

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
                submitState.value = 'loading'
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
                    if (fields.thread_message_description == API_GuildPreferencesDefaults.thread_message_description)
                        fields.thread_message_description = "DEFAULT";
                    // Send API Update/Patch Request:
                    const access_token = auth.session?.access_token
                    if (!access_token) throw { display_error: 'Cannot update guild preferences - No access token....' };
                    if (!dashboard.guildId) throw { display_error: 'Cannot update guild preferences - No guild selected....' };

                    const result = await API.patch<APIResponseValue>(`/guilds/${dashboard.guildId}/preferences`, { data: fields }, {
                        headers: {
                            Authorization: `Bearer ${access_token}`
                        }
                    })

                    // Read API Req Results:
                    if (result.data.success) {
                        console.info('API Success', result.data)
                        submitState.value = 'success'
                        touched.value = false;
                        dashboard.guildData.guild.state = await fetchGuildData(dashboard.guildId)
                    } else throw { display_error: 'API Request - Failed - ' + `Error - ${result.status}` }
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
            touched,
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
        const guildPrefData = computed(() => dashboard.guildData.guild.state)
        // Apply Guild Preferences to Form:
        preferenceForm.values.accent_color = subscription?.value?.limits?.CUSTOM_ACCENT_COLOR
            ? guildPrefData.value?.accent_color ?? API_GuildPreferencesDefaults.accent_color
            : API_GuildPreferencesDefaults.accent_color;
        preferenceForm.values.public_sessions = guildPrefData.value?.public_sessions ?? API_GuildPreferencesDefaults.public_sessions
        preferenceForm.values.calendar_button = guildPrefData.value?.calendar_button ?? API_GuildPreferencesDefaults.calendar_button
        preferenceForm.values.thread_message_title = subscription?.value?.limits?.CUSTOM_THREAD_START_MESSAGE
            ? guildPrefData.value?.thread_message_title ?? API_GuildPreferencesDefaults.thread_message_title
            : API_GuildPreferencesDefaults.thread_message_title;
        preferenceForm.values.thread_message_description = subscription?.value?.limits?.CUSTOM_THREAD_START_MESSAGE
            ? guildPrefData.value?.thread_message_description ?? API_GuildPreferencesDefaults.thread_message_description
            : API_GuildPreferencesDefaults.thread_message_description;

        // Watch form 'Dirty' state:
        preferenceForm.touched.value = false;
        watchOnce(preferenceForm.values, (v) => {
            preferenceForm.touched.value = true;
        })
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

                <!-- Change Plan - Dev Buttons -->
                <span
                    class="w-fit m-2 p-2 rounded-md bg-bg-2 border border-text-soft flex flex-wrap items-center gap-2">
                    <p class="text-xs font-bold w-full opacity-50">
                        DEV ONLY - Control Subscription Level:
                    </p>
                    <Button unstyled @click="dashboard.guildData.subscription.state = SubscriptionLevel.FREE"
                        class="button-base p-1 px-2 bg-brand-1/70 hover:bg-brand-1/50 active:bg-brand-1/60 active:scale-95">
                        Free
                    </Button>
                    <Button unstyled @click="dashboard.guildData.subscription.state = SubscriptionLevel.PREMIUM"
                        class="button-base p-1 px-2 bg-brand-1/70 hover:bg-brand-1/50 active:bg-brand-1/60 active:scale-95">
                        Premium
                    </Button>
                    <Button unstyled @click="dashboard.guildData.subscription.state = SubscriptionLevel.ENTERPRISE"
                        class="button-base p-1 px-2 bg-brand-1/70 hover:bg-brand-1/50 active:bg-brand-1/60 active:scale-95">
                        Enterprise
                    </Button>
                </span>


                <!-- Action(s) Row -->
                <span class="form-actions-footer">

                    <!-- Submit/Save -->
                    <Button unstyled class="button-base flex-row! pl-1 pr-1.5! flex-nowrap! bg-bg-4 hover:bg-bg-4/80"
                        :class="{
                            'scale-95! opacity-50!': preferenceForm.submitState.value == 'failed',
                            'bg-invalid-soft!': preferenceForm.submitState.value == 'failed',
                            'bg-emerald-500/50!': preferenceForm.submitState.value == 'success',
                        }" @click="preferenceForm.submit"
                        :disabled="preferenceForm.submitState.value != 'idle' || preferenceForm.touched.value == false">
                        <CheckIcon :size="20" />
                        <p class="flex sm:hidden!"> Save </p>
                        <p class="hidden sm:flex!"> Save Changes </p>
                    </Button>

                </span>

                <!-- Debug View -->
                <span hidden class="p-3 w-full block items-center justify-center bg-white/7 border-2 border-white/20">

                    <span
                        v-html="JSON.stringify(preferenceForm.values, null, '<br>').replace(/}$/, '') + '<br>}' || {}" />

                    Touched: {{ preferenceForm.touched }}
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
        @apply flex flex-col gap-1 p-7 items-center justify-center max-w-full h-fit;
    }

    .preferences-form {
        @apply bg-bg-2 gap-2.5 p-3 mb-4 w-full max-w-125 border-2 border-ring-soft rounded-md flex justify-start items-center flex-col flex-wrap drop-shadow-sm drop-shadow-black/25;
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