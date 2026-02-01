<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import useDashboardStore from '@/stores/dashboard/dashboard';
    import { externalUrls, useNavStore } from '@/stores/nav';
    import type { CheckboxDesignTokens } from '@primeuix/themes/types/checkbox';
    import { UserCircle2Icon } from 'lucide-vue-next';

    // Services:
    const auth = useAuthStore();
    const nav = useNavStore();
    const router = useRouter();
    const dashboard = useDashboardStore();

    // User Guilds
    const guildsWSession = computed(() => auth.userData?.guilds.manageable.filter(g => g.hasSessionsBot));
    const guildsWOSession = computed(() => auth.userData?.guilds.manageable.filter(g => !g.hasSessionsBot).sort((a, b) => {
        return (b.isOwner ? 1 : 0) - (a.isOwner ? 1 : 0);
    }));


    // Saved Guild Choice In Future:
    const checkboxDT: CheckboxDesignTokens = {
        root: {
            background: `var(--color-zinc-700)`,
            borderColor: `var(--color-zinc-700)`,
            focusBorderColor: `var(--color-zinc-400)`,
            hoverBorderColor: `var(--color-zinc-400)`,
            checkedHoverBorderColor: `var(--color-indigo-400)`,
            checkedBackground: `var(--color-indigo-400)`,
            checkedBorderColor: `var(--color-indigo-400)`,
            checkedHoverBackground: `var(--color-indigo-400)`,
        },
        icon: {
            checkedColor: 'black',
            checkedHoverColor: 'black',
            color: 'black',
        }
    }
    const saveGuildChoiceEnabled = ref<boolean>();

    // Select Ready Server fn:
    function selectReadyServer(guildId: string) {
        if (saveGuildChoiceEnabled.value) {
            dashboard.saveGuildChoice.set(guildId);
        } else {
            dashboard.saveGuildChoice.clear();
        };
        dashboard.nav.expanded = false;
        return dashboard.guildId = guildId;
    }

    // Still Loading Alert - Authentication Timeout:
    const showStillLoadingCard = ref(false);
    const startAuthTimer = async (timeout = 3500) => {
        // If already authed - Return:
        if (auth.signedIn) return true;
        // Wait for Sign In or Timeout:
        const authed = await Promise.race([
            new Promise<boolean>(res => watch(() => auth.signedIn, (signedIn) => {
                if (signedIn) res(true);
            }, { once: true })),
            new Promise<boolean>(res => setTimeout(() => res(false), timeout))
        ])
        // Show Sign In Alert if necessary:
        if (!authed) {
            showStillLoadingCard.value = true;
        }
    }

    onMounted(() => {
        // If not Signed In - Start Auth Timer:
        if (!auth.signedIn) {
            startAuthTimer()
        }
    })


</script>


