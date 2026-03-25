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

                    <span>
                        A session represents any event...
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