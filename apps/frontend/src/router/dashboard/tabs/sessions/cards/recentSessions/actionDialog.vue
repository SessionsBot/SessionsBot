<script lang="ts" setup>
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import type { Database } from '@sessionsbot/shared';
    import { CheckIcon, XIcon } from 'lucide-vue-next';
    import InputLabel from '../../../preferences/inputs/inputLabel.vue';
    import type { FormInstance, FormSubmitEvent } from '@primevue/forms/form';
    import { zodResolver } from '@primevue/forms/resolvers/zod';
    import z from 'zod'
    import { DateTime } from 'luxon';


    // Services:
    const dashboard = useDashboardStore()

    // Incoming Props/Models:
    const props = defineProps<{
        session: Database['public']['Tables']['sessions']['Row'] | undefined
    }>()
    const showSessionDialog = defineModel<boolean>('showSessionDialog')
    const dialogAction = defineModel<'delay' | 'cancel'>('dialogAction')

    // Form:
    const formRef = ref<FormInstance>()
    const resolver = computed(() => {
        if (dialogAction.value == 'delay') {
            return zodResolver(z.object({
                reason: z.nullish(z.string().max(100, 'Reason cannot exceed 100 characters.').normalize()),
                delayTime: z.string('Please enter a valid delay time.')
            }))
        } else {
            return zodResolver(z.object({
                reason: z.nullish(z.string('Please enter a valid reason.').max(100, 'Reason cannot exceed 100 characters.').normalize()),
            }))
        }
    })

    async function dialogSubmit(e: FormSubmitEvent) {
        console.info('Dialog Submitted', e.valid, e)
    }


</script>


<template>
    <Dialog :visible="showSessionDialog" modal block-scroll
        class="border-2! border-ring-soft! bg-bg-soft! p-0 m-7 max-w-[90%]">
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
                        <XIcon :size="22" class="min-w-fit! aspect-square!" />
                    </Button>
                </div>

                <!-- Content -->
                <div class="flex p-3 gap-2.5 w-full flex-col flex-center overflow-y-auto">

                    <!-- Session Details -->
                    <div class="bg-bg-3 rounded p-2 flex flex-center flex-col gap-2">
                        <p>
                            {{ session?.title }}
                        </p>
                        <p class="text-xs opacity-70 font-semibold">
                            {{ DateTime.fromISO(String(session?.starts_at_utc), { zone: 'utc' }).toFormat('f') }}
                        </p>
                    </div>


                    <!-- Delay Time Input -->
                    <div v-if="dialogAction == 'delay'" class="w-full flex flex-col gap-0.5">
                        <InputLabel title="Time to Delay Start by" icon-name="mdi:text" />
                        <InputText name="delayTime" placeholder="15 mins" :maxlength="100" />
                        <p v-for="err in $form?.delayTime?.errors" class="text-xs font-semibold p-1 text-invalid-1">
                            {{ String(err?.message) }}
                        </p>
                    </div>


                    <!-- Reason Input -->
                    <div class="w-full flex flex-col gap-0.5">
                        <InputLabel title="Reason" icon-name="mdi:text" />
                        <InputText name="reason" placeholder="No longer needed..." :maxlength="100" />
                        <p v-for="err in $form?.reason?.errors" class="text-xs font-semibold p-1 text-invalid-1">
                            {{ String(err?.message) }}
                        </p>
                    </div>

                </div>

                <!-- Footer -->
                <div class="flex flex-row gap-4 items-center justify-end p-3">
                    <!-- Save Button -->
                    <Button type="submit" unstyled class="button-base button-secondary">
                        <CheckIcon :size="22" class="min-w-fit! aspect-square!" />
                        <p class="font-bold pr-0.75"> Confirm </p>
                    </Button>
                </div>

            </Form>
        </template>
    </Dialog>
</template>


<style scoped></style>