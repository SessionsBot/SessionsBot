<script lang="ts" setup>
    import { externalUrls } from '@/stores/nav';
    import AllResourcesList from './AllResourcesList.vue';

    import LandingSection from './LandingSection.vue';
    import StatusBadge from '../../components/StatusBadge.vue';


</script>


<template>
    <div class="flex justify-start items-center flex-col w-full flex-nowrap">
        <!-- Hero - Top Landing Area -->
        <LandingSection />




        <!-- Heading Area -->
        <div class="w-full w-full p-5 pb-0 flex flex-col items-start justify-start max-w-250">
            <p class="font-bold text-lg">
                - Most Searched For
            </p>
            <p class="opacity-65 text-sm">
                Common support resources to get you where you need to be:
            </p>
        </div>
        <!-- Main Resource Cards -->
        <span class="w-full p-5 pb-0 gap-5 flex-center items-start flex-wrap">


            <!-- General Questions - FAQ -->
            <div
                class="bg-bg-soft p-3 gap-1.25 max-w-70 flex items-center justify-center flex-col rounded-md border-ring-soft hover:border-ring-2 border-2 transition-all">

                <span class="flex flex-row gap-1.5 w-full items-center">
                    <Iconify icon="octicon:question-16" size="22" />
                    <p class="w-full font-extrabold text-xl">
                        General Questions?
                    </p>
                </span>
                <div class="w-[80%] rounded-full h-0.75 bg-bg-4" />
                <p class="px-5 text-text-3">
                    It's possible this question has already been answered in our FAQs resource, feel free
                    to check that out!
                </p>
                <div class="w-[80%] rounded-full h-0.75 bg-bg-4" />
                <Button unstyled
                    class="button-base font-bold mt-1 px-2 py-0.5 bg-zinc-500/75 hover:bg-zinc-500/60 active:bg-zinc-500/65 active:scale-95">
                    <Iconify icon="wpf:faq" size="18" class="mr-0.5" />
                    View FAQs
                </Button>
            </div>

            <!-- Learn - Documentation -->
            <div
                class="bg-bg-soft p-3 gap-1.25 max-w-80 flex items-center justify-center flex-col rounded-md border-ring-soft hover:border-ring-2 border-2 transition-all">

                <span class="flex flex-row gap-1.5 w-full items-center">
                    <Iconify icon="mingcute:paper-2-line" size="22" />
                    <p class="w-full font-extrabold text-xl">
                        Read the Documentation
                    </p>
                </span>
                <div class="w-[80%] rounded-full h-0.75 bg-bg-4" />
                <p class="px-5 text-text-3">
                    We've created an extensive documentation site for you to read through to get comfortable with
                    Sessions Bot!
                </p>
                <div class="w-[80%] rounded-full h-0.75 bg-bg-4" />
                <a :href="externalUrls.documentation" target="_blank">
                    <Button unstyled
                        class="button-base font-bold mt-1 px-2 py-0.5 bg-zinc-500/75 hover:bg-zinc-500/60 active:bg-zinc-500/65 active:scale-95">
                        <Iconify icon="material-symbols:docs" size="18" class="mr-0.5" />
                        View Docs
                    </Button>
                </a>
            </div>

            <!-- Support - Chat -->
            <div
                class="bg-bg-soft p-3 gap-1.25 max-w-80 flex items-center justify-center flex-col rounded-md border-ring-soft hover:border-ring-2 border-2 transition-all">

                <span class="flex flex-row gap-1.5 w-full items-center">
                    <Iconify icon="bx:chat" size="22" />
                    <p class="w-full font-extrabold text-xl">
                        Chat with Support
                    </p>
                </span>
                <div class="w-[80%] rounded-full h-0.75 bg-bg-4" />
                <p class="px-5 text-text-3">
                    Still stuck? Don't worry, join our community server and create a new Support Ticket to speak
                    with a member of our Bot Support team.
                </p>
                <div class="w-[80%] rounded-full h-0.75 bg-bg-4" />
                <a :href="externalUrls.discordServer.supportInvite" target="_blank">
                    <Button unstyled
                        class="button-base font-bold mt-1 px-2 py-0.5 bg-zinc-500/75 hover:bg-zinc-500/60 active:bg-zinc-500/65 active:scale-95">
                        <Iconify icon="basil:chat-solid" size="22" class="mr-0.5" />
                        Support Chat
                    </Button>
                </a>
            </div>

        </span>


        <!-- Status Area -->
        <div class="w-full w-full p-5 pb-1 flex flex-col items-start justify-start max-w-250">
            <p class="font-bold text-lg">
                - System Status
            </p>
            <p class="opacity-65 text-sm">
                Basic overview of our current system status: <i>(click for details)</i>
            </p>

            <StatusBadge class="pt-4 self-center" />

        </div>


        <!-- Spacer -->
        <span class="w-full items-center justify-center flex-wrap flex grow">

            <!-- All Resources -->
            <div class="w-full p-5 pt-8 mb-5 flex items-center justify-center">
                <AllResourcesList />
            </div>

        </span>


        <SiteFooter />


    </div>
</template>


<style scoped></style>