<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { supabase } from '@/utils/supabase';


    // Services:
    const auth = useAuthStore();
    const dashboard = useDashboardStore()
    const route = useRoute()

    const sessionId = computed(() => route.params?.sessionId as string)

    // Session Data:
    const sessionData = useAsyncState(async () => {
        if (!sessionId.value) throw new Error('No Session ID for data fetch provided!')
        const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId.value);
        if (error) throw error
        else return data
    }, null, { immediate: false })

</script>


<template>
    <main class="flex justify-center items-center flex-col gap-2 p-4">
        {{ route.params?.sessionId || 'Id Not Found' }}

        {{ sessionData.isReady }}

        {{ sessionData.state || 'null' }}

        <Button severity="success" @click="sessionData.execute()" :disabled="sessionData.isLoading.value">
            Fetch
        </Button>

    </main>
</template>


<style scoped></style>