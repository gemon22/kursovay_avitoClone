<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userRef } from './api'

const router = useRouter()
const route = useRoute()
const searchQ = ref(route.query.q || '')
const avatarImgError = ref(false)

watch(() => route.query.q, v => { searchQ.value = v || '' })
watch(() => userRef.value?.avatarUrl, () => { avatarImgError.value = false })

const showAvatarLetter = computed(() => !userRef.value?.avatarUrl || avatarImgError.value)

function onSearchSubmit() {
  router.replace({ path: '/', query: { ...route.query, q: searchQ.value || undefined } })
}
</script>

<template>
  <div class="app-wrap">
  <header class="topbar">
    <div class="container topbar-inner">
      <router-link to="/" class="logo">avito</router-link>
      <form class="search-line" @submit.prevent="onSearchSubmit">
        <input v-model="searchQ" type="text" placeholder="Поиск по объявлениям">
        <button type="submit">Найти</button>
      </form>
      <template v-if="userRef">
        <router-link to="/favorites" class="link-btn">Избранное</router-link>
        <router-link to="/messages" class="link-btn">Сообщения</router-link>
        <router-link to="/?create=1" class="primary-btn">Разместить объявление</router-link>
        <router-link to="/profile" class="header-profile user-chip-right" :title="userRef.name || userRef.email">
          <span class="header-avatar">
            <img v-if="userRef.avatarUrl && !avatarImgError" :src="userRef.avatarUrl" alt="" class="header-avatar-img" referrerpolicy="no-referrer" @error="avatarImgError = true">
            <span v-if="showAvatarLetter" class="header-avatar-letter">{{ (userRef.name || userRef.email || '?').charAt(0).toUpperCase() }}</span>
          </span>
          <span class="header-profile-label">Профиль</span>
        </router-link>
      </template>
      <template v-else>
        <router-link to="/auth" class="link-btn">Вход и регистрация</router-link>
        <router-link to="/auth" class="primary-btn">Разместить объявление</router-link>
      </template>
    </div>
  </header>
  <main class="container page single-column">
    <router-view />
  </main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <span class="logo">avito</span>
      <p class="muted">Объявления. Учебный проект.</p>
    </div>
  </footer>
  </div>
</template>
