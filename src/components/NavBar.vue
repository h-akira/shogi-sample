<script setup lang="ts">
</script>

<template>
  <nav class="navbar">
    <router-link to="/" class="nav-link" exact-active-class="active">
      トップ
    </router-link>
    <router-link to="/play" class="nav-link" active-class="active">
      入力モード
    </router-link>
    <router-link to="/replay" class="nav-link" active-class="active">
      再生モード
    </router-link>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  gap: 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow: hidden;
  width: fit-content;
}

.nav-link {
  padding: 6px 20px;
  border-right: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: bold;
  color: #666;
  text-decoration: none;
}

.nav-link:last-child {
  border-right: none;
}

.nav-link.active {
  background: #8b4513;
  color: #fff;
}

.nav-link:hover:not(.active) {
  background: #f0f0f0;
}
</style>
