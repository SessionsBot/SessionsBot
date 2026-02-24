<script lang="ts" setup>
    import DiscordEditor2 from './DiscordEditor/DiscordEditor.vue';
    import StatusBadge from '../../components/StatusBadge.vue';
</script>


<template>
    <div class="flex flex-col gap-2 justify-center items-center content-center p-5 grow w-full h-full bg-bg-1!">


        <DiscordEditor2 hidden />

        <StatusBadge hidden />

        <ColorModeToggle />

        <span class="flex flex-wrap gap-4 p-4 w-full text-text-1">

            <p class="w-full ">
                Color / Theme Variables
            </p>

            <span class="display-area">

                <p class="title"> Bg 1 </p>

                <p class="text-text-1!"> Text 1 </p>
                <p class="text-text-2!"> Text 2 </p>
                <p class="text-text-3!"> Text 3 </p>
                <p class="text-text-4!"> Text 4 </p>
                <p class="text-text-soft!"> Text S </p>

            </span>


            <span class="display-area bg-bg-2! border-ring-2!">

                <p class="title"> Bg 2 </p>

                <p class="text-text-1!"> Text 1 </p>
                <p class="text-text-2!"> Text 2 </p>
                <p class="text-text-3!"> Text 3 </p>
                <p class="text-text-4!"> Text 4 </p>
                <p class="text-text-soft!"> Text S </p>

            </span>

            <span class="display-area bg-bg-3! border-ring-3!">

                <p class="title"> Bg 3 </p>

                <p class="text-text-1!"> Text 1 </p>
                <p class="text-text-2!"> Text 2 </p>
                <p class="text-text-3!"> Text 3 </p>
                <p class="text-text-4!"> Text 4 </p>
                <p class="text-text-soft!"> Text S </p>

            </span>

            <span class="display-area bg-bg-4! border-ring-3!">

                <p class="title"> Bg 4 </p>

                <p class="text-text-1!"> Text 1 </p>
                <p class="text-text-2!"> Text 2 </p>
                <p class="text-text-3!"> Text 3 </p>
                <p class="text-text-4!"> Text 4 </p>
                <p class="text-text-soft!"> Text S </p>

            </span>

            <span class="display-area bg-bg-soft! border-ring-soft!">

                <p class="title"> Bg SOFT </p>

                <p class="text-text-1!"> Text 1 </p>
                <p class="text-text-2!"> Text 2 </p>
                <p class="text-text-3!"> Text 3 </p>
                <p class="text-text-4!"> Text 4 </p>
                <p class="text-text-soft!"> Text S </p>

            </span>

            <span class="flex p-2 gap-2 flex-wrap">
                <span class="px-10 py-2.5 ring-2 ring-ring-1 rounded-md w-fit h-fit">
                    <p class="text-ring-1"> Ring 1 </p>
                </span>
                <span class="px-10 py-2.5 ring-2 ring-ring-2 rounded-md w-fit h-fit">
                    <p class="text-ring-2"> Ring 2 </p>
                </span>
                <span class="px-10 py-2.5 ring-2 ring-ring-3 rounded-md w-fit h-fit">
                    <p class="text-ring-3"> Ring 3 </p>
                </span>
                <span class="px-10 py-2.5 ring-2 ring-ring-4 rounded-md w-fit h-fit">
                    <p class="text-ring-4"> Ring 4 </p>
                </span>
                <span class="px-10 py-2.5 ring-2 ring-ring-soft rounded-md w-fit h-fit">
                    <p class="text-ring-soft"> Ring S </p>
                </span>
            </span>


            <!-- Toggle - Color Mode -->


            <span class="w-full flex p-4 gap-2 flex-wrap items-center justify-center">
                <p class="w-full text-lg font-bold"> Prime Vue Buttons </p>

                <Button label="default" />
                <Button severity="contrast" label="contrast" />
                <Button severity="danger" label="danger" />
                <Button severity="help" label="help" />
                <Button severity="info" label="info" />
                <Button severity="secondary" label="secondary" />
                <Button severity="success" label="success" />
                <Button severity="warn" label="warn" />


                <Button outlined label="default" />
                <Button outlined severity="contrast" label="contrast" />
                <Button outlined severity="danger" label="danger" />
                <Button outlined severity="help" label="help" />
                <Button outlined severity="info" label="info" />
                <Button outlined severity="secondary" label="secondary" />
                <Button outlined severity="success" label="success" />
                <Button outlined severity="warn" label="warn" />

                <Button text label="default" />
                <Button text severity="contrast" label="contrast" />
                <Button text severity="danger" label="danger" />
                <Button text severity="help" label="help" />
                <Button text severity="info" label="info" />
                <Button text severity="secondary" label="secondary" />
                <Button text severity="success" label="success" />
                <Button text severity="warn" label="warn" />





            </span>


            <span class="w-full flex p-4 gap-2 flex-wrap items-center justify-center">
                <p class="w-full text-lg font-bold"> Brand Colors </p>

                <div class="p-3 rounded-full bg-brand-1">
                    Brand 1
                </div>
                <div class="p-3 rounded-full bg-brand-2">
                    Brand 2
                </div>
                <div class="p-3 rounded-full bg-brand-3">
                    Brand 3
                </div>
                <div class="p-3 rounded-full bg-brand-soft">
                    Brand Soft
                </div>


            </span>


            <span class="w-full flex p-4 gap-2 flex-wrap items-center justify-center">
                <p class="w-full text-lg font-bold"> Reg Colors (500/50) </p>

                <div class="w-fit aspect-square p-1 rounded-md bg-red-500/50">
                    Red
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-orange-500/50">
                    Orange
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-amber-500/50">
                    Amber
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-yellow-500/50">
                    Yellow
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-lime-500/50">
                    Lime
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-green-500/50">
                    Green
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-emerald-500/50">
                    Emerald
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-teal-500/50">
                    Teal
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-cyan-500/50">
                    Cyan
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-sky-500/50">
                    Sky
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-blue-500/50">
                    Blue
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-indigo-500/50">
                    Indigo
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-violet-500/50">
                    Violet
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-purple-500/50">
                    Purple
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-fuchsia-500/50">
                    Fushih
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-pink-500/50">
                    Pink
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-rose-500/50">
                    Rose
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-slate-500/50">
                    Slate
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-gray-500/50">
                    Gray
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-zinc-500/50">
                    Zinc
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-neutral-500/50">
                    Neutral
                </div>
                <div class="w-fit aspect-square p-1 rounded-md bg-stone-500/50">
                    Stone
                </div>



            </span>



            <span class="w-full flex p-4 gap-2 flex-wrap items-center justify-center">
                <p class="w-full text-lg font-bold"> Error Colors (500/50) </p>


                <span class="flex gap-2 p-2 bg-bg-1">
                    <div class="w-fit aspect-square p-1 rounded-md bg-invalid-1">
                        Invalid 1
                    </div>
                    <div class="w-fit aspect-square p-1 rounded-md bg-invalid-soft">
                        Invalid Soft
                    </div>
                </span>


            </span>


            <ColorModeToggle />


        </span>

    </div>
</template>


<style scoped>

    @reference "@/styles/main.css";

    .display-area {
        @apply flex flex-col gap-2 p-4 bg-bg-1 text-text-1 font-bold text-lg rounded-md border-2 border-ring-1;

        .title {
            @apply opacity-50 text-sm;
        }
    }


</style>