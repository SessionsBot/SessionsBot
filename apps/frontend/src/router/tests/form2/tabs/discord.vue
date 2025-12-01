<script lang="ts" setup>
    import { BaselineIcon, Clock10Icon, Clock8Icon, ClockIcon, LinkIcon, TextInitialIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import z, { safeParse } from 'zod'
    import type { NewSessions_FieldNames } from '../sesForm.vue';


    // Outgoing Emits:
    const emit = defineEmits<{
        validateField: [name: NewSessions_FieldNames, value: any]
    }>()

    // Incoming Props/Models:
    const props = defineProps<{
        invalidFields: Map<NewSessions_FieldNames, string[]>,
        validateField: (name: NewSessions_FieldNames, value: any) => void
    }>();
    const { invalidFields, validateField } = props;

    // Form Values:
    // const title = defineModel<string>('title');



    // Field Auto Validation:
    // watch(() => title.value, (val) => {
    //     validateField('title', val);
    // })


</script>


<template>
    <main class="flex w-full gap-3.5 flex-1 justify-center items-center content-center flex-wrap my-5">



    </main>
</template>


<style scoped></style>