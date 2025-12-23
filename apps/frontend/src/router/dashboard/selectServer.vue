<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import { externalUrls, useNavStore } from '@/stores/nav';
    import type { CheckboxDesignTokens } from '@primeuix/themes/types/checkbox';
    import { defaultWindow } from '@vueuse/core';

    // Services:
    const auth = useAuthStore();
    const nav = useNavStore();
    const router = useRouter();

    // User Guilds
    const guildsWSession = computed(() => auth.userData?.guilds.manageable.filter(g => g.hasSessionsBot));
    const guildsWOSession = computed(() => auth.userData?.guilds.manageable.filter(g => !g.hasSessionsBot).sort((a, b) => {
        return (b.isOwner ? 1 : 0) - (a.isOwner ? 1 : 0);
    }));
    const maxWOSessionsLength = 4;

    // Define Emits
    const emits = defineEmits<{
        selectServer: [guildId: string],
    }>();

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
    class savedGuildChoice {
        static saveKey = 'SGC_Dashboard'
        static get() {
            return sessionStorage.getItem(savedGuildChoice.saveKey)
        }
        static set(guildId: string) {
            return sessionStorage.setItem(savedGuildChoice.saveKey, guildId)
        }
        static clear() {
            return sessionStorage.removeItem(savedGuildChoice.saveKey)
        }
    };

    // Select Ready Server fn:
    function selectReadyServer(guildId: string) {
        if (saveGuildChoiceEnabled.value) {
            console.info('Saving future guild choice')
            savedGuildChoice.set(guildId);
        };
        return emits('selectServer', guildId);
    }

    onBeforeMount(() => {
        const choice = savedGuildChoice.clear()
        // ! Before Production: Switch back over
        // if (choice) emits('selectServer', choice)
    });


</script>


<template>
    <div class="flex justify-center items-center w-full! flex-1">

        <section
            class="flex flex-col justify-center items-center bg-neutral-900 ring-2 ring-ring w-full mx-10 max-w-150 rounded-sm">

            <!-- Ready to Go - Server Selection -->
            <span v-if="guildsWSession?.length" class="w-full flex flex-col items-center justify-center">
                <p class="font-black text-2xl p-5 pb-0"> Select a Server: </p>
                <p class="p-5 pt-0 opacity-70"> Ready to go, already has Sessions Bot.</p>
                <div
                    class="flex flex-wrap flex-row gap-2 pb-4 justify-center items-center w-full bg-white/5 border-y-2 border-ring">
                    <!-- Guilds List -->
                    <span
                        class="flex flex-wrap flex-row gap-2 justify-center items-center w-full p-4 pb-2 max-h-100 overflow-y-auto">

                        <Button v-for="guild of guildsWSession" @click="selectReadyServer(guild?.id)" unstyled
                            class="bg-black/40 grow hover:bg-black/20 hover:ring-[2px] ring-indigo-400/80 cursor-pointer transition-all p-4 min-w-27 rounded-sm flex flex-col gap-1 justify-center items-center flex-wrap">
                            <img :src="guild?.icon" class="size-11 rounded-full ring-2 ring-ring" />
                            <p class="font-semibold"> {{ guild.name }} </p>
                        </Button>
                    </span>


                    <!-- Save Choice Check -->
                    <span class="w-full flex flex-row gap-1 items-center justify-center">
                        <Checkbox size="small" class="scale-90" binary input-id="rememberGuild"
                            v-model="saveGuildChoiceEnabled" :dt="checkboxDT"
                            @value-change="(c) => { if (!c) { savedGuildChoice.clear() } }" />
                        <label for="rememberGuild" class="text-xs">
                            Remember my choice for next time
                        </label>
                    </span>


                    <!-- Resync Info -->
                    <span class="flex w-full">
                        <p class="opacity-70 mx-5 text-xs text-center w-full">
                            Not seeing the server you're looking for?
                            Refresh your data on your
                            <span class="text-sky-500 cursor-pointer hover:underline" @click="router.push('/account')">
                                account</span>
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
                <p class="text-xs p-3 pt-0 opacity-70"> To a server you manage/own: </p>
                <!-- Basic - Invite Button -->
                <a :href="externalUrls.inviteBot">
                    <Button unstyled
                        class="px-2 mb-5 py-1.25 rounded-sm drop-shadow-md bg-zinc-500/80 hover:bg-indigo-500 transition-all cursor-pointer flex flex-row gap-1.25 items-center justify-center">
                        <i class="pi pi-discord drop-shadow-sm" />
                        <p class="font-medium text-sm text-shadow-sm"> Invite the Bot </p>
                    </Button>
                </a>
                <!-- All Not Yet Added Manageable Server List -->
                <div v-if="guildsWOSession" hidden
                    class="flex flex-wrap flex-row gap-2 justify-center items-center w-full bg-white/5 p-4 max-h-50 overflow-auto">

                    <Button hidden v-for="guild of guildsWOSession.slice(0, maxWOSessionsLength)" unstyled
                        @click="(e) => { defaultWindow?.open(externalUrls.inviteBot) }"
                        class="bg-black/40 grow hover:bg-black/20 cursor-pointer transition-all p-4 rounded-sm flex flex-row gap-1 justify-center items-center flex-nowrap">
                        <img :src="guild?.icon" class="size-5 rounded-full ring-2 ring-ring" />
                        <p class="p-1 text-nowrap"> {{ guild.name }} </p>
                    </Button>

                    <span v-if="(guildsWOSession.length - maxWOSessionsLength) >= 1"
                        class="flex justify-center items-center flex-col p-2 pb-0 w-full">
                        <p class="font-medium text-sm"> + {{ guildsWOSession.length - maxWOSessionsLength }} More
                            Server(s) </p>
                    </span>

                    <Button unstyled
                        class="px-2 py-1.25 rounded-md drop-shadow-md active:scale-95 bg-indigo-500 hover:bg-indigo-400 transition-all cursor-pointer flex flex-row gap-1 items-center justify-center">
                        <i class="pi pi-discord" />
                        <p> Invite the Bot</p>
                    </Button>

                    <!-- Resync Info -->
                    <span class="flex w-full">
                        <p class="text-xs opacity-45 text-center w-full"> (click any to proceed) </p>
                    </span>

                </div>


            </span>


            <!-- Syncing and Search Options -->


        </section>

    </div>
</template>


<style scoped></style>