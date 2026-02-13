<script lang="ts" setup>
    import z from 'zod';
    import { useData, useRoute } from 'vitepress'
    import { computed, onMounted, ref, Transition, watch } from 'vue';

    // Props:
    const props = defineProps<{
        class?: string | undefined
    }>()

    // Services:
    const page = useData();
    const route = useRoute()
    const pageTitle = computed(() => page.page.value?.title || 'Unknown Title')

    // Feedback Form Options & States:
    const pageIsHelpful = ref<null | true | false>(null)
    const reasonTextValue = ref<string>('')
    const reasonTextValueMaxCharacters = 95
    const showThanksForFeedback = ref<boolean>(false)
    function toggleOption(opt: true | false) {
        cancelSubmissionDelay()
        if (opt == pageIsHelpful.value) pageIsHelpful.value = null;
        else {
            pageIsHelpful.value = opt
            if (opt == true) {
                startSubmissionDelay()
            }
        }
    }
    function resetForm() {
        pageIsHelpful.value = null;
        reasonTextValue.value = ''
        showThanksForFeedback.value = false;
    }


    // GTag Event Schema:
    const eventSchema = z.object({
        is_helpful: z.boolean(),
        reason: z.nullish(z.string().max(100).normalize().transform((v) => {
            if (v?.trim()?.length == 0) {
                return undefined
            } else {
                return v
            }
        })),
        page_title: z.string()
    })

    // Feedback Submission:


    function submitPageFeedback(is_helpful: boolean | null, reason: string | null, page_title: string) {
        cancelSubmissionDelay()
        showThanksForFeedback.value = true;
        // Validate Submission:

        const validation = z.safeParse(eventSchema, { is_helpful, reason, page_title })
        if (validation.success) {
            // console.warn('Valid Feedback - SENT', validation.data)
            gtag('event', 'documentation_feedback', validation.data)
        } else {
            console.warn('INVALID Feedback - Not Recorded..', { errors: z.treeifyError(validation.error)?.properties })
        }
    }

    // Submission Delays:
    const submissionDelayRef = ref<NodeJS.Timeout | null>(null)
    const submissionDelayValues = ref<z.infer<typeof eventSchema> | null>(null)
    function startSubmissionDelay() {
        submissionDelayValues.value = {
            is_helpful: pageIsHelpful.value,
            reason: reasonTextValue.value,
            page_title: pageTitle.value
        }
        submissionDelayRef.value = setTimeout(() => {
            // Submit after delay - w/ stored values:
            const delayedValues = submissionDelayValues.value
            submitPageFeedback(delayedValues.is_helpful, delayedValues.reason, delayedValues.page_title)
            // Reset submission delays:
            submissionDelayRef.value = null;
            submissionDelayValues.value = null;
        }, 3_500);
    }
    function cancelSubmissionDelay() {
        if (submissionDelayRef.value) clearTimeout(submissionDelayRef.value)
        submissionDelayRef.value = null;
        submissionDelayValues.value = null;
    }


    // Reset on Route Change:
    watch(() => route.path, (to, from) => {
        if (submissionDelayRef.value) {

            // If delayed submit on change - submit immediately:
            // Get delayed values:
            const delayedValues = submissionDelayValues.value
            submitPageFeedback(delayedValues.is_helpful, delayedValues.reason, delayedValues.page_title)
        }
        // reset form / ui values:
        resetForm()
    })

</script>


