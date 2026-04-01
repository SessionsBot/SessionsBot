<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import useNotifier from '@/stores/notifier';
    import { supabase } from '@/utils/supabase';


    // Services:
    const auth = useAuthStore();
    const router = useRouter();
    const notifier = useNotifier();

    // Input Value:
    const accessVal = ref<string>('')
    const refreshVal = ref<string>('')

    // Function - Submit Token:
    async function submitToken() {
        const accessToken = accessVal.value
        const refreshToken = refreshVal.value

        // Missing Token:
        if (!accessToken?.length || refreshToken?.length) notifier.send({
            level: 'error',
            actions: false,
            header: 'Missing Token(s)!',
            duration: 2
        })
        const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        })

        if (error) {
            // Send Alert & Log:
            console.error('Developer Sign In Failed:', error)
            return notifier.send({
                level: 'error',
                actions: false,
                header: 'Sign In — Failed!',
                content: 'Please see the browser console for more information...',
            })
        }

        if (data?.session && data?.user) {
            // Signed in!
            console.info('Developer Sign In:', data)
            window.location.pathname = '/account'
        }
    }

    // On Mounted:
    onMounted(() => {
        if (auth.signedIn) {
            router.push('/account')
        }
    })

</script>


<template>
    <div class="flex justify-center items-center grow h-full flex-center flex-wrap p-8">

        <div class="bg-bg-soft border-2 border-ring-soft rounded-lg p-7 m-8 w-[90%] max-w-95">

            <span class="flex-center justify-start flex-row gap-2">
                <Iconify icon="mdi:tools" />
                <p class="font-bold text-lg">
                    Developer Login
                </p>
            </span>

            <form @submit.prevent="submitToken" class="flex-center items-start flex-col gap-1 mt-5">
                <label class="text-sm italic flex-center justify-start gap-px">
                    <Iconify icon="mdi:lock" class="inline size-4.5" /> Please enter your access token:
                </label>
                <InputText size="small" type="text" placeholder="Access Token" :autocomplete="undefined" fluid
                    v-model:model-value="accessVal" />

                <label class="text-sm italic mt-2 flex-center justify-start">
                    <Iconify icon="mdi:refresh" class="inline size-4.5" /> Please enter your refresh token:
                </label>
                <InputText size="small" type="text" placeholder="Refresh Token" :autocomplete="undefined" fluid
                    v-model:model-value="refreshVal" />

                <Button type="submit" :disabled="!accessVal?.length || !refreshVal?.length" unstyled
                    class="button-base button-primary self-end mt-4">
                    <Iconify icon="mdi:check" class="size-5" />
                    <p class="font-bold"> Submit </p>
                </Button>
            </form>

        </div>

    </div>
</template>


<style scoped></style>