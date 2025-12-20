<script lang="ts" setup>
    import { zodResolver } from '@primevue/forms/resolvers/zod';
    import z, { ZodError, ZodObject } from 'zod';
    import { ArrowRightIcon, CheckIcon, PencilIcon, ArrowLeft, Trash2Icon, UserCheckIcon, BaselineIcon, SmileIcon, UsersRoundIcon } from 'lucide-vue-next';
    import { useConfirm } from 'primevue';
    import EmojiPicker from 'vue3-emoji-picker'
    import 'vue3-emoji-picker/css'
    import type { PopoverMethods } from 'primevue';
    import type { FormInstance, FormSubmitEvent } from '@primevue/forms/form';
    import InputTitle from '../../labels/inputTitle.vue'

    // Services:
    const confirm = useConfirm();

    // Main Panel Visibility & Mode
    const isVisible = defineModel<boolean>('isVisible');
    const actionMode = ref<'Edit' | 'New'>('New')

    // Editing - RSVP ID to edit:
    const editingId = ref<string | null>(null)

    // Main Form Ref:
    const rsvpFormRef = ref<FormInstance>();

    // Emoji Picker - Ref
    const emojiPickerPORef = ref<PopoverMethods>(null as any);

    // Form v-modal Values:
    const RsvpFormValues = ref({
        name: '',
        emoji: '',
        capacity: 1
    })

    // Form Schema & Restraints:
    const maxRsvpCapacity = ref(10);


    const RsvpFormSchema = z.object({
        name: z.string("Invalid Title").trim().min(1, "Title must be at least 1 character.").max(32, "Title cannot exceed 32 characters."),
        emoji: z.string()
            .regex(/^\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*$/u, "Please enter a valid emoji.")
            .or(z.literal("")),
        capacity: z.number().min(1, 'Capacity must be greater than or equal to 1.').max(maxRsvpCapacity.value, `Capacity must be less than or equal to ${maxRsvpCapacity.value}! <br> Upgrade your bot for higher limits!`)
    })




    // Reset RSVP Form:
    const resetRsvpForm = () => {
        RsvpFormValues.value = ({
            name: '',
            emoji: '',
            capacity: 1
        });
    }


    // Confirm - RSVP Deletion:
    const confirmRSVPDelete = () => {
        confirm.require({
            header: 'Please Confirm',
            message: "Are you sure you'd like to remove this RSVP option? This action cannot be undone!",
            accept: () => {
                emits('deleteRsvp', editingId.value as string)
                isVisible.value = false;
            },
            reject: () => { return }
        })
    }


    // On Mounted/Opened/Closed - Auto Reset:
    watch(isVisible, (isVis) => {
        if (!isVis) {
            resetRsvpForm();
            rsvpFormRef.value?.reset();
            editingId.value = null;
            actionMode.value = 'New';
        }
    })


    // Start/Init RSVP Edit Fn:
    function startRsvpEdit(id: string, data: { name: string, emoji: string, capacity: number }) {
        actionMode.value = 'Edit';
        editingId.value = id;
        RsvpFormValues.value = {
            name: data.name,
            emoji: data.emoji,
            capacity: data.capacity
        };
        rsvpFormRef.value?.setValues({
            name: data.name,
            emoji: data.emoji,
            capacity: data.capacity
        });
        isVisible.value = true;
    }


    // Submit RSVP Form:
    const submitRsvpForm = (e: FormSubmitEvent) => {
        if (e.valid) {
            // Valid Submission:
            let { name, emoji, capacity } = e.values;
            // Empty Emoji String -> Null
            if (emoji?.trim() == "") {
                emoji = null;
            }
            // If creating new:
            if (actionMode.value == 'New') {
                emits('addRsvp', { name, emoji, capacity });
                isVisible.value = false;
                return
            }
            // If editing existing:
            if (actionMode.value == 'Edit' && editingId.value) {
                emits('editRsvp', editingId.value, { name, emoji, capacity });
                isVisible.value = false;
            }
        }

    }

    // Defined EMITS:
    const emits = defineEmits<{
        addRsvp: [rsvpData: typeof RsvpFormValues.value],
        editRsvp: [rsvpId: string, rsvpData: typeof RsvpFormValues.value],
        deleteRsvp: [rsvpId: string],
    }>();
    // Defined EXPOSE:
    defineExpose({
        startRsvpEdit
    });

</script>