<template>
    <!-- outer wrap -->
    <div class="outer-wrap">
        <!-- Page Feedback - Questionnaire  -->
        <div :class="props.class, { 'dark-mode': page.isDark.value }"
            class="content-wrap has-focus-within:border-(--vp-c-divider)! has-[.button-hover]:border-red-500!">

            <Transition name="fade">


                <!-- Question - Top Row -->
                <span v-if="showThanksForFeedback == false" class="question-wrap">
                    <!-- Question Text -->
                    <p class="font-semibold text-xs sm:text-sm"> Was this page helpful? </p>

                    <!-- Response Options -->
                    <span class="flex flex-row flex-wrap gap-2.5 items-center justify-evenly p-0!">

                        <!-- Yes - Helpful Page Button -->
                        <button class="response-button"
                            :class="{ 'bg-(--button-background-green)! border-(--vp-c-border)!': pageIsHelpful === true }"
                            @click="toggleOption(true)">

                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 640 640">
                                <path fill="currentColor"
                                    d="M144 224c17.7 0 32 14.3 32 32v256c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V256c0-17.7 14.3-32 32-32zM334.6 80c27.3 0 49.4 22.1 49.4 49.4v4.2c0 6.8-1.3 13.6-3.8 19.9L352 224h160c26.5 0 48 21.5 48 48c0 19.7-11.9 36.6-28.9 44c17 7.4 28.9 24.3 28.9 44c0 23.4-16.8 42.9-39 47.1c4.4 7.3 7 15.8 7 24.9c0 22.2-15 40.8-35.4 46.3c2.2 5.5 3.4 11.5 3.4 17.7c0 26.5-21.5 48-48 48h-87.9c-36.3 0-71.6-12.4-99.9-35.1l-12.2-9.7c-15.2-12.1-24-30.5-24-50V262.6c0-14.9 3.5-29.6 10.1-42.9l56.2-112.4c8.4-16.7 25.5-27.3 44.3-27.3" />
                            </svg>

                            <p class="sm:flex hidden h-full">
                                Yes
                            </p>
                        </button>

                        <!-- No - Unhelpful Page Button -->
                        <button class="response-button"
                            :class="{ 'bg-(--button-background-red)! border-(--vp-c-border)!': pageIsHelpful === false }"
                            @click="toggleOption(false)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 640 640">
                                <path fill="currentColor"
                                    d="M448 96c26.5 0 48 21.5 48 48c0 6.3-1.3 12.2-3.4 17.7C513 167.2 528 185.8 528 208c0 9.1-2.6 17.6-7 24.9c22.2 4.2 39 23.7 39 47.1c0 19.7-11.9 36.6-28.9 44c17 7.4 28.9 24.3 28.9 44c0 26.5-21.5 48-48 48H352l28.2 70.4c2.5 6.3 3.8 13.1 3.8 19.9v4.2c0 27.3-22.1 49.4-49.4 49.4c-18.7 0-35.8-10.6-44.2-27.3l-56.3-112.3c-6.7-13.3-10.1-28-10.1-42.9V190.8c0-19.4 8.9-37.8 24-50l12.2-9.7c28.4-22.7 63.6-35.1 99.9-35.1zm-304 64c17.7 0 32 14.3 32 32v256c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V192c0-17.7 14.3-32 32-32z" />
                            </svg>
                            <p class="sm:flex hidden h-full">
                                No
                            </p>
                        </button>

                    </span>
                </span>


                <!-- Thanks for Feedback - Msg -->
                <span v-else class="w-full font-bold italic">
                    <p> Thanks for your feedback! 💜 </p>
                </span>

            </Transition>


            <!-- Not Helpful - Reason -->
            <Transition name="slide">

                <!-- Input Area - Wrap -->
                <div v-if="pageIsHelpful == false && showThanksForFeedback != true"
                    class="not-helpful-reason-input-wrap">

                    <!-- Reason - Input & Submit -->
                    <span class="flex w-full flex-col justify-between gap-1.75">
                        <!-- Input Wrap -->
                        <div
                            class="relative h-6.5 max-h-6.5 w-full bg-white/4 has-focus-within:border-(--vp-c-brand-1) border border-(--vp-c-divider) rounded-md overflow-clip flex justify-start items-start transition-all">
                            <!-- Text Input -->
                            <textarea v-model="reasonTextValue" placeholder="Tell us more..."
                                :maxlength="reasonTextValueMaxCharacters"
                                class="text-sm w-full resize-none mr-8.5 px-1 p-0.5 flex grow h-full justify-start items-start placeholder:italic outline-none" />
                            <!-- Character Count -->
                            <p
                                class="absolute right-0 text-[10px] italic opacity-45 p-1 font-medium w-fit h-full flex items-end">
                                {{ reasonTextValue?.length
                                    ? ((reasonTextValue.length ?? 0) + "/" + reasonTextValueMaxCharacters)
                                    : '(optional)'
                                }}
                            </p>
                        </div>

                        <!-- Action Button(s) -->
                        <div class="action-row">

                            <!-- Support Chat -->
                            <a href="https://discord.gg/49gNbwA8t6" target="_blank" class="action-button">
                                <svg xmlns="http://www.w3.org/2000/svg" class="relative top-px" width="18" height="18"
                                    viewBox="0 0 24 24">
                                    <path fill="currentColor" fill-rule="evenodd"
                                        d="M8.002 4.553a50.6 50.6 0 0 1 8.099.04l1.624.138a2.666 2.666 0 0 1 2.408 2.252l.102.669a20.7 20.7 0 0 1-.096 6.835a2.34 2.34 0 0 1-2.305 1.923H8.858c-.207 0-.41.051-.592.149l-3.911 2.102A.75.75 0 0 1 3.25 18V9.483a4.93 4.93 0 0 1 4.559-4.915zM8 9.5A1.25 1.25 0 1 0 8 12a1.25 1.25 0 0 0 0-2.5m4 0a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5m2.75 1.25a1.25 1.25 0 1 1 2.5 0a1.25 1.25 0 0 1-2.5 0"
                                        clip-rule="evenodd" />
                                </svg>
                                <p>
                                    Chat with Support
                                </p>
                            </a>

                            <!-- Submit -->
                            <button @click="submitPageFeedback(pageIsHelpful, reasonTextValue, pageTitle)"
                                class="action-button">
                                <svg xmlns="http://www.w3.org/2000/svg" class="mr-px" width="14" height="14"
                                    viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                        d="M20.04 2.323c1.016-.355 1.992.621 1.637 1.637l-5.925 16.93c-.385 1.098-1.915 1.16-2.387.097l-2.859-6.432l4.024-4.025a.75.75 0 0 0-1.06-1.06l-4.025 4.024l-6.432-2.859c-1.063-.473-1-2.002.097-2.387z" />
                                </svg>
                                Submit
                            </button>

                        </div>
                    </span>

                </div>

            </Transition>

        </div>
    </div>
