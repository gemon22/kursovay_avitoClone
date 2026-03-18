<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest, getCurrentUser, getSafeImageUrl, logout, setCurrentUser, uploadPhoto, PLACEHOLDER_IMG } from '../api'

const router = useRouter()
const user = ref(null)
const myItems = ref([])
const calls = ref([])
const loadError = ref('')
const adsTab = ref('active')
const editProfileOpen = ref(false)
const profileForm = ref({ name: '', phone: '', avatarUrl: '' })
const profileSaveStatus = ref('')
const editingItemId = ref(null)
const editItemForm = ref({ title: '', price: '', category: '', location: '', description: '', image: '' })
const editItemStatus = ref('')

onMounted(async () => {
  const u = getCurrentUser()
  if (!u) {
    router.replace('/auth')
    return
  }
  try {
    user.value = await apiRequest('/auth/me')
    myItems.value = await apiRequest('/items?ownerId=' + u.id + '&status=all')
    calls.value = await apiRequest('/calls') || []
  } catch (e) {
    loadError.value = e.message
  }
})

function openEditProfile() {
  profileForm.value = {
    name: user.value?.name || '',
    phone: user.value?.phone || '',
    avatarUrl: user.value?.avatarUrl || '',
  }
  editProfileOpen.value = true
  profileSaveStatus.value = ''
}

async function onProfileAvatarFile(e) {
  const file = e.target?.files?.[0]
  if (!file) return
  try {
    const url = await uploadPhoto(file)
    if (url) profileForm.value.avatarUrl = url
  } catch (err) {
    profileSaveStatus.value = err.message || 'Ошибка загрузки'
  }
}

async function saveProfile() {
  profileSaveStatus.value = ''
  try {
    const updated = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        name: profileForm.value.name.trim(),
        phone: profileForm.value.phone.trim(),
        avatarUrl: (profileForm.value.avatarUrl || '').trim(),
      }),
    })
    user.value = updated
    setCurrentUser(updated)
    editProfileOpen.value = false
  } catch (e) {
    profileSaveStatus.value = e.message || 'Ошибка'
  }
}

function openEditItem(item) {
  editingItemId.value = item.id
  editItemForm.value = {
    title: item.title || '',
    price: String(item.price ?? ''),
    category: item.category || '',
    location: item.location || '',
    description: item.description || '',
    image: item.image || '',
  }
  editItemStatus.value = ''
}

function closeEditItem() {
  editingItemId.value = null
  editItemStatus.value = ''
}

