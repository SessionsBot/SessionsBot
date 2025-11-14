<script setup lang="ts">
    import type { FormInstance, FormResolverOptions, FormSubmitEvent } from '@primevue/forms/form';
    import z from 'zod';
    import { zodResolver } from '@primevue/forms/resolvers/zod'
    import type { InputTextPassThroughOptions } from 'primevue';
    import { TextInitialIcon } from 'lucide-vue-next';



    const testFormRef = ref<FormInstance>()
    z.object({

    })
    const resolver = zodResolver(z.object({
        recurrence: z.string().trim().min(1),
        recurrence2: z.string().trim().min(10),
        recurrence3: z.string().trim().min(15)
    }))

    function submitForm(e: FormSubmitEvent) {
        console.log('Submitted', e)
    }

    const inputTextPT: InputTextPassThroughOptions = { root: 'bg-neutral-500! text-black! font-semibold backdrop-blur-md border-2! hover:border-indigo-300! active:border-indigo-400! focus:border-indigo-400! font-[system-ui]!' }

</script>

<template>
    <main class="flex flex-1 flex-col flex-wrap justify-center items-center content-center">

        <Form unstyled v-slot="$form" ref="testFormRef" :resolver @submit="submitForm"
            class="gap-2 flex w-full! mx-4 p-5 bg-ring flex-col flex-wrap justify-center items-center content-center">
            <div class="inputArea">
                <label for="recurrence" class="w-70 text-left">
                    Title
                </label>
                <IftaLabel variant="out">
                    <InputText type="text" name="recurrence" :pt="inputTextPT" />
                    <label for="recurrence"
                        class="text-black/75! font-medium! gap-0.5 flex justify-start items-center flex-row flex-nowrap">
                        <TextInitialIcon :size="13" :stroke-width="2.5" />
                        <p> Title </p>
                    </label>
                </IftaLabel>
                <Message class="mx-2" v-for="err in $form.recurrence?.errors" size="small" variant="outlined"
                    :pt="{ root: 'text-red-400! outline-red-400!' }">
                    <p> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>


            <div class="inputArea">
                <InputText type="text" name="recurrence2" :pt="inputTextPT" />
                <Message class="mx-2" v-for="err in $form.recurrence2?.errors" size="small" variant="outlined"
                    :pt="{ root: 'text-red-400! outline-red-400!' }">
                    <p> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>

            <div class="inputArea">
                <InputText type="text" name="recurrence3" :pt="inputTextPT" />
                <Message class="mx-2" v-for="err in $form.recurrence3?.errors" size="small" variant="outlined"
                    :pt="{ root: 'text-red-400! outline-red-400!' }">
                    <p> {{ err?.message || 'Invalid Input!' }}</p>
                </Message>

            </div>


            <Button label="Submit" type="submit" />
        </Form>

    </main>
</template>

<style scoped>
    @reference "../../styles/main.css";

    .inputArea {
        @apply flex flex-col w-full justify-center items-center gap-2
    }

</style>