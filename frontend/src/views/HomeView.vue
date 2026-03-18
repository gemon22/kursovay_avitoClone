<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiRequest, getCurrentUser, getSafeImageUrl, uploadPhoto, PLACEHOLDER_IMG } from '../api'

const route = useRoute()
const router = useRouter()
const items = ref([])
const loading = ref(true)
const error = ref('')
const filtersOpen = ref(false)
const createFormOpen = ref(false)
const createPayload = ref({ title: '', price: '', formCategory: '', formLocation: '', image: '', description: '' })
const uploadStatus = ref('')
const user = computed(() => getCurrentUser())
const favoriteIds = ref(new Set())

onMounted(loadFavorites)
watch(user, () => loadFavorites(), { immediate: true })

async function loadFavorites() {
  if (!user.value) {
    favoriteIds.value = new Set()
    return
  }
  try {
    const data = await apiRequest('/favorites')
    favoriteIds.value = new Set(Array.isArray(data) ? data.map((i) => i.id) : [])
  } catch {
    favoriteIds.value = new Set()
  }
}

async function toggleFavorite(item, e) {
  e.preventDefault()
  e.stopPropagation()
  if (!user.value) return
  try {
    if (favoriteIds.value.has(item.id)) {
      await apiRequest('/favorites/' + item.id, { method: 'DELETE' })
      favoriteIds.value = new Set([...favoriteIds.value].filter((id) => id !== item.id))
    } else {
      await apiRequest('/favorites/' + item.id, { method: 'POST' })
      favoriteIds.value = new Set([...favoriteIds.value, item.id])
    }
  } catch (err) {
    alert(err.message)
  }
}

const query = computed(() => {
  const q = route.query.q || ''
  const category = route.query.category || ''
  const location = route.query.location || ''
  const priceFrom = route.query.priceFrom || ''
  const priceTo = route.query.priceTo || ''
  return { q, category, location, priceFrom, priceTo }
})

watch([() => route.query], loadItems, { immediate: true })
watch(() => route.query.create, v => { createFormOpen.value = v === '1' }, { immediate: true })

async function loadItems() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (query.value.q) params.set('q', query.value.q)
    if (query.value.category) params.set('category', query.value.category)
    if (query.value.location) params.set('location', query.value.location)
    if (query.value.priceFrom) params.set('priceFrom', query.value.priceFrom)
    if (query.value.priceTo) params.set('priceTo', query.value.priceTo)
    const qs = params.toString()
    const data = await apiRequest('/items' + (qs ? '?' + qs : ''))
    items.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

function applyFilters(form) {
  const category = (form.category?.value ?? '').trim()
  const location = (form.location?.value ?? '').trim()
  const priceFrom = (form.priceFrom?.value ?? '').trim()
  const priceTo = (form.priceTo?.value ?? '').trim()
  router.replace({ query: { ...route.query, category: category || undefined, location: location || undefined, priceFrom: priceFrom || undefined, priceTo: priceTo || undefined } })
}

function clearFilters() {
  router.replace({ query: {} })
}

function imgSrc(item) {
  return getSafeImageUrl(item?.image) || PLACEHOLDER_IMG
}

function onImgError(e) {
  e.target.src = PLACEHOLDER_IMG
}

async function onFileChange(e) {
  const file = e.target?.files?.[0]
  if (!file) return
  uploadStatus.value = 'Загрузка…'
  try {
    const url = await uploadPhoto(file)
    if (url) createPayload.value.image = url
    uploadStatus.value = 'Загружено'
  } catch (err) {
    uploadStatus.value = err.message || 'Ошибка'
  }
}

async function submitCreate() {
  const p = createPayload.value
  if (!p.title?.trim() || !p.price || !p.formCategory?.trim() || !p.formLocation?.trim()) {
    alert('Заполните обязательные поля')
    return
  }
  try {
    await apiRequest('/items', {
      method: 'POST',
      body: JSON.stringify({
        title: p.title.trim(),
        price: Number(p.price),
        category: p.formCategory.trim(),
        location: p.formLocation.trim(),
        image: (p.image || '').trim(),
        description: (p.description || '').trim(),
      }),
    })
    createFormOpen.value = false
    createPayload.value = { title: '', price: '', formCategory: '', formLocation: '', image: '', description: '' }
    router.replace({ query: { ...route.query, create: undefined } })
    loadItems()
  } catch (err) {
    alert(err.message)
  }
}

