<script lang="ts" setup>
    import { API } from '@/utils/api';
    import { supabase } from '@/utils/supabase';
    import { ArrowBigDownIcon, ArrowDownCircleIcon, CalendarSyncIcon, UserCheckIcon } from 'lucide-vue-next';
    import { DateTime } from 'luxon';
    import { getTimeZones } from '@vvo/tzdb'

    // Define Props:
    const props = defineProps<{
        guildId: string | undefined
    }>();

    const sessionTemplates = asyncComputed(async () => {
        console.log(await supabase.auth.getUser())
        if (!props.guildId) return console.error(`No guild id to fetch session templates!`);
        const { data, error } = await supabase.from('session_templates')
            .select('*')
            .eq('guild_id', props.guildId)
            .select()
        console.info('RESULTS', { data, error })
        if (!data || error) return console.error(`Failed to load guild session templates`, error, { data });
        return data;
    })

    // Session Form Control
    const sessionsFormVisible = inject<Ref<boolean>>('sessionsFormVisible');

</script>


<template>
    <div class="flex h-full! w-full grow flex-col justify-center items-center flex-1">


        <!-- Upcoming Sessions Card -->
        <div
            class="bg-black/20 rounded-md overflow-clip ring-2 w-[90%] max-w-170 ring-ring/40 flex flex-wrap flex-col items-center justify-center">
            <!-- Header - Upcoming Sessions -->
            <div
                class="flex gap-0.5 w-full border-b-2 border-ring/60 bg-black/30 p-2.5 flex-row items-center justify-between">
                <div class="flex flex-row gap-0.75 items-center">
                    <ArrowBigDownIcon :fill="'white'" :size="22" />
                    <p class="text-lg font-bold"> Upcoming Sessions </p>
                </div>
                <div>
                    <!-- Create Session Button -->
                    <Button unstyled @click="(e) => sessionsFormVisible = true"
                        class="bg-sky-600/70 hover:bg-sky-700/70 py-0.5 p-1 rounded-sm flex items-center justify-center transition-all cursor-pointer">
                        <p class="p-1 font-bold text-sm">
                            Create Session
                        </p>
                    </Button>
                </div>
            </div>

            <!-- Content - Upcoming Sessions -->
            <div class="flex gap-0.5 p-2 flex-col justify-start items-center">

                <div v-for="session in sessionTemplates"
                    class="flex flex-wrap gap-1 items-center bg-white/5 p-1 rounded-md">
                    <!-- Card Cover Content -->
                    <div class="flex flex-wrap grow">
                        <p class="bg-white/25 rounded-md p-0.5"> {{ session.title }} </p>
                        <p class="bg-white/10 rounded-md p-0.5">
                            {{ DateTime
                                .fromISO(session.starts_at_utc, { zone: session.time_zone })
                                .toLocaleString(DateTime.TIME_SIMPLE)
                            }}
                        </p>
                        <p class="bg-white/10 text-xs h-fit font-bold rounded-md p-0.5">
                            {{
                                getTimeZones({ includeUtc: true }).find(tz => tz.name == session.time_zone)?.abbreviation
                                ||
                                'UNK?'
                            }}
                        </p>
                        <div class="flex p-1 gap-1 items-center w-full">
                            <!-- Icon Row -->
                            <CalendarSyncIcon :class="{ 'opacity-30': !session.rrule }" />
                            <UserCheckIcon :class="{ 'opacity-30': !(JSON.parse(session?.rsvps as string)) }" />
                        </div>
                    </div>
                    <!-- View/Open Button -->
                    <Button size="small">
                        <p> <i class="pi pi-eye relative top-0.5" /> View </p>
                    </Button>

                </div>

                <div v-if="!sessionTemplates?.length">
                    <div class="flex bg-white/5 p-1 my-5 rounded-md ring-2 ring-ring/50">
                        <p class="opacity-70 p-1 px-3.75"> No upcoming sessions.. </p>
                    </div>

                </div>

            </div>
        </div>



    </div>
</template>


<style scoped></style>