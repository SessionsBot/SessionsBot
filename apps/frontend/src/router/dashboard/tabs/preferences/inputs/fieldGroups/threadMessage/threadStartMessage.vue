<script lang="ts" setup>
    import InputLabel from '../../inputLabel.vue';
    import type { PreferenceFormFields } from '../../../preferencesTab.vue';
    import useNotifier from '@/stores/notifier';
    import { XIcon } from 'lucide-vue-next';
    import DiscordEditor from './DiscordEditor/DiscordEditor.vue';
    import MessagePreview from './DiscordEditor/Previewer.vue'
    import ReplaceableTextKey from './ReplaceableTextKey.vue';
    import { API_GuildPreferencesDefaults, type SubscriptionLevelType } from '@sessionsbot/shared';

    // Services:
    const notifier = useNotifier();

    // Props
    const props = defineProps<{
        inputErrors: Map<PreferenceFormFields, string[] | undefined>,
        subscription: SubscriptionLevelType
    }>()

    // Field Value - Modal:
    const fieldTitle = defineModel<string>('fieldTitle')
    const fieldDescription = defineModel<string>('fieldDescription')

    // Emits:
    const emits = defineEmits<{
        validate: []
    }>()

    // Field - Input Errors:
    const fieldErrors = computed(() => {
        let r = [];
        if (props.inputErrors.get('thread_message_title')?.length) {
            r.push(...props.inputErrors.get('thread_message_title') as string[])
        }
        if (props.inputErrors.get('thread_message_description')?.length) {
            r.push(...props.inputErrors.get('thread_message_description') as string[])
        }
        if (r.length) return r
        else return []
    })

    // Default Values:
    const defaultTitle = API_GuildPreferencesDefaults.thread_message_title;
    const defaultDescription = API_GuildPreferencesDefaults.thread_message_description;

    // Display Values
    const displayTitle = computed({
        get() {
            if (fieldTitle.value == 'DEFAULT') return defaultTitle
            else return fieldTitle.value
        },
        set(v: string) {
            fieldTitle.value = v
        }
    })
    const displayDescription = computed({
        get() {
            if (fieldDescription.value == 'DEFAULT') return defaultDescription
            else return fieldDescription.value
        },
        set(v: string) {
            fieldDescription.value = v
        }
    })
    const previewTextValue = computed(() => {
        const titleText = String(displayTitle.value)
        const descText = String(displayDescription.value)
        return ('### ' + titleText + '\n' + descText)
    })


    // Edit Dialog - States & Methods:
    const useEditDialog = () => {

        const isVisible = ref<boolean>(false)

        function attemptEdit() {
            if (!props.subscription || !props.subscription.limits.CUSTOM_THREAD_START_MESSAGE) {
                // not allowed - alert upgrade:
                notifier.send({
                    level: 'upgrade',
                    header: 'Enterprise Feature!',
                    content: `Unfortunately your current subscription plan <b>doesn't allow for you to customize this option</b>! <br> <span class="w-full opacity-50 text-xs italic"> Consider upgrading today - Cancel Anytime!</span>`,
                })
            } else {
                // allowed - show edit form:
                isVisible.value = !isVisible.value
            }
        }

        function attemptClose() {
            if (fieldErrors?.value?.length > 0) {
                // Input Errors - Not Allowed Alert:
                return notifier.send({
                    level: 'error',
                    header: 'Fix Invalid Fields',
                    content: 'Before saving this preference please fix your input errors!',
                    actions: [
                        {
                            button: {
                                title: 'Reset to Default',
                                icon: 'ci:undo',
                            },
                            onClick(e, ctx) {
                                ctx.close();
                                reset()
                            },
                        }
                    ]
                })
            } else {
                // No Errors - Allowed - Close
                isVisible.value = false;
            }
        }

        function reset() {
            console.log('resetting')
            fieldTitle.value = API_GuildPreferencesDefaults.thread_message_title
            fieldDescription.value = API_GuildPreferencesDefaults.thread_message_description
            emits('validate')
        }

        // Return States & Methods:
        return {
            isVisible,
            attemptEdit,
            attemptClose,
            reset
        }
    }
    const editDialog = useEditDialog();

</script>


