<script setup>
    // https://vitepress.dev/guide/extending-default-theme#layout-slots
    import DefaultTheme from 'vitepress/theme'
    import PageFeedback from '../../src/components/PageFeedback.vue';
    import CookiesAlert from '../../src/components/cookieConsent/cookiesAlert.vue';

    const { Layout } = DefaultTheme
</script>

<template>
    <Layout>

        <!-- Cookie Consent Banner -->
        <template #layout-top>

            <CookiesAlert />

        </template>


        <!-- End of Doc Page - Was Helpful Feedback? -->
        <template #doc-footer-before>
            <div class="doc-bottom">

                <PageFeedback />

            </div>
        </template>
    </Layout>
</template>

<style scoped>

    @reference "@theme/custom.css";

    .doc-bottom {
        @apply my-2 pb-1.25 w-full self-start flex items-center justify-center;
    }

</style>