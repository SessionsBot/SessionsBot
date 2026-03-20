<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { supabase } from '@/utils/supabase';
    import z from 'zod';
    import SessionDetailsCard from './components/SessionDetailsCard.vue';
    import ErrorFetchingCard from './components/ErrorFetchingCard.vue';
    import SignInCard from './components/SignInCard.vue';


    // Services:
    const auth = useAuthStore();
    const dashboard = useDashboardStore()
    const route = useRoute()

    // Session Data:
    const rawId = computed(() => route.params?.sessionId as string)
    const sessionIdInvalid = ref(false)

    // Auth - Sign In Alert:
    const signInAlertDismissed = ref(false)

    const sessionData = useAsyncState(async (id: string) => {
        if (!id) throw new Error('No Session ID for data fetch provided!')
        const { data, error } = await supabase.from('sessions')
            .select('*, session_rsvp_slots(*, session_rsvps(*))')
            .eq('id', id)
            .single()
        if (error) throw error
        else return data
    }, undefined, {
        immediate: false,
        onError(e) {
            console.error(`[SESSION DATA]: Failed to fetch!`, e)
        },
    })
    const s = computed(() => sessionData.state.value)

    onMounted(() => {
        // Validate & Load Session by Id:
        if (rawId.value) {
            // validate
            const validation = z.uuid().safeParse(rawId.value)
            if (validation.success) {
                // Valid Session Id - Attempt Fetch:
                sessionData.executeImmediate(validation.data)
            } else {
                // Invalid Id Format:
                sessionIdInvalid.value = true
            }
        } else {
            // Invalid - No Id Provided:
            sessionIdInvalid.value = true
        }
    })

</script>


<template>
    <main class="flex relative justify-center items-center flex-col gap-2 p-4 max-w-[100vw]!">

        <!-- Back to Dashboard - Breadcrumb -->
        <div class="absolute! group/bc hover:text-brand-2 cursor-pointer flex w-fit h-fit top-3.5! left-3.5! z-3!">

            <RouterLink v-if="auth.signedIn" to="/dashboard"
                class="flex w-fit h-fit flex-center gap-1.5 text-sm flex-row">
                <Iconify icon="mynaui:arrow-long-left" class="group-hover/bc:-translate-x-0.75 transition-all"
                    size="20" />
                <p class="opacity-65"> Go to Dashboard </p>
            </RouterLink>

        </div>

        <!-- Main Content - Wrap -->
        <div class="w-full flex-center flex-col gap-4.5 min-h-[87vh] p-5 my-5 text-center overflow-x-auto">
            <!-- Sign In For More Details - Card -->
            <Transition name="zoom">
                <SignInCard
                    v-if="auth.authReady && sessionData.isReady.value && !sessionData.isLoading.value && !signInAlertDismissed && !auth.signedIn"
                    v-model:dismissed="signInAlertDismissed" />
            </Transition>

            <!-- Main Content - Cards -->
            <Transition name="zoom" mode="out-in">


                <!-- Invalid Id - Card -->
                <div v-if="sessionIdInvalid" class="card p-7 flex-col">
                    <span class="flex flex-center gap-1.5 flex-row text-xl p-2">
                        <Iconify icon="mdi:warning" size="26" />
                        <p class="font-bold"> Invalid Session ID! </p>
                    </span>

                    <p class="opacity-75 font-semibold text-sm">
                        Please confirm the Session ID you're trying to view!
                    </p>
                    <p class="text-xs italic opacity-55 px-4 mt-4">
                        Requested UID: {{ rawId ?? '?' }}
                    </p>
                    <RouterLink to="/support"
                        class="text-xs italic opacity-35 hover:opacity-70 transition-all mt-2 hover:underline px-4">
                        Need Help?
                    </RouterLink>
                </div>


                <!-- Failure Fetching - Card -->
                <ErrorFetchingCard v-else-if="sessionData.error.value != null" :rawId />


                <!-- Loading Session - Card -->
                <div v-else-if="!sessionData.isReady.value || sessionData.isLoading.value" class="card p-7 flex-col">
                    <span class="flex flex-center gap-1.5 flex-row text-xl p-2">
                        <Iconify icon="mingcute:loading-3-line" size="26" class="animate-spin" />
                        <p class="font-bold"> Loading </p>
                    </span>

                    <p class="opacity-75 font-semibold text-sm">
                        Please wait while we fetch this sessions details...
                    </p>
                    <p class="text-xs italic opacity-55 px-4 mt-4">
                        Session UID: {{ rawId ?? '?' }}
                    </p>
                </div>


                <!-- Session - Data View - Card -->
                <SessionDetailsCard v-else :session="s" />



            </Transition>

        </div>

        <SiteFooter class="py-4" />

    </main>
</template>


<style scoped>

    @reference "@/styles/main.css";

    :deep(.card) {
        @apply p-3 max-w-[80%] m-7 rounded-md bg-bg-2 border-2 border-ring-soft flex flex-center;
    }


</style>