import { definePreset } from "@primeuix/themes";
import Aura from '@primeuix/themes/aura';
import type { AuraBaseTokenSections } from "@primeuix/themes/aura/base";
import type { ButtonTokenSections } from "@primeuix/themes/types/button";
import type { ValueOf } from "@sessionsbot/shared";
import type { PrimeVueConfiguration, PrimeVuePTOptions } from "primevue";


const customButtonColors = {
    root: <ButtonTokenSections.Root>{
        primary: {
            activeBackground: 'oklch(0.5500 0.2002 270.64)', /* darkest */
            activeBorderColor: 'oklch(0.5500 0.2002 270.64)',
            hoverBackground: 'oklch(0.6000 0.2002 270.64)', /* dark */
            hoverBorderColor: 'oklch(0.6000 0.2002 270.64)',
            background: 'oklch(0.6506 0.2002 270.64)', /* reg */
            borderColor: 'oklch(0.6506 0.2002 270.64)',
            color: 'white', activeColor: 'white', hoverColor: 'white',
            focusRing: { color: 'none', shadow: 'none' }
        },
        secondary: {
            activeBackground: 'oklch(0.50 0 298.58 / 90%)', /* darkest */
            activeBorderColor: 'oklch(0.50 0 298.58 / 90%)',
            hoverBackground: 'oklch(0.55 0 298.58 / 90%)', /* dark */
            hoverBorderColor: 'oklch(0.55 0 298.58 / 90%)',
            background: 'oklch(0.60 0 298.58 / 90%)', /* reg */
            borderColor: 'oklch(0.60 0 298.58 / 90%)',
            color: 'white', activeColor: 'white', hoverColor: 'white',
            focusRing: { color: 'none', shadow: 'none' }
        },
        warn: {
            background: "oklch(0.65 0.1547 66.12)",
            borderColor: "oklch(0.65 0.1547 66.12)",
            hoverBackground: "oklch(0.61 0.1547 66.12)",
            hoverBorderColor: "oklch(0.61 0.1547 66.12)",
            activeBackground: "oklch(0.57 0.1547 66.12)",
            activeBorderColor: "oklch(0.57 0.1547 66.12)",
            color: 'white', activeColor: 'white', hoverColor: 'white',
            focusRing: { color: 'none', shadow: 'none' }
        },
        success: {
            background: "oklch(0.7 0.1455 144.47)",
            borderColor: "oklch(0.7 0.1455 144.47)",
            hoverBackground: "oklch(0.64 0.1455 144.47)",
            hoverBorderColor: "oklch(0.64 0.1455 144.47)",
            activeBackground: "oklch(0.58 0.1455 144.47)",
            activeBorderColor: "oklch(0.58 0.1455 144.47)",
            color: 'white', activeColor: 'white', hoverColor: 'white',
            focusRing: { color: 'none', shadow: 'none' }
        },
        help: {
            background: "oklch(0.71 0.1469 103.09)",
            borderColor: "oklch(0.71 0.1469 103.09)",
            hoverBackground: "oklch(0.65 0.1469 103.09)",
            hoverBorderColor: "oklch(0.65 0.1469 103.09)",
            activeBackground: "oklch(0.59 0.1469 103.09)",
            activeBorderColor: "oklch(0.59 0.1469 103.09)",
            color: 'white', activeColor: 'white', hoverColor: 'white',
            focusRing: { color: 'none', shadow: 'none' }
        },
        contrast: {
            background: 'oklch(0.3 0.0074 257.29)',
            borderColor: 'oklch(0.3 0.0074 257.29)',
            hoverBackground: 'oklch(0.36 0.0074 257.29)',
            hoverBorderColor: 'oklch(0.36 0.0074 257.29)',
            activeBackground: 'oklch(0.42 0.0074 257.29)',
            activeBorderColor: 'oklch(0.42 0.0074 257.29)',
            color: 'white', activeColor: 'white', hoverColor: 'white',
            focusRing: { color: 'none', shadow: 'none' }
        },
        info: {
            background: 'oklch(0.55 0.1323 252)',
            borderColor: 'oklch(0.55 0.1323 252)',
            hoverBackground: 'oklch(0.49 0.1323 252)',
            hoverBorderColor: 'oklch(0.49 0.1323 252)',
            activeBackground: 'oklch(0.43 0.1323 252)',
            activeBorderColor: 'oklch(0.43 0.1323 252)',
            color: 'white', activeColor: 'white', hoverColor: 'white',
            focusRing: { color: 'none', shadow: 'none' }
        },
        danger: {
            background: 'oklch(0.55 0.1554 22.97)',
            borderColor: 'oklch(0.55 0.1554 22.97)',
            hoverBackground: 'oklch(0.49 0.1554 22.97)',
            hoverBorderColor: 'oklch(0.49 0.1554 22.97)',
            activeBackground: 'oklch(0.43 0.1554 22.97)',
            activeBorderColor: 'oklch(0.43 0.1554 22.97)',
            color: 'white', activeColor: 'white', hoverColor: 'white',
            focusRing: { color: 'none', shadow: 'none' }
        }
    }
}

