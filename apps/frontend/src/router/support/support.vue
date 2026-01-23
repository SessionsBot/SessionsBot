<script lang="ts" setup>
    import AllResourcesList from './AllResourcesList.vue';
    import LandingSection from './LandingSection.vue';

</script>


<template>
    <div class="flex justify-start items-center flex-col">
        <!-- Hero - Top Landing Area -->
        <LandingSection />

        <!-- General Questions - FAQs -->
        <div class="w-full p-5 flex items-center justify-center">
            <p>
                Have a generalized question about or how to use Sessions Bot?
            </p>
            <p>
                It's possible this questions already been answered in our Frequently asked Questions resource, feel free
                to
                check that out!
            </p>
        </div>


        <!-- Documentation - Reference -->
        <div class="w-full p-5 flex items-center justify-center">

            <p>
                Want to learn all there is to know about Sessions Bot and it's features?
            </p>
            <p>
                We've created an extensive documentation site for you to read through to get comfortable with Sessions
                Bot!
            </p>
        </div>


        <!-- All Resources -->
        <div class="w-full p-5 flex items-center justify-center">
            <AllResourcesList />
        </div>
    </div>
</template>


<style scoped></style>