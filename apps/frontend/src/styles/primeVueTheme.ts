import { definePreset } from "@primeuix/themes";
import Aura from '@primeuix/themes/aura';
import type { AuraBaseTokenSections } from "@primeuix/themes/aura/base";
import type { ButtonTokenSections } from "@primeuix/themes/types/button";
import type { PrimeVueConfiguration, PrimeVuePTOptions } from "primevue";


const customButtonColors = {
    root: <ButtonTokenSections.Root>{
        primary: {
            activeBackground: 'color-mix(in oklab, var(--c-brand-1), black 14%)', /* darkest */
            activeBorderColor: 'color-mix(in oklab, var(--c-brand-1), black 14%)',
            hoverBackground: 'color-mix(in oklab, var(--c-brand-1), black 9%)', /* dark */
            hoverBorderColor: 'color-mix(in oklab, var(--c-brand-1), black 9%)',
            background: 'var(--c-brand-1)', /* reg */
            borderColor: 'var(--c-brand-1)',
            color: 'var(--c-text-1)', activeColor: 'var(--c-text-1)', hoverColor: 'var(--c-text-1)',
            focusRing: { color: 'none', shadow: 'none' }
        },
        secondary: {
            activeBackground: 'oklch(0.50 0 298.58 / 90%)', /* darkest */
            activeBorderColor: 'oklch(0.50 0 298.58 / 90%)',
            hoverBackground: 'oklch(0.55 0 298.58 / 90%)', /* dark */
            hoverBorderColor: 'oklch(0.55 0 298.58 / 90%)',
            background: 'oklch(0.60 0 298.58 / 90%)', /* reg */
            borderColor: 'oklch(0.60 0 298.58 / 90%)',
            color: 'var(--c-text-1)', activeColor: 'var(--c-text-1)', hoverColor: 'var(--c-text-1)',
            focusRing: { color: 'none', shadow: 'none' }
        },
        warn: {
            background: "oklch(0.63 0.1547 66.12)",
            borderColor: "oklch(0.63 0.1547 66.12)",
            hoverBackground: "oklch(0.57 0.1547 66.12)",
            hoverBorderColor: "oklch(0.57 0.1547 66.12)",
            activeBackground: "oklch(0.51 0.1547 66.12)",
            activeBorderColor: "oklch(0.51 0.1547 66.12)",
            color: 'var(--c-text-1)', activeColor: 'var(--c-text-1)', hoverColor: 'var(--c-text-1)',
            focusRing: { color: 'none', shadow: 'none' }
        },
        success: {
            background: "oklch(0.58 0.175 145)",
            borderColor: "oklch(0.58 0.1707 144.47)",
            hoverBackground: "oklch(0.52 0.1707 144.47)",
            hoverBorderColor: "oklch(0.52 0.1707 144.47)",
            activeBackground: "oklch(0.48 0.1707 144.47)",
            activeBorderColor: "oklch(0.48 0.1707 144.47)",
            color: 'var(--c-text-1)', activeColor: 'var(--c-text-1)', hoverColor: 'var(--c-text-1)',
            focusRing: { color: 'none', shadow: 'none' }
        },
        help: {
            background: "oklch(0.71 0.1469 103.09)",
            borderColor: "oklch(0.71 0.1469 103.09)",
            hoverBackground: "oklch(0.65 0.1469 103.09)",
            hoverBorderColor: "oklch(0.65 0.1469 103.09)",
            activeBackground: "oklch(0.59 0.1469 103.09)",
            activeBorderColor: "oklch(0.59 0.1469 103.09)",
            color: 'var(--c-text-1)', activeColor: 'var(--c-text-1)', hoverColor: 'var(--c-text-1)',
            focusRing: { color: 'none', shadow: 'none' }
        },
        contrast: {
            background: 'oklch(0.3 0.0074 257.29)',
            borderColor: 'oklch(0.3 0.0074 257.29)',
            hoverBackground: 'oklch(0.36 0.0074 257.29)',
            hoverBorderColor: 'oklch(0.36 0.0074 257.29)',
            activeBackground: 'oklch(0.42 0.0074 257.29)',
            activeBorderColor: 'oklch(0.42 0.0074 257.29)',
            color: 'var(--c-text-1)', activeColor: 'var(--c-text-1)', hoverColor: 'var(--c-text-1)',
            focusRing: { color: 'none', shadow: 'none' }
        },
        info: {
            background: 'oklch(0.55 0.1323 252)',
            borderColor: 'oklch(0.55 0.1323 252)',
            hoverBackground: 'oklch(0.49 0.1323 252)',
            hoverBorderColor: 'oklch(0.49 0.1323 252)',
            activeBackground: 'oklch(0.43 0.1323 252)',
            activeBorderColor: 'oklch(0.43 0.1323 252)',
            color: 'var(--c-text-1)', activeColor: 'var(--c-text-1)', hoverColor: 'var(--c-text-1)',
            focusRing: { color: 'none', shadow: 'none' }
        },
        danger: {
            background: 'oklch(0.55 0.1554 22.97)',
            borderColor: 'oklch(0.55 0.1554 22.97)',
            hoverBackground: 'oklch(0.49 0.1554 22.97)',
            hoverBorderColor: 'oklch(0.49 0.1554 22.97)',
            activeBackground: 'oklch(0.43 0.1554 22.97)',
            activeBorderColor: 'oklch(0.43 0.1554 22.97)',
            color: 'var(--c-text-1)', activeColor: 'var(--c-text-1)', hoverColor: 'var(--c-text-1)',
            focusRing: { color: 'none', shadow: 'none' }
        },
    },

    outlined: <ButtonTokenSections.Outlined>{
        contrast: {
            color: 'var(--c-text-1)',
            borderColor: 'oklch(0.3 0.0074 257.29)',
            hoverBackground: 'oklch(0.36 0.0074 257.29 / 20%)',
            activeBackground: 'oklch(0.42 0.0074 257.29 / 20%)',
        },
        danger: {
            color: 'var(--c-text-1)',
            borderColor: 'oklch(0.55 0.1554 22.97)',
            hoverBackground: 'oklch(0.49 0.1554 22.97 / 20%)',
            activeBackground: 'oklch(0.43 0.1554 22.97 / 23%)'
        },
        help: {
            color: 'var(--c-text-1)',
            borderColor: 'oklch(0.71 0.1469 103.09)',
            hoverBackground: 'oklch(0.65 0.1469 103.09 / 20%)',
            activeBackground: 'oklch(0.59 0.1469 103.09 / 23%)'
        },
        info: {
            color: 'var(--c-text-1)',
            borderColor: 'oklch(0.55 0.1323 252)',
            hoverBackground: 'oklch(0.49 0.1323 252 / 20%)',
            activeBackground: 'oklch(0.43 0.1323 252 / 23%)'
        },
        plain: {
            color: 'var(--c-text-1)',
            borderColor: 'var(--c-text-1)',
            hoverBackground: 'color-mix(in oklab, var(--c-text-2) 20%, transparent)',
            activeBackground: 'color-mix(in oklab, var(--c-text-2) 23%, transparent)'
        },
        primary: {
            color: 'var(--c-text-1)',
            borderColor: 'var(--c-brand-1)',
            hoverBackground: 'color-mix(in oklab, var(--c-brand-1) 20%, transparent)',
            activeBackground: 'color-mix(in oklab, var(--c-brand-1) 23%, transparent)'
        },
        secondary: {
            color: 'var(--c-text-1)',
            borderColor: 'oklch(0.60 0 298.58 / 90%)',
            hoverBackground: 'oklch(0.55 0 298.58 / 20%)',
            activeBackground: 'oklch(0.50 0 298.58 / 23%)'
        },
        success: {
            color: 'var(--c-text-1)',
            borderColor: 'oklch(0.58 0.1707 144.47)',
            hoverBackground: 'oklch(0.52 0.1707 144.47 / 20%)',
            activeBackground: 'oklch(0.52 0.1707 144.47 / 23%)'
        },
        warn: {
            color: 'var(--c-text-1)',
            borderColor: 'oklch(0.63 0.1547 66.12)',
            hoverBackground: 'oklch(0.57 0.1547 66.12 / 20%)',
            activeBackground: 'oklch(0.51 0.1547 66.12 / 23%)'
        },
    },

    text: <ButtonTokenSections.Text>{
        contrast: {
            color: 'oklch(0.36 0.0074 257.29 / 85%)',
            hoverBackground: 'oklch(0.36 0.0074 257.29 / 20%)',
            activeBackground: 'oklch(0.42 0.0074 257.29 / 20%)'
        },
        danger: {
            color: 'oklch(0.49 0.1554 22.97 / 85%)',
            hoverBackground: 'oklch(0.49 0.1554 22.97 / 20%)',
            activeBackground: 'oklch(0.43 0.1554 22.97 / 23%)'
        },
        help: {
            color: 'oklch(0.65 0.1469 103.09 / 85%)',
            hoverBackground: 'oklch(0.65 0.1469 103.09 / 20%)',
            activeBackground: 'oklch(0.59 0.1469 103.09 / 23%)'
        },
        info: {
            color: 'oklch(0.49 0.1323 252 / 85%)',
            hoverBackground: 'oklch(0.49 0.1323 252 / 20%)',
            activeBackground: 'oklch(0.43 0.1323 252 / 23%)'
        },
        plain: {
            color: 'color-mix(in oklab, var(--c-text-2) 85%, transparent)',
            hoverBackground: 'color-mix(in oklab, var(--c-text-2) 20%, transparent)',
            activeBackground: 'color-mix(in oklab, var(--c-text-2) 23%, transparent)'
        },
        primary: {
            color: 'color-mix(in oklab, var(--c-brand-1) 85%, transparent)',
            hoverBackground: 'color-mix(in oklab, var(--c-brand-1) 20%, transparent)',
            activeBackground: 'color-mix(in oklab, var(--c-brand-1) 23%, transparent)'
        },
        secondary: {
            color: 'oklch(0.55 0 298.58 / 85%)',
            hoverBackground: 'oklch(0.55 0 298.58 / 20%)',
            activeBackground: 'oklch(0.50 0 298.58 / 23%)'
        },
        success: {
            color: 'oklch(0.52 0.1707 144.47 / 85%)',
            hoverBackground: 'oklch(0.52 0.1707 144.47 / 20%)',
            activeBackground: 'oklch(0.52 0.1707 144.47 / 23%)'
        },
        warn: {
            color: 'oklch(0.57 0.1547 66.12 / 85%)',
            hoverBackground: 'oklch(0.57 0.1547 66.12 / 20%)',
            activeBackground: 'oklch(0.51 0.1547 66.12 / 23%)'
        },
    },

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
            outlined: customButtonColors.outlined,

            colorScheme: {
                dark: { root: customButtonColors.root, outlined: customButtonColors.outlined, text: customButtonColors.text },
                light: { root: customButtonColors.root, outlined: customButtonColors.outlined, text: customButtonColors.text },
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
                background: `color-mix(in oklab, var(--c-bg-2), black 11%)`,
                borderColor: `var(--color-ring-soft)`,
                focusBorderColor: 'var(--color-indigo-400)',
                invalidBorderColor: 'var(--color-invalid-1)',
                hoverBorderColor: 'var(--color-indigo-300)',
                color: `var(--color-text-1)`
            },
            overlay: {
                background: `color-mix(in oklab, var(--c-bg-2), black 11%)`,
                color: 'var(--color-text-1)/75 !important',
                borderColor: `var(--color-ring-soft)`,
            },
            option: {
                focusBackground: 'color-mix(in oklab, var(--color-text-1) 15%, transparent);',
                selectedBackground: 'var(--color-indigo-400)',
                selectedFocusBackground: 'var(--color-indigo-400)',
                selectedFocusColor: 'var(--color-text-1)',
                selectedColor: 'var(--color-text-1) !important',
                focusColor: 'var(--color-text-1)',
                color: `var(--color-text-2)`
            },
        },
        checkbox: {
            root: {
                background: `color-mix(in oklab, var(--c-bg-2), black 11%)`,
                borderColor: `var(--color-ring-soft)`,
                hoverBorderColor: `var(--color-ring-2)`,
                focusBorderColor: `var(--color-ring-2)`,
                checkedBackground: `color-mix(in oklab, var(--c-brand-1), transparent 20%)`,
                checkedHoverBackground: `color-mix(in oklab, var(--c-brand-1), black 10%)`,
                checkedBorderColor: `color-mix(in oklab, var(--c-brand-1), black 10%)`,
                checkedHoverBorderColor: `color-mix(in oklab, var(--c-brand-1), black 10%)`,
                checkedFocusBorderColor: `color-mix(in oklab, var(--c-brand-1), black 10%)`,
                invalidBorderColor: `var(--color-invalid-1)`,
            }
        },
        multiselect: {
            root: {
                color: 'var(--color-text-1)',
                background: `color-mix(in oklab, var(--c-bg-2), black 11%)`,
                borderColor: `var(--color-ring-soft)`,
                focusBorderColor: 'var(--color-indigo-400)',
                invalidBorderColor: 'var(--color-invalid-1)',
                hoverBorderColor: 'var(--color-indigo-300)',
                focusRing: {
                    color: 'var(--color-indigo-400)'
                },
                disabledBackground: `color-mix(in oklab, var(--c-bg-2), transparent 50%)`,
            },
            overlay: {
                background: `color-mix(in oklab, var(--c-bg-2), black 11%)`,
                color: 'var(--color-text-1)',
                borderColor: `var(--color-ring-soft)`
            },
            option: {
                focusBackground: 'var(--color-indigo-300/30)',
                selectedBackground: 'var(--color-brand-1/30)',
                selectedFocusBackground: 'var(--color-brand-1/30)',
                color: `var(--color-text-1)`,
                focusColor: `var(--color-text-1)`,
                selectedColor: `var(--color-text-1)`,
                selectedFocusColor: `var(--color-text-1)`,
            },

        },
        inputnumber: {

            colorScheme: {
                dark: {
                    button: {
                        background: `color-mix(in oklab, var(--c-bg-2), black 11%)`,
                        borderColor: 'var(--color-ring-soft)',
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
        },
        autocomplete: {
            option: {
                focusBackground: 'none',
                selectedBackground: 'none'
            },
            overlay: {
                background: `color-mix(in oklab, var(--c-bg-2), black 11%)`,
                color: 'var(--color-text-1)',
                borderColor: `var(--color-ring-soft)`
            },
            dropdown: {
                background: `color-mix(in oklab, var(--c-bg-2), black 11%) !important`,
                hoverBackground: `color-mix(in oklab, var(--c-bg-2), black 11%) !important`,
                activeBackground: `color-mix(in oklab, var(--c-bg-2), black 11%) !important`,
                color: `var(--color-text-1)`,
                borderColor: `var(--color-text-soft)`,
                hoverBorderColor: `var(--color-indigo-300)`,
                activeBorderColor: 'var(--color-indigo-400)',
                focusRing: {
                    color: 'var(--color-indigo-400)'
                }
            }
        },
        popover: {
            root: {
                background: `var(--c-bg-2)`,
                borderColor: `var(--c-ring-2)`,
                color: `var(--c-text-1)`
            }
        },
        inputtext: {
            root: {
                background: `color-mix(in oklab, var(--c-bg-2), black 11%)`,
                color: `var(--color-text-1)`,
                borderColor: `var(--color-text-soft)`,
                hoverBorderColor: `var(--color-indigo-300)`,
                focusBorderColor: `var(--color-indigo-400)`,
                invalidBorderColor: 'var(--color-invalid-1)',
                invalidPlaceholderColor: 'var(--color-invalid-1)',
                focusRing: {
                    color: 'var(--color-indigo-400)'
                },
            }
        },
        dialog: {
            root: {
                background: `var(--c-bg-2)`,
                color: `var(--c-text-1)`,
                borderColor: 'var(--c-ring-2)'
            }
        },
        toggleswitch: {
            colorScheme: {
                light: {
                    root: {
                        background: `var(--c-bg-3)`,
                        hoverBackground: `color-mix(in oklab, var(--c-bg-3), black 10%)`,
                        checkedBackground: `color-mix(in oklab, var(--c-brand-1), transparent 20%)`,
                        checkedHoverBackground: `color-mix(in oklab, var(--c-brand-1), black 10%)`,
                    }
                },
                dark: {
                    root: {
                        background: `var(--c-bg-3)`,
                        hoverBackground: `color-mix(in oklab, var(--c-bg-3), black 10%)`,
                        checkedBackground: `color-mix(in oklab, var(--c-brand-1), transparent 20%)`,
                        checkedHoverBackground: `color-mix(in oklab, var(--c-brand-1), black 10%)`,
                    }
                }
            },

        },
        datepicker: {
            date: {
                selectedBackground: `color-mix(in oklab, var(--c-brand-1), transparent 40%)`
            }
        }
    },



});


