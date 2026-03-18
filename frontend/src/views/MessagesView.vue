<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiRequest, getCurrentUser } from '../api'

const route = useRoute()
const user = ref(null)
const chats = ref([])
const currentChat = ref(null)
const messages = ref([])
const newMessage = ref('')
const chatId = ref(route.query.chatId || '')

onMounted(async () => {
  user.value = getCurrentUser()
  if (!user.value) return
  try {
    chats.value = await apiRequest('/chats') || []
    if (chatId.value) openChat(chatId.value)
  } catch (e) {
    console.error(e)
  }
})

watch(() => route.query.chatId, id => {
  if (id) openChat(id)
})

async function openChat(id) {
  chatId.value = id
  try {
    currentChat.value = chats.value.find(c => String(c.id) === String(id)) || { id: id }
    const data = await apiRequest('/chats/' + id + '/messages')
    messages.value = Array.isArray(data) ? data : (data?.messages || [])
  } catch (e) {
    messages.value = []
  }
}

async function sendMessage(e) {
  e?.preventDefault()
  const text = newMessage.value?.trim()
  if (!text || !chatId.value) return
  try {
    await apiRequest('/chats/' + chatId.value + '/messages', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    newMessage.value = ''
    const data = await apiRequest('/chats/' + chatId.value + '/messages')
    messages.value = Array.isArray(data) ? data : (data?.messages || [])
  } catch (e) {
    alert(e.message)
  }
}
</script>

<template>
  <div class="messages-wrap">
    <div v-if="!user" class="panel">Войдите, чтобы видеть сообщения</div>
    <div v-else class="panel" style="display: grid; grid-template-columns: 280px 1fr; gap: 12px;">
      <div class="chat-list">
        <router-link
          v-for="c in chats"
          :key="c.id"
          :to="'/messages?chatId=' + c.id"
          class="chat-item"
          :class="{ active: String(c.id) === String(chatId) }"
        >
          {{ c.itemTitle || 'Чат #' + c.id }}
        </router-link>
      </div>
      <div v-if="chatId">
        <div class="messages-box">
          <div v-for="m in messages" :key="m.id" :class="['msg', m.senderId === user?.id ? 'me' : 'peer']">
            {{ m.text }}
          </div>
        </div>
        <form class="row" style="margin-top:8px;" @submit="sendMessage">
          <input v-model="newMessage" type="text" placeholder="Сообщение" style="flex:1;">
          <button type="submit" class="primary-btn">Отправить</button>
        </form>
      </div>
      <div v-else class="muted">Выберите чат</div>
    </div>
  </div>
</template>
