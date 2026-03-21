<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import { externalUrls, useNavStore } from '@/stores/nav';


    // Services:
    const auth = useAuthStore()
    const nav = useNavStore()

    // Incoming Props:
    const props = defineProps<{
        rawId: string
    }>()

</script>


<template>
    <div class="card p-7 flex-col">
        <span class="flex flex-center gap-1.5 flex-row text-xl p-2">
            <Iconify icon="mdi:warning" size="26" class="text-amber-600" />
            <p class="font-extrabold"> We couldn't find that session! </p>
        </span>


        <!-- Details -->
        <div class="w-full flex flex-center flex-col p-2">
            <p class="opacity-75 font-semibold text-sm pb-2">
                There's a few reason why this might have happened:
            </p>
            <span class="w-full px-3 ml-4 flex flex-col text-start justify-start items-start text-sm opacity-75">
                <li>
                    The session is <b>outdated</b> or <b>has been deleted</b>.
                </li>
                <li>
                    The session is private and you <b>don't have access</b>! <br>
                    <span @click="auth.signIn($route.fullPath)" v-if="!auth.signedIn"
                        class="opacity-50 cursor-pointer hover:opacity-90 hover:underline transition-all text-xs ml-2.75">
                        - Try
                        signing
                        into
                        an account here</span>
                </li>
                <li>
                    Rarely, an internal server error has occurred. <br>
                    <a :href="externalUrls.statusPage" target="_blank"
                        class="opacity-50 cursor-pointer hover:opacity-90 hover:underline transition-all text-xs ml-2.75">
                        - Check our status page here</a>
                    <br>
                    <span v-if="(nav.systemStatus.state?.data.data?.down.length ?? 0) > 1"
                        class="flex text-xs font-bold ml-4 flex-center flex-row gap-0.5 p-1 py-0.5 w-fit bg-bg-soft border border-ring-soft rounded-lg">
                        <Iconify icon="mdi:warning" size="14" class="text-invalid-1 animate-pulse" />
                        Systems are down!
                    </span>
                </li>
            </span>
        </div>

        <span class="text-xs opacity-55 px-4 mt-4">
            Requested ID: <span class="italic">{{ rawId ?? '?' }}</span>
        </span>
        <RouterLink to="/support"
            class="text-xs italic opacity-35 hover:opacity-70 transition-all mt-2 hover:underline px-4">
            Need Help?
        </RouterLink>
    </div>
</template>


<style scoped></style>