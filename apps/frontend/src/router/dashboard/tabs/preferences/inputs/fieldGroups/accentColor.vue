<script lang="ts" setup>
    import z from 'zod';
    import InfoHelpButton from '@/router/dashboard/components/sessionForm/labels/infoHelpButton.vue';
    import { RegExp_HexColorCode } from '@sessionsbot/shared';
    import type { PopoverMethods } from 'primevue';
    import InputLabel from '../inputLabel.vue';




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

    // Dynamic Hex Code Text Color:
    const hexCodeColor = computed(() => {
        if (!fieldValue.value) return '#ffffff'
        let hex = fieldValue.value.replace('#', '')
        // Expand shorthand (#abc → #aabbcc)
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('')
        }
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        // Perceived luminance formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b)
        return luminance > 186 ? '#000000' : '#ffffff'
    })


</script>


<template>
    <!-- Input - Public Sessions -->
    <span class="input-group">

        <!-- Label -->
        <InputLabel title="Accent Color" icon-name="mdi:color" :premium-type="'PREMIUM'" :doc-path="undefined" />


        <!-- Input -->
        <div class="input">

            <!-- Simulated Input -->
            <div @click="selectColorPopoverRef?.toggle" name="accentColor"
                class="h-11 w-full p-1.25 py-1.5 bg-white/7 flex items-center justify-center border-2 border-zinc-300 hover:border-indigo-300 active:border-indigo-400 transition-all cursor-pointer rounded-md"
                :class="{
                    'border-indigo-400!': selectColorPopoverIsActive,
                    'border-red-400!': hexInputIsInvalid
                }">

                <!-- Selected Color Display -->
                <span class="w-full h-full rounded relative opacity-85" :style="{
                    backgroundColor: fieldValue
                }">
                    <p :style="{ color: hexCodeColor }"
                        class="absolute transition-all right-0 font-bold h-full w-fit p-1 flex items-center">
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