<template>
    <Dialog v-model:visible="isVisible" modal :draggable="false"
        class="bg-zinc-900! text-white! ring-2! ring-ring! m-7!">

        <!-- Header -->
        <template #header class="w-full! grow!">
            <div class="flex flex-row gap-1.25 items-center justify-start grow w-full flex-wrap">
                <UserCheckIcon :size="23" class="" />
                <p class="font-medium text-lg"> {{ actionMode }} RSVP </p>
            </div>
        </template>
        <template #closebutton>
            <span />
        </template>

        <!-- Body / Form -->
        <Form v-slot="$form" ref="rsvpFormRef" class="flex flex-col gap-2 p-2 bg-zinc-700/25 py-5 rounded-md"
            :resolver="zodResolver(RsvpFormSchema)" @submit="submitRsvpForm" :initial-values="RsvpFormValues">

            <!-- INPUT: Title -->
            <div class="flex flex-col gap-1 w-full items-start"
                :class="{ 'text-red-400! ring-red-400!': $form.name?.invalid }">
                <InputTitle fieldTitle="Title" :icon="BaselineIcon" required />
                <inputText name="name" fluid v-model="RsvpFormValues.name" />
                <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                    v-for="err in $form?.name?.errors || []">
                    <p class="text-sm! pl-0.5">
                        {{ err?.message || 'Invalid Input!' }}
                    </p>
                </Message>
            </div>


            <!-- INPUT: Emoji -->
            <div class="flex flex-col gap-1 w-full items-start"
                :class="{ 'text-red-400! ring-red-400!': $form.emoji?.invalid }">
                <InputTitle fieldTitle="Emoji" :icon="SmileIcon" />
                <!-- Emoji Input -->
                <div class="relative w-full cursor-pointer!" @click="(e) => emojiPickerPORef.show(e)">
                    <inputText name="emoji" fluid v-model="RsvpFormValues.emoji" class="relative! z-1 bg-red-500!" />
                    <Button hidden label="🏷️" title="Pick Emoji" unstyled
                        class="absolute! z-5 right-2 top-[10px] grayscale-75 rounded-full"
                        @click="(e) => emojiPickerPORef.show(e)" />
                </div>
                <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                    v-for="err in $form?.emoji?.errors || []">
                    <p class="text-sm! pl-0.5">
                        {{ err?.message || 'Invalid Input!' }}
                    </p>
                </Message>

                <!-- Emoji Picker -->
                <Popover unstyled ref="emojiPickerPORef" class="p-2!">
                    <EmojiPicker disable-skin-tones native theme="dark" @select="(e) => {
                        RsvpFormValues.emoji = e.i;
                        rsvpFormRef?.setFieldValue('emoji', e.i)
                        emojiPickerPORef.hide();
                        rsvpFormRef?.validate('emoji')
                    }" />
                </Popover>
            </div>


            <!-- INPUT: Capacity -->
            <div class="flex flex-col gap-1 w-full items-start"
                :class="{ 'text-red-400! ring-red-400!': $form.capacity?.invalid }">
                <InputTitle fieldTitle="Capacity" :icon="UsersRoundIcon" required />
                <InputNumber name="capacity" v-model="RsvpFormValues.capacity" inputId="horizontal-buttons" showButtons
                    :step="1" :min="1" fluid
                    :pt="{ incrementButton: 'bg-transparent!', decrementButton: 'bg-transparent!' }"
                    :class="{ 'border-red-400!': $form?.capacity?.invalid }" />

                <Message unstyled class="w-full! text-wrap! flex-wrap! mt-1 gap-2 text-red-400!"
                    v-for="err in $form?.capacity?.errors || []">
                    <p class="text-sm! pl-0.5" v-html="err?.message || 'Invalid Input'">
                    </p>
                </Message>
            </div>


        </Form>


        <!-- Footer -->
        <template #footer>
            <!-- Panel Btns -->
            <div class="flex w-full flex-wrap justify-end items-center content-center gap-3 p-2">

                <!-- Cancel Button -->
                <Button @click="isVisible = false"
                    class="gap-0.25! p-2 py-1.75 flex flex-row-reverse items-center content-center justify-center bg-zinc-500 hover:bg-zinc-500/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                    unstyled>
                    <p class="text-sm mx-0.75 font-normal"> Cancel </p>
                    <ArrowLeft hidden :stroke-width="'2'" :size="17" />
                </Button>

                <!-- Delete Button -->
                <Button v-if="actionMode == 'Edit'" @click="confirmRSVPDelete()"
                    class="gap-0.75! p-2 py-1.75 flex flex-row-reverse items-center content-center justify-center bg-red-500/70 hover:bg-red-500/50 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                    unstyled>
                    <p class="text-sm font-medium"> Delete </p>
                    <Trash2Icon :stroke-width="'3'" :size="17" class="scale-90" />
                </Button>

                <!-- Save Button -->
                <Button @click="rsvpFormRef?.submit()"
                    class="gap-0.75! p-2 py-1.75 flex flex-row items-center content-center justify-center bg-emerald-600 hover:bg-emerald-600/80 active:scale-95 transition-all rounded-lg drop-shadow-md flex-wrap cursor-pointer"
                    unstyled>
                    <p class="text-sm font-medium"> Save </p>
                    <CheckIcon :stroke-width="'4'" :size="17" class="scale-90" />
                </Button>

            </div>
        </template>

    </Dialog>
</template>


<style scoped>

    .v3-emoji-picker,
    .v3-emoji-picker.v3-color-theme-dark {
        --v3-picker-bg: var(--color-zinc-900) !important;
    }
</style>