/** Main Theme PASS THROUGHs */
const primePT: PrimeVuePTOptions = {
    inputtext: {
        root: 'font-bold border-2!'
    },
    textarea: {
        root: 'bg-zinc-700/60! text-white! font-bold backdrop-blur-md border-2! hover:border-indigo-300! active:border-indigo-400! focus:border-indigo-400!'
    },
    datepicker: {
        root: 'text-text-1! border-ring-soft!',
        panel: 'bg-[color-mix(in_oklab,var(--c-bg-2),black_11%)]! ',
        header: 'bg-[color-mix(in_oklab,var(--c-bg-2),black_11%)]! text-text-1!',
        day: 'hover:bg-black/35! text-text-1! has[.p-datepicker-day-selected]:bg-red-500!',
        month: 'hover:bg-black/35! text-text-1!',
        year: 'hover:bg-black/35! text-text-1!',
        selectMonth: 'hover:bg-black/35! text-text-1!',
        selectYear: 'hover:bg-black/35! text-text-1!',
        weekDay: 'text-text-1/70!',
        hour: 'text-text-1!',
        minute: 'text-text-1!',
        ampm: 'text-text-1!',
    },
    select: {
        root: 'border-2! font-bold',
        overlay: 'border-2!',
        optionGroup: 'bg-bg-1/25! rounded-md text-text-1!'
    },
    multiselect: {
        root: `font-bold border-2!`,
        overlay: `border-2!`
    },
    autocomplete: {
        root: 'group/ac group-hover/ac:border-indigo-300! active:border-indigo-400! group-focus-within/ac:border-indigo-400! focus:border-indigo-400! selected:border-indigo-400!',
        dropdown: 'border-2! border-l-0! invalid:invalid-1! group-hover/ac:border-indigo-300! group-focus-within/ac:border-indigo-400! group-[.p-invalid]/ac:border-invalid-1!',
        overlay: 'overflow-x-auto!',
        option: 'text-text-1! bg-none! hover:bg-text-1/15! focus:bg-brand-1/15! rounded-md!',
        emptyMessage: 'text-text-1!',
        searchResultMessage: 'text-text-1!',
    },


}

/** Main Exported PrimeVue Config */
const primeVueConfig = <PrimeVueConfiguration>{
    theme: {
        preset: customPreset,
        options: {
            darkModeSelector: '.dark',

        }
    },
    ripple: true,
    pt: primePT,
    ptOptions: {
        // mergeSections: true,
        // mergeProps: true
    },
}

export default primeVueConfig;