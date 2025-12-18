<script lang="ts" setup>
    import { supabase } from '@/utils/supabase';


    // Define Props:
    const props = defineProps<{
        guildId: string | undefined
    }>();

    const guildsTemplates = asyncComputed(async () => {
        if (!props.guildId) return console.error(`No guild id to fetch session templates!`);
        const { data, error } = await supabase.from('session_templates').select('*').eq('guild_id', props.guildId).select()
        if (!data || error) return console.error(`Failed to load guild session templates`, error, { data });
        console.info('Got template results', data);
        return data
    })

</script>


<template>
    <div class="flex h-full! w-full grow flex-col justify-center items-center flex-1">
        <p> SESSIONS TAB </p>

        {{ guildsTemplates }}
    </div>
</template>


<style scoped></style>