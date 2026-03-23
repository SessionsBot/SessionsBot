<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import type { APIResponseValue, Database } from '@sessionsbot/shared';
    import { CheckIcon, XIcon } from 'lucide-vue-next';
    import type { FormInstance, FormSubmitEvent } from '@primevue/forms/form';
    import { zodResolver } from '@primevue/forms/resolvers/zod';
    import z, { iso } from 'zod'
    import { DateTime } from 'luxon';
    import useNotifier from '@/stores/notifier';
    import { API } from '@/utils/api';


    // Services:
    const dashboard = useDashboardStore();
    const notifier = useNotifier();

    // Incoming Props/Models:
    const props = defineProps<{
        session: Database['public']['Tables']['sessions']['Row'] | undefined
    }>()
    const showSessionDialog = defineModel<boolean>('showSessionDialog')
    const dialogAction = defineModel<'delay' | 'cancel'>('dialogAction')

    // Session Vars:
    const sessionStartLocal = computed(() => DateTime.fromISO(String(props.session?.starts_at_utc), { zone: 'utc' })?.toLocal() ?? null)

    // Form:
    const formRef = ref<FormInstance>()
    const resolver = computed(() => {
        // Reason Schema:
        const reasonSchema = z.nullish(
            z.string()
                .max(100, 'Reason cannot exceed 100 characters.')
                .normalize()
                .transform(s => !s.trim()?.length ? null : s)
        );

        // Return Resolver:
        if (dialogAction.value == 'delay') {
            // Delay Resolver:
            return zodResolver(z.object({
                reason: reasonSchema,
                newStartDate: z.date('Please enter a valid start date!')
                    .refine(d => {
                        const dt = DateTime.fromJSDate(d)
                        if (dt < sessionStartLocal.value) {
                            // Date CANNOT be before original start:
                            return false
                        }
                        return true
                    }, 'New start date must be AFTER current start date!')
                    .transform(d => {
                        return DateTime.fromJSDate(d)?.toUTC()?.toISO()
                    })
            }))
        } else {
            // Cancel Resolver:
            return zodResolver(z.object({
                reason: reasonSchema,
            }))
        }
    })


    const submitState = ref<'idle' | 'loading' | 'failed' | 'success'>('idle')
    async function dialogSubmit(e: FormSubmitEvent) {
        submitState.value = 'loading'
        try {
            if (e.valid) {
                // Valid Submission:
                const sessionId = props.session?.id
                const guildId = props.session?.guild_id
                const reqUrl = dialogAction.value == 'cancel'
                    ? API.getUri() + `/guilds/${guildId}/sessions/${sessionId}/cancel`
                    : API.getUri() + `/guilds/${guildId}/sessions/${sessionId}/delay`
                const reqBody = {
                    reason: e.values?.reason ?? null,
                    new_start_iso: e.values?.newStartDate ?? null
                }
                console.log('VALID - Test URL:', { reqUrl, reqBody })
                // Make API Request:
                const { data: result } = await API.patch<APIResponseValue>(reqUrl, reqBody)
                if (!result || !result?.success) {
                    // API Failure:
                    console.warn('API Failure - Session Delay/Cancel API', { result })
                    submitState.value = 'failed'
                } else {
                    // API Success:
                    submitState.value = 'success'
                    showSessionDialog.value = false;
                    notifier.send({
                        level: 'success',
                        header: `Session ${dialogAction.value == 'cancel' ? 'Canceled' : 'Delayed'}!`
                    })
                    // Quiet Refetch Sessions:
                    dashboard.refetchData('sessions')
                }

            } else {
                submitState.value = 'failed'
                // Invalid Submission:
                notifier.send({
                    level: 'warn',
                    header: 'Invalid Fields',
                    content: 'Fix the invalid fields within the form and try again!',
                    actions: false
                })
            }
        } catch (error) {
            // Session Action Form - FAILURE:
            submitState.value = 'failed'
            console.error('Failed to submit session action dialog form!', error)
            notifier.send({
                level: 'warn',
                header: 'Error Occurred',
                content: 'Confirm input values are correct, if issue persist get in touch with support!',
            })
        } finally {
            setTimeout(() => {
                submitState.value = 'idle'
            }, 2_000);
        }
    }

</script>


