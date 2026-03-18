<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiRequest, getCurrentUser, getSafeImageUrl, PLACEHOLDER_IMG } from '../api'

const route = useRoute()
const router = useRouter()
const item = ref(null)
const error = ref('')
const phoneBox = ref('')
const inFavorites = ref(false)

const id = computed(() => route.params.id)

onMounted(async () => {
  if (!id.value) {
    error.value = 'Не указан id'
    return
  }
  try {
    item.value = await apiRequest('/items/' + id.value)
    inFavorites.value = !!item.value?.inFavorites
  } catch (e) {
    error.value = e.message
  }
})

function imgSrc() {
  return getSafeImageUrl(item.value?.image) || PLACEHOLDER_IMG
}

async function startChat() {
  const user = getCurrentUser()
  if (!user) {
    router.push('/auth')
    return
  }
  try {
    const chat = await apiRequest('/chats', {
      method: 'POST',
      body: JSON.stringify({ itemId: item.value.id, message: 'Здравствуйте, объявление актуально?' }),
    })
    router.push('/messages?chatId=' + chat.id)
  } catch (e) {
    alert(e.message)
  }
}

async function showPhone() {
  const user = getCurrentUser()
  if (!user) {
    router.push('/auth')
    return
  }
  try {
    const data = await apiRequest('/items/' + item.value.id + '/call', { method: 'POST' })
    phoneBox.value = 'Телефон продавца: ' + data.phone + '. Звонок зафиксирован.'
  } catch (e) {
    alert(e.message)
  }
}

async function toggleFavorite() {
  const user = getCurrentUser()
  if (!user) {
    router.push('/auth')
    return
  }
  try {
    if (inFavorites.value) {
      await apiRequest('/favorites/' + item.value.id, { method: 'DELETE' })
      inFavorites.value = false
    } else {
      await apiRequest('/favorites/' + item.value.id, { method: 'POST' })
      inFavorites.value = true
    }
  } catch (e) {
    alert(e.message)
  }
}
</script>

<template>
  <div class="item-wrap">
    <div v-if="error" class="panel">{{ error }}</div>
    <div v-else-if="item" class="panel">
      <div class="item-layout">
        <div>
          <img class="item-image" :src="imgSrc()" :alt="item.title" referrerpolicy="no-referrer" @error="e => e.target.src = PLACEHOLDER_IMG">
        </div>
        <div>
          <h1>{{ item.title }}</h1>
          <p class="item-price">{{ Number(item.price).toLocaleString('ru-RU') }} ₽</p>
          <p class="muted">{{ item.location }} · {{ item.category }}</p>
          <div class="item-description">{{ item.description || '' }}</div>
          <div class="panel">
            <h3>Продавец</h3>
            <p>{{ item.seller?.name || 'Пользователь' }}</p>
            <div class="row">
              <button type="button" class="primary-btn" @click="startChat">Написать</button>
              <button type="button" class="secondary-btn" @click="showPhone">Показать телефон</button>
              <button type="button" class="muted-btn" :class="{ 'favorite-active': inFavorites }" @click="toggleFavorite">
                {{ inFavorites ? 'В избранном' : 'В избранное' }}
              </button>
            </div>
            <p v-if="phoneBox" class="muted" style="margin-top:10px;">{{ phoneBox }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
