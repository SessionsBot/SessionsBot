<script lang="ts" setup>
    import { useAuthStore } from '@/stores/auth';
    import { useNavStore } from '@/stores/nav';


    // Define Incoming Props:
    const props = defineProps<{
        selectedGuildId: string | undefined
    }>()

    // Services:
    const auth = useAuthStore();
    const nav = useNavStore();

    // Guild Data:
    const userGuildData = computed(() => {
        if (!props.selectedGuildId) return null;
        return auth.userData?.guilds.manageable.find((g) => (g.id == props.selectedGuildId))
    })

</script>


<template>
    <main class="justify-center items-center p-5">
        Server Dashboard!
        <p v-if="userGuildData"> {{ userGuildData }} </p>
        <p v-else> No Data Found :/ </p>

    </main>
</template>


<style scoped></style>