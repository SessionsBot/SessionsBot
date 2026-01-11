<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import SelectServer from './selectServer.vue';
    import ServerDashboard from './serverDashboard.vue';
    import useDashboardStore from '@/stores/dashboard/dashboard';

    const dashboard = useDashboardStore();
    const selectedGuildId = computed(() => dashboard.guild.id);

    // ON - Initial Full Page Mount:
    onMounted(() => {
        // Load Saved "Guild Selection":
        const choice = dashboard.saveGuildSelection.get();
        if (choice) dashboard.guild.id = choice;
    })

</script>


<template>
    <div class="flex flex-col w-full h-full items-start">
        <!-- :class="{ 'max-w-screen! max-h-screen! overflow-clip!': dashboard.scrollLock }" -->


        <div class=" bg-emerald-500 w-full h-full grow flex flex-col items-center justify-center">

            <div class="bg-red-400/20 w-full flex grow flex-row">
                <!-- Dashboard Nav -->
                <aside class="w-12 min-12 h-inherit! overflow-clip overflow-y-auto flex bg-amber-400"
                    :class="{ 'isExpanded': dashboard.nav.expanded }">


                    <span @click="dashboard.nav.expanded = !dashboard.nav.expanded">
                        Expand
                    </span>

                </aside>
                <!-- Dashboard Tab View -->
                <main class="flex flex-wrap grow bg-sky-400/40 overflow-clip overflow-y-auto">


                </main>
            </div>

            <!-- <Transition name="zoom" mode="out-in">
                <SelectServer v-if="!selectedGuildId" />
                <ServerDashboard v-else />
            </Transition> -->

        </div>
    </div>



</template>


<style scoped>

    @reference "@/styles/main.css";

    aside {
        &.isExpanded {
            @apply min-w-45 w-45
        }
    }

</style>