function cancelCreate() {
  createFormOpen.value = false
  router.replace({ query: { ...route.query, create: undefined } })
}
</script>

<template>
  <section class="content">
    <div v-show="filtersOpen" class="panel filters-menu">
      <form @submit.prevent="applyFilters($event.target)">
        <div class="filters-grid">
          <div>
            <label>Категория</label>
            <select name="category" :value="query.category">
              <option value="">Все категории</option>
              <option>Электроника</option>
              <option>Недвижимость</option>
              <option>Авто</option>
              <option>Услуги</option>
            </select>
          </div>
          <div>
            <label>Город</label>
            <input name="location" type="text" placeholder="Москва" :value="query.location">
          </div>
          <div>
            <label>Цена от</label>
            <input name="priceFrom" type="number" min="0" :value="query.priceFrom">
          </div>
          <div>
            <label>Цена до</label>
            <input name="priceTo" type="number" min="0" :value="query.priceTo">
          </div>
        </div>
        <div class="row">
          <button type="submit" class="primary-btn">Применить</button>
          <button type="button" class="secondary-btn" @click="clearFilters">Сбросить</button>
        </div>
      </form>
    </div>

    <div v-show="createFormOpen && user" class="panel">
      <h2>Новое объявление</h2>
      <div class="form-grid">
        <input v-model="createPayload.title" type="text" placeholder="Название" class="form-row-full">
        <input v-model.number="createPayload.price" type="number" placeholder="Цена" class="form-row-full">
        <input v-model="createPayload.formCategory" type="text" placeholder="Категория" class="form-row-full">
        <input v-model="createPayload.formLocation" type="text" placeholder="Город" class="form-row-full">
        <div class="form-row-full">
          <label>Фото (макс. 2 МБ, рекомендуемое разрешение до 800×600)</label>
          <input type="file" accept="image/*" @change="onFileChange">
          <span class="muted">{{ uploadStatus }}</span>
          <input v-model="createPayload.image" type="text" placeholder="или ссылка на фото" class="form-row-full">
        </div>
        <textarea v-model="createPayload.description" placeholder="Описание" class="form-row-full"></textarea>
      </div>
      <div class="row">
        <button type="button" class="primary-btn" @click="submitCreate">Опубликовать</button>
        <button type="button" class="secondary-btn" @click="cancelCreate">Отмена</button>
      </div>
    </div>

    <div class="row between">
      <h1>Объявления</h1>
      <span class="muted">Найдено: {{ items.length }}</span>
    </div>
    <div class="row">
      <button type="button" class="secondary-btn" @click="filtersOpen = !filtersOpen">Фильтры</button>
    </div>
    <div v-if="loading" class="panel">Загрузка…</div>
    <div v-else-if="error" class="panel">{{ error }}</div>
    <div v-else-if="!items.length" class="panel">Объявления не найдены</div>
    <div v-else class="items-grid">
      <div v-for="item in items" :key="item.id" class="item-card">
        <router-link :to="'/item/' + item.id" class="item-card-link">
          <img :src="imgSrc(item)" :alt="item.title" loading="lazy" referrerpolicy="no-referrer" @error="onImgError">
          <div class="item-card-content">
            <h3>{{ item.title }}</h3>
            <div class="item-price">{{ Number(item.price).toLocaleString('ru-RU') }} ₽</div>
            <div class="item-details">{{ item.location || 'Не указан' }}</div>
            <div class="item-details">{{ item.category || 'Другое' }}</div>
          </div>
        </router-link>
        <button v-if="user" type="button" class="muted-btn item-fav-btn" :class="{ active: favoriteIds.has(item.id) }" @click="toggleFavorite(item, $event)">
          {{ favoriteIds.has(item.id) ? 'В избранном' : 'В избранное' }}
        </button>
      </div>
    </div>
  </section>
</template>