<template>
    <!-- Input - Public Sessions -->
    <span class="input-group">
        <!-- Label -->
        <InputLabel title="Thread Start Message" icon-name="tabler:message-2-filled" :premium-type="'ENTERPRISE'"
            :doc-path="'/'" />

        <!-- Display (Simulated) Inputs -->
        <div @click="editDialog.attemptEdit()" class="w-full flex flex-col gap-1.5 p-0.5 flex-wrap group/di">

            <!-- Thread Title - Simulated Input -->
            <div class="h-11 w-full p-1.25 py-1.5 bg-(--input-background) flex items-center justify-center border-2 border-ring-soft group-hover/di:border-indigo-300 group-active/di:border-indigo-400 transition-all cursor-pointer rounded-md"
                :class="{
                    'border-red-400!': fieldErrors.length
                }">

                <!-- Display Text -->
                <span class="flex p-1 w-full grow max-w-full overflow-auto text-nowrap flex-nowrap">
                    <p class="font-bold px-1 py-0.5 truncate">
                        {{ displayTitle?.replace('### ', '') }}
                    </p>
                </span>
            </div>

            <!-- Thread Description - Simulated Input -->
            <div class="h-11 w-full p-1.25 py-1.5 bg-(--input-background) flex items-center justify-center border-2 border-ring-soft group-hover/di:border-indigo-300 group-active/di:border-indigo-400 transition-all cursor-pointer rounded-md"
                :class="{
                    'border-red-400!': fieldErrors.length
                }">

                <!-- Display Text -->
                <span class="flex p-1 w-full grow max-w-full overflow-clip text-nowrap flex-nowrap">
                    <p class="font-bold px-1 py-0.5 truncate">
                        {{ displayDescription }}
                    </p>
                </span>
            </div>

        </div>
        <!-- Errors -->
        <div class="errors" v-if="fieldErrors?.length">
            <p v-for="err of fieldErrors" :key="err.slice(0, 15)">
                - {{ err || 'Invalid Input!' }}
            </p>
        </div>



        <!-- Edit - Input Dialog -->
        <Dialog :visible="editDialog.isVisible.value" modal block-scroll class="w-[90%]! max-w-320! m-7! border-0!">
            <template #container="$dialog">
                <div
                    class="flex w-full border-2 border-ring rounded-md shadow-md shadow-black/40 flex-col h-fit overflow-auto">

                    <!-- Header -->
                    <span class="flex flex-col p-2 w-full items-center justify-between border-b-2 border-inherit">

                        <!-- Title & Close Btn -->
                        <span class="flex w-full justify-between items-center gap-4">
                            <!-- Title & Icon -->
                            <div class="flex items-center gap-1 w-full">
                                <Iconify icon="tabler:message-2-filled" />
                                <p class="text-lg font-extrabold">
                                    Thread Start Message
                                </p>
                            </div>


                            <!-- Close Button -->
                            <Button unstyled @click="editDialog.attemptClose()"
                                :class="{ 'opacity-50 text-invalid-1': fieldErrors?.length >= 1 }"
                                class="aspect-square min-w-fit size-7 p-1 flex items-center justify-center hover:bg-white/10 rounded-md cursor-pointer active:scale-95 transition-all">
                                <XIcon />
                            </Button>
                        </span>

                        <!-- Subheading - Description -->
                        <span class="p-1 pb-0 w-full opacity-50 text-xs">
                            This is the message that is sent to any designated "post channel" if there's no existing
                            session thread for the day.
                        </span>
                    </span>


                    <!-- Content -->
                    <span
                        class="flex flex-col overflow-y-auto lg:flex-row items-start justify-start w-full h-fit min-h-fit divide-ring divide-x-2 ">


                        <!-- Inputs - Area -->
                        <span class="flex flex-col p-4 pt-1 gap-2 w-full">

                            <!-- Input - Title -->
                            <span class="input-wrap">
                                <InputLabel title="Thread Title" icon-name="fe:text-size" />
                                <InputText :default-value="displayTitle"
                                    @value-change="(v: string | undefined) => { displayTitle = v; $emit('validate') }"
                                    class="heading-input max-w-120! shadow-sm! shadow-black/30!"
                                    :invalid="inputErrors?.size >= 1" fluid />
                                <!-- Errors -->
                                <div class="input-errors" v-if="inputErrors.get('thread_message_title')?.length">
                                    <p v-for="err of inputErrors.get('thread_message_title')" :key="err.slice(0, 15)">
                                        - {{ err || 'Invalid Input!' }}
                                    </p>
                                </div>
                            </span>

                            <!-- Input - Description -->
                            <span class="input-wrap">
                                <InputLabel title="Description" icon-name="majesticons:text" />
                                <DiscordEditor v-model:text-input-value="displayDescription"
                                    @value-change="(v) => $emit('validate')" />
                                <!-- Errors -->
                                <div class="input-errors" v-if="inputErrors.get('thread_message_description')?.length">
                                    <p v-for="err of inputErrors.get('thread_message_description')"
                                        :key="err.slice(0, 15)">
                                        - {{ err || 'Invalid Input!' }}
                                    </p>
                                </div>
                            </span>

                            <!-- Replacable Text Key -->
                            <ReplaceableTextKey />

                            <p class="underline w-fit self-center text-text-soft text-xs hover:text-text-2 text-center select-none cursor-pointer"
                                @click="editDialog.reset()"> Reset to Default </p>

                        </span>


                        <!-- Preview - Area -->
                        <span
                            class="flex flex-col border-t-2 lg:border-t-0 h-full gap-1 border-ring w-full items-start justify-start p-2 px-4 pb-3.5">

                            <InputLabel title="Preview Message" icon-name="mdi:eye-outline" />
                            <MessagePreview :text-value="previewTextValue" :thread-title="displayTitle" />

                        </span>


                    </span>

                </div>
            </template>
        </Dialog>

    </span>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .input-wrap {
        @apply flex flex-col w-full items-center justify-center gap-1;
    }

    .input-errors {
        @apply text-invalid-1 text-sm w-full;
    }


</style>