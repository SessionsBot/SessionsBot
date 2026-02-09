<script lang="ts" setup>
    import z from 'zod';
    import InfoHelpButton from '@/router/dashboard/components/sessionForm/labels/infoHelpButton.vue';
    import { RegExp_HexColorCode } from '@sessionsbot/shared';
    import type { PopoverMethods } from 'primevue';




    // Props
    const props = defineProps<{
        inputErrors: string[]
    }>()

    // Field Value - Modal:
    const fieldValue = defineModel<string>('field-value')

    // Emits:
    const emits = defineEmits<{
        validate: []
    }>()


    // Input - Accent Color (Select)
    const selectColorPopoverIsActive = ref(false)
    const selectColorPopoverRef = ref<PopoverMethods | undefined>()
    const hexInputIsInvalid = ref(false)
    function processHexColorInput(v: string) {
        // Remove empty "_" & ensure starts w "#":
        v = v.replace(/_/g, '')
        if (!v.startsWith('#')) v = ('#' + v);
        // Validate hex color:
        if (v.length != 4 && v.length != 7) return
        const r = z.safeParse(z.string().regex(RegExp_HexColorCode, 'Invalid Hex Color!'), v)
        if (r.success) {
            // Assign valid color:
            hexInputIsInvalid.value = false
            fieldValue.value = v
        } else {
            // Show invalid text input state:
            if (hexInputIsInvalid.value != true) {
                hexInputIsInvalid.value = true;
                setTimeout(() => { hexInputIsInvalid.value = false }, 2_000);
            }
        }
    }



</script>


<template>
    <!-- Input - Public Sessions -->
    <span class="input-group">

        <!-- Label -->
        <div class="label">
            <span class="flex items-center gap-1 flex-wrap">
                <Iconify :size="18" icon="mdi:color" />
                Accent Color
                <!-- Premium Feature Badge -->
                <span
                    class="mx-0.5 flex flex-row gap-px p-0.5 pr-1 bg-black/5 text-white/80 border-indigo-400/70 border-2 rounded-lg">
                    <DiamondIcon class="size-4! fill-transparent!" />
                    <p class="font-bold text-xs"> Premium </p>
                </span>
            </span>

            <InfoHelpButton doc-path="/" />
        </div>

        <!-- Input -->
        <div class="input">

            <!-- Simulated Input -->
            <div @click="selectColorPopoverRef?.toggle" name="accentColor"
                class="h-11 w-full p-1.25 py-1.5 bg-black/30 flex items-center justify-center border-2 border-zinc-300 hover:border-indigo-300 active:border-indigo-400 transition-all cursor-pointer rounded-md"
                :class="{
                    'border-indigo-400!': selectColorPopoverIsActive,
                    'border-red-400!': hexInputIsInvalid
                }">

                <!-- Selected Color Display -->
                <span class="w-full h-full rounded relative" :style="{
                    backgroundColor: fieldValue
                }">
                    <p class="absolute right-0 opacity-55 font-bold h-full w-fit p-1 flex items-center">
                        {{ (fieldValue || '#??????') }}
                    </p>
                </span>

            </div>
            <!-- Select Color - Popover -->
            <Popover ref="selectColorPopoverRef" @show="selectColorPopoverIsActive = true"
                @hide="selectColorPopoverIsActive = false">
                <span class="flex items-center justify-center gap-2 flex-col">
                    <ColorPicker @value-change="processHexColorInput" :default-color="fieldValue" inline />
                    <InputMask @value-change="processHexColorInput" :default-value="fieldValue" fluid size="small"
                        mask="#******" placeholder="#hexColor" class="hex-color-input" :class="{
                            'border-red-400!': hexInputIsInvalid
                        }" />
                </span>
            </Popover>

        </div>

        <!-- Errors -->
        <div class="errors" v-if="inputErrors?.length">
            <p v-for="err of inputErrors">
                - {{ err || 'Invalid Input!' }}
            </p>
        </div>

    </span>
</template>


<style scoped></style>