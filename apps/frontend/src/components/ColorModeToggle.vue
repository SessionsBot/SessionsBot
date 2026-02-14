<script lang="ts" setup>

    const colorMode = useColorMode({
        disableTransition: false,
    })

    function toggleColorMode() {
        if (colorMode.value == 'auto')
            return colorMode.value = 'dark'
        if (colorMode.value == 'dark')
            return colorMode.value = 'light'
        if (colorMode.value == 'light')
            return colorMode.value = 'auto'
    }



</script>


<template>

    <!-- Toggler -->
    <div @click="toggleColorMode" class="bg-bg-2 border-2 border-ring-2">
        Toggle Color Mode {{ colorMode }}
    </div>

</template>


<style scoped></style>