<template>
    <div class="flex justify-center items-center w-full! flex-1">
        <!-- Select Server - Authenticated -->
        <section
            class="flex flex-col justify-center items-center bg-neutral-900 ring-2 ring-ring w-full m-10 max-w-150 rounded-sm"
            v-if="auth.signedIn">

            <!-- Ready to Go - Server Selection -->
            <span v-if="guildsWSession?.length" class="w-full flex flex-col items-center justify-center">
                <p class="font-black text-2xl p-5 pb-0"> Select a Server: </p>
                <p class="p-5 pt-0 opacity-70"> Ready to go, already has Sessions Bot.</p>
                <div
                    class="flex flex-wrap flex-row gap-2 pb-4 justify-center items-center w-full bg-white/5 border-y-2 border-ring">
                    <!-- Guilds List -->
                    <span
                        class="flex flex-wrap flex-row gap-2 justify-center items-center w-full p-4 pb-2 max-h-100 overflow-y-auto">

                        <Button v-for="guild of guildsWSession" :title="guild.name"
                            @click="selectReadyServer(guild?.id)" unstyled
                            class="bg-black/40 grow hover:bg-black/20 hover:ring-[2px] ring-indigo-400/80 cursor-pointer transition-all p-4 min-w-27 rounded-sm flex flex-col gap-1 justify-center items-center flex-wrap">
                            <img :src="guild?.icon" class="size-11 rounded-full ring-2 ring-ring" />
                            <p class="font-semibold"> {{ guild.name }} </p>
                        </Button>
                    </span>


                    <!-- Save Choice Check -->
                    <span class="w-full flex flex-row gap-1 items-center justify-center">
                        <Checkbox size="small" class="scale-90" binary input-id="rememberGuild"
                            v-model="saveGuildChoiceEnabled" :dt="checkboxDT" />
                        <label for="rememberGuild" class="text-xs">
                            Remember my choice for next time
                        </label>
                    </span>


                    <!-- Resync Info -->
                    <span class="flex w-full">
                        <p class="opacity-70 mx-5 text-xs text-center w-full">
                            Not seeing the server you're looking for?
                            Refresh your data on your
                            <RouterLink to="/account" class="text-sky-500 cursor-pointer hover:underline">
                                account</RouterLink>
                            page.
                        </p>
                    </span>

                </div>
            </span>



            <!-- Invite-able - Guilds Selection Area -->
            <span class="w-full flex flex-col items-center justify-center">
                <!-- Subheading - Invite Bot -->
                <p class="font-bold text-lg p-4 pb-0" :class="{ 'text-3xl!': !guildsWSession?.length }">
                    {{ guildsWSession?.length ? 'Or' : '' }} Invite Sessions Bot
                </p>
                <!-- No Session Bot Servers - Text -->
                <div v-if="!guildsWSession?.length"
                    class="flex p-2 px-4 gap-1 opacity-70 text-xs flex-col items-center justify-center">
                    <p class="font-bold">
                        It seems like you currently don't manage any Discord servers
                        with Sessions Bot installed as an application!
                    </p>
                    <p class="px-3 opacity-70">
                        ** In order to access and utilize the dashboard you'll have to
                        add the bot to a server you manage or own!
                    </p>
                </div>
                <!-- Invite to Another - Text -->
                <p v-else class="text-xs p-3 pt-0 opacity-70"> To a server you manage/own: </p>
                <!-- Basic - Invite Button -->
                <a :href="externalUrls.inviteBot">
                    <Button unstyled
                        class="px-2 mb-5 py-1.25 rounded-sm drop-shadow-md bg-zinc-500/80 hover:bg-indigo-500 transition-all cursor-pointer flex flex-row gap-1.25 items-center justify-center">
                        <i class="pi pi-discord drop-shadow-sm" />
                        <p class="font-medium text-sm text-shadow-sm"> Invite the Bot </p>
                    </Button>
                </a>
                <!-- No Sessions Bot Servers - Text -->
                <div>

                </div>

            </span>




        </section>

        <!-- Loading - Not Signed In -->
        <section v-else>

            <div class="bg-black/40 max-w-75 p-5 rounded-md text-white/70 flex items-center justify-center flex-col">
                <ProgressSpinner stroke-width="5" class="size-12!" />

                <span v-if="showStillLoadingCard" class="flex items-center justify-center flex-col">
                    <p class="pt-0.5 font-bold"> Still Loading? </p>
                    <p class="text-sm"> You might want to refresh this page or ensure your logged into
                        an account. </p>
                    <RouterLink to="/account" class="pt-2">
                        <Button unstyled
                            class="bg-zinc-700/40 hover:bg-zinc-700/60 p-1 py-0.5 cursor-pointer active:scale-95 transition-all rounded-md flex gap-0.75 flex-row items-center justify-center">
                            <UserCircle2Icon :size="19" :stroke-width="1.5" />
                            <p> My account </p>
                        </Button>
                    </RouterLink>
                </span>
            </div>


        </section>

    </div>
</template>


<style scoped></style>