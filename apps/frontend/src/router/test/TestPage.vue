<script lang="ts" setup>
    import DiscordEditor2 from './DiscordEditor/DiscordEditor.vue';
    import StatusBadge from './StatusBadge.vue';
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
                <p class="text-text-soft!"> Text S </p>

            </span>


            <span class="display-area bg-bg-2! border-ring-2!">

                <p class="title"> Bg 2 </p>

                <p class="text-text-1!"> Text 1 </p>
                <p class="text-text-2!"> Text 2 </p>
                <p class="text-text-3!"> Text 3 </p>
                <p class="text-text-soft!"> Text S </p>

            </span>

            <span class="display-area bg-bg-3! border-ring-3!">

                <p class="title"> Bg 3 </p>

                <p class="text-text-1!"> Text 1 </p>
                <p class="text-text-2!"> Text 2 </p>
                <p class="text-text-3!"> Text 3 </p>
                <p class="text-text-soft!"> Text S </p>

            </span>

            <span class="display-area bg-bg-soft! border-ring-soft!">

                <p class="title"> Bg SOFT </p>

                <p class="text-text-1!"> Text 1 </p>
                <p class="text-text-2!"> Text 2 </p>
                <p class="text-text-3!"> Text 3 </p>
                <p class="text-text-soft!"> Text S </p>

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