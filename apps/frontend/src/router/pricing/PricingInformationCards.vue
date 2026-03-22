<script lang="ts" setup>
    import { externalUrls } from '@/stores/nav';


</script>


<template>
    <div class="flex justify-evenly items-center gap-5 flex-wrap w-full px-5">

        <!-- Billing & Payments -- Card -->
        <span
            class="bg-bg-2 border border-ring-soft p-2 rounded-md flex items-center justify-start flex-col max-w-95 h-fit">
            <span class="flex-center flex-row gap-0.5 p-2">
                <Iconify icon="mdi:money" />
                <p class="text-lg font-bold">
                    Billing & Payments
                </p>
            </span>
            <ul class="list-disc list-inside space-y-2 my-2 mt-1">
                <li class="opacity-55 font-medium">
                    All purchases are processed securely through Discord and their partners.
                </li>
                <li class="opacity-55 font-medium">
                    Pricing may vary slightly by region such as taxes, currency, etc.
                </li>
                <li class="opacity-55 font-medium">
                    Subscriptions <b>renew automatically</b> until canceled!
                </li>
                <li class="opacity-55 font-medium">
                    You can manage or <b>cancel anytime</b> in your Discord settings. <br>
                    <span class="text-xs italic opacity-55 pl-5.5">Open Discord > Profile > Settings >
                        Subscriptions</span>
                </li>
            </ul>
        </span>


        <!-- Refunds & Cancellations -- Card -->
        <span
            class="bg-bg-2 border border-ring-soft p-2 rounded-md flex items-center justify-start flex-col max-w-95 h-fit">
            <span class="flex-center flex-row gap-0.5 p-2">
                <Iconify icon="tabler:receipt-refund" />
                <p class="text-lg font-bold">
                    Refunds & Cancellations
                </p>
            </span>
            <ul class="list-disc list-inside space-y-2 my-2 mt-1">
                <li class="opacity-55 font-medium">
                    Refunds are processed and handled according to Discord’s policies.
                </li>
                <li class="opacity-55 font-medium">
                    Experience issues? Contact our <a :href="externalUrls.discordServer.supportInvite" target="_blank"
                        class="text-link hover:underline">Support Team</a> and we’ll do our best to
                    resolve them!
                </li>
                <li class="opacity-55 font-medium">
                    Cancel anytime — your benefits remain active until the end of the billing cycle.
                </li>
            </ul>
        </span>

    </div>

</template>


<style scoped></style>