<template>
    <Dialog :visible="showSessionDialog" modal block-scroll
        class="border-2! border-ring-soft! bg-bg-soft! p-0 m-7 max-w-[90%] w-70">
        <template #container>
            <Form v-slot="$form" ref="formRef" :resolver="resolver" @submit="dialogSubmit" class="flex flex-col w-full">

                <!-- Header -->
                <div class="flex flex-row gap-7 border-b-2 border-ring-soft items-center justify-between p-2.5">
                    <!-- Title -->
                    <span v-if="dialogAction == 'delay'"
                        class="flex text-amber-700 dark:text-amber-500 gap-0.75 flex-row flex-center">
                        <Iconify icon="tabler:clock-up" />
                        <p class="font-bold text-lg">
                            Delay Session
                        </p>
                    </span>
                    <span v-else class="flex text-invalid-1 gap-0.75 flex-row flex-center">
                        <Iconify icon="basil:cancel-outline" />
                        <p class="font-bold text-lg opacity-80">
                            Cancel Session
                        </p>
                    </span>
                    <!-- Close Button -->
                    <Button @click="showSessionDialog = false" unstyled
                        class="button-base button-secondary aspect-square! bg-bg-1/0">
                        <XIcon :size="22"
                            class="min-w-fit! opacity-85 hover:opacity-90 transition-all aspect-square!" />
                    </Button>
                </div>

                <!-- Content -->
                <div class="flex p-3 gap-2.5 px-7 flex-col flex-center overflow-auto!">

                    <!-- Session Details -->
                    <div class="bg-bg-3 rounded p-2 flex flex-center flex-col gap-2">
                        <p>
                            {{ session?.title }}
                        </p>
                        <p class="text-xs opacity-70 font-semibold">
                            {{ sessionStartLocal.toFormat('f') }}
                        </p>
                    </div>


                    <!-- Delay Time Input -->
                    <div v-if="dialogAction == 'delay'" class="w-full flex flex-col gap-0.5">
                        <InputLabel title="New Start Time" icon-name="mdi:text" required />
                        <DatePicker name="newStartDate" size="small" show-time hour-format="12"
                            :min-date="sessionStartLocal?.toJSDate()" placeholder="Select a Date..." :maxlength="100" />
                        <p v-for="err in $form?.newStartDate?.errors" class="text-xs font-semibold p-1 text-invalid-1">
                            - {{ String(err?.message) }}
                        </p>
                    </div>


                    <!-- Reason Input -->
                    <div class="w-full flex flex-col gap-0.5">
                        <InputLabel title="Reason" icon-name="mdi:text" show-optional />
                        <InputText name="reason" size="small" placeholder="No longer needed..." :maxlength="100" />
                        <p v-for="err in $form?.reason?.errors"
                            class="text-xs font-semibold p-1 text-invalid-1 text-wrap">
                            {{ String(err?.message) }}
                        </p>
                    </div>

                </div>

                <!-- Footer -->
                <div class="flex flex-row gap-4 items-center justify-end p-5">
                    <!-- Save Button -->
                    <Button type="submit" unstyled class="button-base button-secondary px-1.5"
                        :disabled="submitState != 'idle'" :class="{
                            'scale-95 opacity-65': submitState != 'idle',
                        }">
                        <Transition name="fade" mode="out-in">
                            <span v-if="submitState == 'idle'" class="flex flex-row flex-center flex-wrap">
                                <CheckIcon :size="22" class="min-w-fit! aspect-square!" />
                                <p class="font-bold pr-0.75"> Confirm </p>
                            </span>
                            <span v-else-if="submitState == 'loading'" class="flex flex-row flex-center flex-wrap">
                                <CheckIcon :size="22" class="min-w-fit! aspect-square!" />
                                <p class="font-bold pr-0.75"> Loading </p>
                            </span>
                            <span v-else-if="submitState == 'failed'"
                                class="text-invalid-1 flex flex-row flex-center flex-wrap">
                                <XIcon :size="22" class="min-w-fit! aspect-square!" />
                                <p class="font-bold pr-0.75"> Failed </p>
                            </span>
                            <span v-else-if="submitState == 'success'"
                                class="text-emerald-700/80 flex flex-row flex-center flex-wrap">
                                <CheckIcon :size="22" class="min-w-fit! aspect-square!" />
                                <p class="font-bold pr-0.75"> Saved </p>
                            </span>
                        </Transition>
                    </Button>
                </div>

            </Form>
        </template>
    </Dialog>
</template>


<style scoped></style>