<script setup lang="ts">
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="app">
    <h1>将棋盤</h1>
    <NavBar />
    <router-view />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h1 {
  font-size: 1.4rem;
  color: #333;
}
</style>