async function saveItem() {
  if (!editingItemId.value) return
  editItemStatus.value = ''
  try {
    const payload = {
      title: editItemForm.value.title.trim(),
      price: Number(editItemForm.value.price) || 0,
      category: editItemForm.value.category.trim(),
      location: editItemForm.value.location.trim(),
      description: (editItemForm.value.description || '').trim(),
      image: (editItemForm.value.image || '').trim(),
    }
    const updated = await apiRequest('/items/' + editingItemId.value, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    const idx = myItems.value.findIndex((i) => i.id === editingItemId.value)
    if (idx !== -1) myItems.value[idx] = { ...myItems.value[idx], ...updated }
    closeEditItem()
  } catch (e) {
    editItemStatus.value = e.message || 'Ошибка'
  }
}

const activeItems = () => myItems.value.filter(i => i.status === 'active')
const archivedItems = () => myItems.value.filter(i => i.status === 'archived')
const displayedItems = () => adsTab.value === 'active' ? activeItems() : archivedItems()

function doLogout() {
  logout()
  router.push('/')
}

function imgSrc(item) {
  return getSafeImageUrl(item?.image) || PLACEHOLDER_IMG
}

async function archiveItem(id) {
  try {
    await apiRequest('/items/' + id, { method: 'PUT', body: JSON.stringify({ status: 'archived' }) })
    const item = myItems.value.find(i => i.id === id)
    if (item) item.status = 'archived'
  } catch (e) {
    alert(e.message)
  }
}

async function restoreItem(id) {
  try {
    await apiRequest('/items/' + id, { method: 'PUT', body: JSON.stringify({ status: 'active' }) })
    const item = myItems.value.find(i => i.id === id)
    if (item) item.status = 'active'
  } catch (e) {
    alert(e.message)
  }
}

async function removeItem(id) {
  if (!confirm('Удалить объявление?')) return
  try {
    await apiRequest('/items/' + id, { method: 'DELETE' })
    myItems.value = myItems.value.filter(i => i.id !== id)
  } catch (e) {
    alert(e.message)
  }
}
</script>

<template>
  <div class="profile-wrap">
    <div v-if="loadError" class="panel profile-error">{{ loadError }}</div>

    <div v-else class="profile-layout">
      <aside class="profile-sidebar">
        <div class="panel profile-card">
          <div class="profile-avatar">
            <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" class="profile-avatar-img" referrerpolicy="no-referrer" @error="e => e.target.style.display = 'none'">
            <span v-else class="avatar-letter">{{ (user?.name || user?.email || '?').charAt(0).toUpperCase() }}</span>
          </div>
          <h2 class="profile-name">{{ user?.name || 'Пользователь' }}</h2>
          <dl class="profile-details">
            <dt>Email</dt>
            <dd>{{ user?.email || '—' }}</dd>
            <dt>Телефон</dt>
            <dd>{{ user?.phone || 'Не указан' }}</dd>
          </dl>

          <div v-if="editProfileOpen" class="profile-edit-form">
            <label>Имя</label>
            <input v-model="profileForm.name" type="text" placeholder="Имя">
            <label>Телефон</label>
            <input v-model="profileForm.phone" type="text" placeholder="Телефон">
            <label>Фото профиля (ссылка или загрузка, макс. 2 МБ, до 800×600)</label>
            <input v-model="profileForm.avatarUrl" type="text" placeholder="URL картинки">
            <input type="file" accept="image/*" @change="onProfileAvatarFile">
            <p v-if="profileSaveStatus" class="form-status error">{{ profileSaveStatus }}</p>
            <div class="row">
              <button type="button" class="primary-btn" @click="saveProfile">Сохранить</button>
              <button type="button" class="secondary-btn" @click="editProfileOpen = false">Отмена</button>
            </div>
          </div>
          <div v-else class="profile-actions">
            <button type="button" class="secondary-btn" @click="openEditProfile">Редактировать профиль</button>
            <router-link to="/messages" class="secondary-btn">Сообщения</router-link>
            <button type="button" class="muted-btn logout-btn" @click="doLogout">Выйти</button>
          </div>
        </div>
      </aside>

      <div class="profile-main">
        <div class="panel">
          <h3>Мои объявления</h3>
          <div class="tabs profile-tabs">
            <button type="button" class="tabs-btn" :class="{ active: adsTab === 'active' }" @click="adsTab = 'active'">Активные ({{ activeItems().length }})</button>
            <button type="button" class="tabs-btn" :class="{ active: adsTab === 'archived' }" @click="adsTab = 'archived'">В архиве ({{ archivedItems().length }})</button>
          </div>
          <div v-if="!displayedItems().length" class="empty-state">{{ adsTab === 'archived' ? 'В архиве пока пусто' : 'У вас пока нет объявлений' }}</div>
          <div v-else class="items-grid">
            <div v-for="item in displayedItems()" :key="item.id" class="item-card profile-item-card" @click="openEditItem(item)">
              <img :src="imgSrc(item)" :alt="item.title" referrerpolicy="no-referrer" @error="e => e.target.src = PLACEHOLDER_IMG">
              <div class="item-card-content">
                <h3>{{ item.title }}</h3>
                <div class="item-price">{{ Number(item.price).toLocaleString('ru-RU') }} ₽</div>
                <div v-if="item.viewCount !== undefined || item.favoriteCount !== undefined" class="item-stats">
                  <span v-if="item.viewCount !== undefined">Просмотров: {{ item.viewCount }}</span>
                  <span v-if="item.favoriteCount !== undefined">В избранном: {{ item.favoriteCount }}</span>
                </div>
                <div class="item-card-actions">
                  <button type="button" class="secondary-btn btn-fixed" @click.stop="openEditItem(item)">Редактировать</button>
                  <template v-if="adsTab === 'active'">
                    <button type="button" class="secondary-btn btn-fixed" @click.stop="archiveItem(item.id)">В архив</button>
                    <button type="button" class="muted-btn btn-fixed" @click.stop="removeItem(item.id)">Удалить</button>
                  </template>
                  <template v-else>
                    <button type="button" class="secondary-btn btn-fixed" @click.stop="restoreItem(item.id)">Восстановить</button>
                    <button type="button" class="muted-btn btn-fixed" @click.stop="removeItem(item.id)">Удалить</button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="calls.length" class="panel">
          <h3>История звонков</h3>
          <ul class="calls-list">
            <li v-for="c in calls" :key="c.id"><span class="call-item">{{ c.itemTitle }}</span> <span class="call-phone">{{ c.phone }}</span></li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="editingItemId" class="edit-modal-backdrop" @click.self="closeEditItem">
      <div class="panel edit-modal">
        <div class="edit-modal-header">
          <h2 class="edit-modal-title">Редактирование объявления</h2>
          <button type="button" class="muted-btn" @click="closeEditItem">Закрыть</button>
        </div>
        <div class="edit-modal-body">
          <div class="form-grid">
            <input v-model="editItemForm.title" type="text" placeholder="Название" class="form-row-full">
            <input v-model="editItemForm.price" type="number" placeholder="Цена" class="form-row-full">
            <input v-model="editItemForm.category" type="text" placeholder="Категория" class="form-row-full">
            <input v-model="editItemForm.location" type="text" placeholder="Город" class="form-row-full">
            <textarea v-model="editItemForm.description" placeholder="Описание" class="form-row-full"></textarea>
            <input v-model="editItemForm.image" type="text" placeholder="Ссылка на фото" class="form-row-full">
          </div>
          <p v-if="editItemStatus" class="form-status error">{{ editItemStatus }}</p>
          <div class="row">
            <button type="button" class="primary-btn" @click="saveItem">Сохранить</button>
            <button type="button" class="secondary-btn" @click="closeEditItem">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
