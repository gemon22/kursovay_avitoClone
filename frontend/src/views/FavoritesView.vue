<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest, getCurrentUser, getSafeImageUrl, PLACEHOLDER_IMG } from '../api'

const router = useRouter()
const items = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (!getCurrentUser()) {
    router.replace('/auth')
    return
  }
  try {
    const data = await apiRequest('/favorites')
    items.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
})

function imgSrc(item) {
  return getSafeImageUrl(item?.image) || PLACEHOLDER_IMG
}

async function removeFavorite(item) {
  try {
    await apiRequest('/favorites/' + item.id, { method: 'DELETE' })
    items.value = items.value.filter((i) => i.id !== item.id)
  } catch (e) {
    alert(e.message)
  }
}
</script>

<template>
  <div class="favorites-wrap">
    <h1>Избранное</h1>
    <div v-if="loading" class="panel">Загрузка…</div>
    <div v-else-if="error" class="panel">{{ error }}</div>
    <div v-else-if="!items.length" class="panel empty-state">В избранном пока ничего нет</div>
    <div v-else class="items-grid">
      <div v-for="item in items" :key="item.id" class="item-card">
        <router-link :to="'/item/' + item.id" class="item-card-link">
          <img :src="imgSrc(item)" :alt="item.title" referrerpolicy="no-referrer" @error="e => e.target.src = PLACEHOLDER_IMG">
          <div class="item-card-content">
            <h3>{{ item.title }}</h3>
            <div class="item-price">{{ Number(item.price).toLocaleString('ru-RU') }} ₽</div>
            <div class="item-details">{{ item.location }} · {{ item.category }}</div>
          </div>
        </router-link>
        <button type="button" class="muted-btn remove-fav-btn" @click="removeFavorite(item)">Удалить из избранного</button>
      </div>
    </div>
  </div>
</template>
