<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiRequest, setToken, setCurrentUser, assertAuthPayload } from '../api'

const router = useRouter()
const route = useRoute()
const tab = ref('login')
const loginEmail = ref('')
const loginPassword = ref('')
const regName = ref('')
const regEmail = ref('')
const regPhone = ref('')
const regPassword = ref('')
const expiredMessage = ref(false)

onMounted(() => {
  expiredMessage.value = route.query.expired === '1'
})

async function onLoginSubmit(e) {
  e?.preventDefault()
  try {
    const data = assertAuthPayload(await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail.value.trim(), password: loginPassword.value }),
    }))
    setToken(data.token)
    setCurrentUser(data.user)
    router.replace('/')
  } catch (err) {
    alert(err.message)
  }
}

async function onRegisterSubmit(e) {
  e?.preventDefault()
  try {
    const data = assertAuthPayload(await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: regName.value.trim(),
        email: regEmail.value.trim(),
        phone: regPhone.value.trim(),
        password: regPassword.value,
      }),
    }))
    setToken(data.token)
    setCurrentUser(data.user)
    router.replace('/')
  } catch (err) {
    alert(err.message)
  }
}
</script>

<template>
  <div class="auth-wrap">
    <div class="panel">
      <p v-if="expiredMessage" class="muted" style="margin-bottom:12px;padding:10px;background:#fff3cd;border-radius:8px;color:#856404;">
        Сессия истекла или сервер перезапущен. Войдите снова.
      </p>
      <h1>Авторизация</h1>
      <div class="tabs">
        <button type="button" :class="{ active: tab === 'login' }" @click="tab = 'login'">Вход</button>
        <button type="button" :class="{ active: tab === 'register' }" @click="tab = 'register'">Регистрация</button>
      </div>
      <form v-if="tab === 'login'" class="form-grid" @submit="onLoginSubmit">
        <input v-model="loginEmail" type="email" placeholder="Email" required class="form-row-full">
        <input v-model="loginPassword" type="password" placeholder="Пароль" required class="form-row-full">
        <button type="submit" class="primary-btn form-row-full">Войти</button>
      </form>
      <form v-else class="form-grid" @submit="onRegisterSubmit">
        <input v-model="regName" type="text" placeholder="Имя" required class="form-row-full">
        <input v-model="regEmail" type="email" placeholder="Email" required class="form-row-full">
        <input v-model="regPhone" type="text" placeholder="Телефон" class="form-row-full">
        <input v-model="regPassword" type="password" placeholder="Пароль" required class="form-row-full">
        <button type="submit" class="primary-btn form-row-full">Создать аккаунт</button>
      </form>
    </div>
  </div>
</template>