/** Main Theme Preset - For PrimeVue */
const customPreset = definePreset(Aura, {
    semantic: <AuraBaseTokenSections.Semantic>{
        primary: {
            50: 'oklch(0.6506 0.2002 270.64)',
            100: 'oklch(0.6206 0.2002 270.64)',
            200: 'oklch(0.6006 0.2002 270.64)',
            300: 'oklch(0.5707 0.2002 270.64)',
            400: 'oklch(0.5207 0.2002 270.64)',
            500: 'oklch(0.4907 0.2002 270.64)',
            600: 'oklch(0.4607 0.2002 270.64)',
            700: 'oklch(0.4207 0.2002 270.64)',
            800: 'oklch(0.3907 0.2002 270.64)',
            900: 'oklch(0.3307 0.2002 270.64)',
            950: 'oklch(0.3007 0.2002 270.64)',
        },
    },

    components: {
        button: {
            root: customButtonColors.root,
            colorScheme: {
                dark: { root: customButtonColors.root },
                light: {
                    root: {
                        ...customButtonColors.root,
                        contrast: {
                            background: 'oklch(0.35 0.0392 257.29)',
                            borderColor: 'oklch(0.35 0.0392 257.29)',
                            hoverBackground: 'oklch(0.40 0.0392 257.29)',
                            hoverBorderColor: 'oklch(0.40 0.0392 257.29)',
                            activeBackground: 'oklch(0.45 0.0392 257.29)',
                            activeBorderColor: 'oklch(0.45 0.0392 257.29)',
                        }
                    }
                },
            },
            css: `
                .p-button {
                    transition: scale ease 0.2s, background ease 0.25s, box-shadow ease 0.25s;
                    font-weight: 400 !important; border-radius: 8px;
                    flex justify-center items-center content-center flex-wrap
                }
                .p-button:active {
                    scale: 95%;
                }
            `,
        },
        select: {
            root: {
                focusBorderColor: 'var(--color-indigo-400)',
                invalidBorderColor: 'var(--color-red-400)',
                hoverBorderColor: 'var(--color-indigo-300)',
            },
            overlay: {
                background: 'var(--color-zinc-800)',
                color: 'var(--color-white)/75 !important',
            },
            option: {
                focusBackground: 'color-mix(in oklab, var(--color-white) /* #fff = #ffffff */ 5%, transparent);',
                selectedBackground: 'var(--color-indigo-400)',
                selectedFocusBackground: 'var(--color-indigo-400)',
                selectedFocusColor: 'var(--color-white)',
                selectedColor: 'var(--color-white) !important',
                focusColor: 'var(--color-white)',
            },
        },
        inputnumber: {

            colorScheme: {
                dark: {
                    button: {
                        background: 'var(--color-zinc-800)',
                        borderColor: 'var(--color-white)',
                        hoverBorderColor: 'var(--color-indigo-400)',
                        activeBorderColor: 'var(--color-indigo-400)',
                    },
                }
            },
            css: `
                .p-inputnumber-button {
                    border-width: 2px !important;
            
                }
            `
        }
    },



});


/** Main Theme PASS THROUGHs */
const primePT: PrimeVuePTOptions = {
    inputtext: {
        root: 'bg-zinc-800! text-white! font-bold backdrop-blur-md border-2! hover:border-indigo-300! active:border-indigo-400! focus:border-indigo-400! selected:border-indigo-400!'
    },
    textarea: {
        root: 'bg-zinc-700/60! text-white! font-bold backdrop-blur-md border-2! hover:border-indigo-300! active:border-indigo-400! focus:border-indigo-400!'
    },
    datepicker: {
        root: 'text-white!',
        panel: 'bg-zinc-700! ',
        header: 'bg-zinc-700! text-white!',
        day: 'hover:bg-black/35! text-white!',
        month: 'hover:bg-black/35! text-white!',
        year: 'hover:bg-black/35! text-white!',
        selectMonth: 'hover:bg-black/35! text-white!',
        selectYear: 'hover:bg-black/35! text-white!',
        weekDay: 'text-white/80!',
        hour: 'text-white!',
        minute: 'text-white!',
        ampm: 'text-white!'
    },
    select: {
        root: 'bg-zinc-800! text-white! border-2! font-bold',
        overlay: 'text-white! border-2! border-zinc-600! overflow-clip',
        // option: 'hover:bg-white/5!',
        list: 'bg-zinc-800!',
        label: 'text-white!',
        optionLabel: 'text-white'
    }

}

/** Main Exported PrimeVue Config */
const primeVueConfig = <PrimeVueConfiguration>{
    theme: {
        preset: customPreset,
        options: {
            darkModeSelector: '.dark'
        }
    },
    ripple: true,
    pt: primePT,
    ptOptions: {
        mergeSections: true,
        mergeProps: true
    },
}

export default primeVueConfig;