</template>


<style scoped>

    @reference "@theme/custom.css";

    p {
        margin: 0px;
    }

    .outer-wrap {
        @apply w-full block transition-all;
    }

    .content-wrap {
        /* Variables */
        --button-background-green: #41a84156;
        --button-background-red: #e9555550;


        @apply p-2.5 w-full h-full gap-2 rounded-lg relative min-h-fit overflow-clip flex flex-col items-center justify-between border border-(--vp-c-divider) bg-white/0 text-(--vp-c-text-2) text-sm transition-all;
    }

    .response-button {
        @apply flex flex-row gap-px items-center w-fit px-2 py-0.75 text-(--vp-c-text-2) text-xs font-medium hover:bg-blue-500/20 active:bg-blue-500/25 border border-(--vp-c-divider) hover:border-(--vp-c-border) rounded-md cursor-pointer active:scale-95 transition-all;
    }

    .action-button {
        @apply flex flex-row gap-px items-center w-fit px-2 py-1 text-(--vp-c-text-2) text-xs font-medium hover:bg-blue-500/20 active:bg-blue-500/25 border border-(--vp-c-divider) hover:border-(--vp-c-border) rounded-md cursor-pointer active:scale-95 transition-all;
    }

    .question-wrap {
        @apply flex w-full flex-row gap-2 sm:gap-4.5 items-center justify-between;
    }


    .not-helpful-reason-input-wrap {
        @apply flex flex-col gap-2 flex-wrap w-full !h-fit items-center justify-center;

        .action-row {
            @apply w-full mb-px justify-end gap-2 self-end flex flex-row;
        }
    }



    /* Dark Mode Styles */
    .content-wrap.dark-mode {
        /* Variables */
        --button-background-green: #41a8412c;
        --button-background-red: #e9555525;

        .action-button {
            @apply hover:bg-zinc-700/70 active:bg-zinc-700;
        }
    }



    /* Slide Animation */
    .slide-enter-from {
        transform: translateY(20px);
        opacity: 0;
        @apply blur-lg;
    }

    .slide-enter-to,
    .slide-leave-from {
        transform: translateY(0px);
        opacity: 1;
        @apply blur-none;
    }

    .slide-leave-to {
        transform: translateY(20px);
        opacity: 0;
        @apply blur-md;
    }

    .slide-leave-active,
    .slide-enter-active {
        transition: ease all 0.3s;
    }


    /* Fade Animation */
    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
        @apply blur-lg;
    }

    .fade-enter-to,
    .fade-leave-from {
        opacity: 1;
        @apply blur-none;
    }

    .fade-enter-active {
        transition: ease all 0.33s;
    }

    .fade-leave-active {
        position: absolute;
    }

</style>