<script lang="ts" setup>
    import { DateTime } from 'luxon';

    // Visibility Modal:
    const visible = defineModel<boolean>('visible')

    // Emits:
    const emits = defineEmits<{
        accept: [],
        reject: []
    }>()

    // Next Post Cycle Time:
    const nextPostTime = computed(() => {
        const now = DateTime.now();

        const remainder = now.minute % 5;
        const add = remainder === 0 ? 5 : 5 - remainder;

        return now
            .plus({ minutes: add })
            .set({ second: 0, millisecond: 0 });
    });

</script>


<template>
    <div class="border-2! border-ring-soft! bg-bg-soft! w-full max-w-125 rounded-lg">

        <div class="flex flex-center flex-row gap-1 p-3 border-b-2 border-ring-soft">
            <Iconify icon="tabler:alert-hexagon" />
            <p class="font-bold">Anomaly Session</p>
        </div>
        <div class="flex flex-center flex-col p-3">
            <span>
                You're currently trying to schedule an <code
                    class="bg-bg-1 px-0.5 rounded-md ml-0.5 font-semibold">Anomaly Session</code>!
            </span>
            <span class="opacity-65 text-sm mt-2 w-full px-2">
                <p class="underline pb-px font-bold">This happens when:</p>
                - The post schedule you're creating has <b>no recurrence/repeats</b><br>
                - The schedules first <span class="text-[10px] italic opacity-60">(and last)</span> <b>post
                    date
                    is
                    already in the past!</b>
            </span>
            <span class="opacity-65 text-sm mt-2 w-full px-2">
                <p class="underline pb-px font-bold">What this means:</p>
                - This session will be <b>posted ASAP</b> / on the next cycle. <br><span
                    class="text-[10px] italic opacity-60 ml-3">(every 5
                    mins - {{
                        nextPostTime?.toFormat('t')
                    }})</span><br>
                - <b class="">You <span class="underline">wont see changes to your web dashboard</span> until the
                    session is posted!</b>
            </span>
        </div>
        <div class="flex flex-row gap-5 flex-center p-3 border-t-2 border-ring-soft">

            <!-- Reject -->
            <Button @click="$emit('reject'), visible = false" unstyled
                class="button-base button-secondary gap-px group pr-1.5 pl-0.75">
                <Iconify icon="mdi:cancel-bold" class="opacity-80 group-hover:text-invalid-1 transition-colors" />
                <p>
                    Cancel
                </p>
            </Button>
            <Button @click="$emit('accept'), visible = false" unstyled
                class="button-base button-secondary group gap-0.5 pr-1.5 pl-0.75">
                <Iconify icon="material-symbols:check-circle-outline"
                    class="opacity-80 group-hover:text-emerald-600 transition-colors" />
                <p>
                    I Understand
                </p>
            </Button>

        </div>
    </div>
</template>


<style scoped></style>