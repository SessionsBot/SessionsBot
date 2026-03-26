<script lang="ts" setup>
    import { externalUrls } from '@/stores/nav';


</script>


<template>
    <div class="flex justify-center items-center w-full">
        <Accordion class="w-full">

            <!-- Whats a Session? -->
            <AccordionPanel value="1">
                <AccordionHeader class="bg-bg-soft! rounded-t">
                    What's a Session?
                </AccordionHeader>
                <AccordionContent :pt="{ content: 'bg-bg-4/45! p-4! pb-2!' }">

                    <span class="font-medium opacity-90">
                        A Session represents a single scheduled event within your server.
                        <br>
                        <span class="text-sm mt-2 flex">Whether it's a game night,
                            study group, meeting, or recurring activity, Sessions give you a flexible way to organize
                            and
                            manage participation.</span>
                    </span>
                    <span class="flex justify-end w-full mt-3">
                        <a :href="`${externalUrls.documentation}/about#what-are-sessions`" title="Read more"
                            target="_blank"
                            class="flex group items-center relative flex-row gap-1 opacity-50 hover:opacity-85 transition-all">
                            <p class="text-sm">
                                Read more
                            </p>
                            <Iconify icon="ic:round-arrow-right-alt" />
                            <div
                                class="h-0.5 rounded-full opacity-0 group-hover:opacity-75 transition-all w-full bg-text-1 absolute bottom-0" />
                        </a>
                    </span>

                </AccordionContent>
            </AccordionPanel>


            <!-- How to get started for the first time? -->
            <AccordionPanel value="2">
                <AccordionHeader class="bg-bg-soft! rounded-t">
                    How do I get started for the first time?
                </AccordionHeader>
                <AccordionContent :pt="{ content: 'bg-bg-4/45! p-4! pb-2!' }">

                    <span class="font-medium opacity-90">
                        You can get started with 3 quick easy steps:
                        <ul class="text-sm opacity-75 ml-2">
                            <li>1. Invite the bot to any Discord server you manage or own.</li>
                            <li>2. Access your bot dashboard (you're here) and configure your first session.</li>
                            <li>3. Wait for the bot to automatically send and manage your session</li>
                        </ul>
                    </span>
                    <span class="flex justify-end w-full mt-3">
                        <a :href="`${externalUrls.documentation}/getting-started`" title="Read more" target="_blank"
                            class="flex group items-center relative flex-row gap-1 opacity-50 hover:opacity-85 transition-all">
                            <p class="text-sm">
                                Read more
                            </p>
                            <Iconify icon="ic:round-arrow-right-alt" />
                            <div
                                class="h-0.5 rounded-full opacity-0 group-hover:opacity-75 transition-all w-full bg-text-1 absolute bottom-0" />
                        </a>
                    </span>

                </AccordionContent>
            </AccordionPanel>


            <!-- Do I need to use the dashboard? -->
            <AccordionPanel value="3">
                <AccordionHeader class="bg-bg-soft! rounded-t">
                    Do I have to use the dashboard?
                </AccordionHeader>
                <AccordionContent :pt="{ content: 'bg-bg-4/45! p-4! pb-2!' }">

                    <span class="font-medium opacity-90 text-sm">
                        Yes, as of now there's no way to fully use Sessions Bot without accessing your Bot Dashboard
                        online, this is due to development restrictions.
                    </span>
                    <span class="flex justify-end w-full mt-3">
                        <a :href="`${externalUrls.documentation}/about#what-are-sessions`" title="Read more"
                            target="_blank"
                            class="flex group items-center relative flex-row gap-1 opacity-50 hover:opacity-85 transition-all">
                            <p class="text-sm">
                                Read more
                            </p>
                            <Iconify icon="ic:round-arrow-right-alt" />
                            <div
                                class="h-0.5 rounded-full opacity-0 group-hover:opacity-75 transition-all w-full bg-text-1 absolute bottom-0" />
                        </a>
                    </span>

                </AccordionContent>
            </AccordionPanel>


            <!-- Is sessions bot free? -->
            <AccordionPanel value="4">
                <AccordionHeader class="bg-bg-soft! rounded-t">
                    Is the bot free?
                </AccordionHeader>
                <AccordionContent :pt="{ content: 'bg-bg-4/45! p-4! pb-2!' }">

                    <span class="font-medium opacity-90 text-sm">
                        Yes, Sessions Bot is free to use with exclusive access to certain features available for
                        purchase
                        through premium subscription plans.
                    </span>
                    <span class="flex justify-end w-full mt-3">
                        <RouterLink to="/pricing" title="Read more" target="_blank"
                            class="flex group items-center relative flex-row gap-1 opacity-50 hover:opacity-85 transition-all">
                            <p class="text-sm">
                                Read more
                            </p>
                            <Iconify icon="ic:round-arrow-right-alt" />
                            <div
                                class="h-0.5 rounded-full opacity-0 group-hover:opacity-75 transition-all w-full bg-text-1 absolute bottom-0" />
                        </RouterLink>
                    </span>

                </AccordionContent>
            </AccordionPanel>

            <!-- Different Questions - Support Chat -->
            <AccordionPanel value="99" :pt="{ root: 'border-b-0!' }">
                <AccordionHeader class="bg-bg-soft! rounded-t">
                    Have a different question?
                </AccordionHeader>
                <AccordionContent :pt="{ content: 'bg-bg-4/45! p-4!' }">
                    <div class="flex flex-col">
                        <span class="text-text-2">
                            Our Support Team is available to assist you through Discord and <a
                                href="mailto:support@sessionsbot.fyi" target="_blank"
                                class="text-link hover:underline">by email</a>.
                        </span>
                        <span class="text-text-2 text-sm mt-2">
                            - If you have a question, concern,
                            or comment that's not mentioned here don't be afraid to reach out!
                        </span>
                        <span class="flex-center w-full mt-3">
                            <a :href="externalUrls.discordServer.supportInvite" title="Discord Support Chat"
                                target="_blank">
                                <Button unstyled class="button-base button-primary border border-ring-soft pr-1.5">
                                    <Iconify icon="carbon:logo-discord" class="size-5 mr-0.5 ml-1" />
                                    <p class="font-semibold text-sm">
                                        Support Chat
                                    </p>
                                </Button>
                            </a>
                        </span>
                    </div>
                </AccordionContent>
            </AccordionPanel>

        </Accordion>
    </div>
</template>


<style scoped></style>